import { describe, it, expect, beforeEach } from 'vitest';
import { calculateMonth } from '../../js/views/monthlyReport.js';
import {
  openDatabase,
  addPerson,
  addProject,
  addAllocation,
  addFteValue,
  addBudgetValue,
  clearCache
} from '../../js/data/database.js';

describe('Monthly Report - Matching Funds Deduction Verification', () => {
  beforeEach(async () => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="resultsOutput"></div>
      <input type="text" id="monthInput" value="2024-06">
      <button id="calculateBtn">Calculate</button>
    `;
    
    await openDatabase();
    clearCache();
    
    // Clear database
    const db = await openDatabase();
    const tx = db.transaction(["people", "projects", "defaultAllocations", "fteValues", "budgetValues"], "readwrite");
    await tx.objectStore("people").clear();
    await tx.objectStore("projects").clear();
    await tx.objectStore("defaultAllocations").clear();
    await tx.objectStore("fteValues").clear();
    await tx.objectStore("budgetValues").clear();
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    clearCache();
  });

  it('should deduct matching funds allocations from base funding', async () => {
    // Step 1: Create a base funding project for type 210
    await addProject({
      id: 'bf210',
      name: 'Base Funding 210',
      isBaseFunding: true,
      baseFundingType: '210'
    });
    
    // Add budget for base funding: 10 PM per month
    await addBudgetValue({
      projectId: 'bf210',
      plannedPM: 10.0,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    // Step 2: Create a MATCHING FUNDS project
    await addProject({
      id: 'proj001',
      name: 'Project with Matching Funds',
      deductsFromBaseFunding: true,  // This is the key flag
      baseFundingTypeId: '210'       // Links to base funding type 210
    });
    
    // Step 3: Create a person of type 210
    await addPerson({
      id: 'p001',
      name: 'Alice',
      type: '210',
      active: true
    });
    
    // Add FTE value
    await addFteValue({
      personId: 'p001',
      fte: 1.0,
      startMonth: '2024-01',
      endMonth: null
    });
    
    // Step 4: Allocate 0.5 PM from Alice to the matching funds project
    await addAllocation({
      personId: 'p001',
      projectId: 'proj001',
      pm: 0.5,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    // Step 5: Generate monthly report for June 2024
    await calculateMonth('2024-06');
    
    const output = document.getElementById('resultsOutput');
    
    // Verify the report contains base funding summary
    expect(output.innerHTML).toContain('Base Funding Summary');
    
    // Find the base funding table
    const baseFundingTable = output.querySelector('.base-funding-table');
    expect(baseFundingTable).toBeTruthy();
    
    // Parse the table content to verify calculations
    const tableHTML = baseFundingTable.innerHTML;
    
    console.log('Base Funding Table HTML:', tableHTML);
    
    // Expected values:
    // - Planned PM: 10.00 (from budget value)
    // - Deductions: 0.50 (from allocation to matching funds project)
    // - Net Available: 9.50 (10.00 - 0.50)
    
    expect(tableHTML).toContain('10.00'); // Planned
    expect(tableHTML).toContain('0.50');  // Deductions
    expect(tableHTML).toContain('9.50');  // Net
    
    // Also verify that the PROJECT table shows the allocation to the matching funds project
    const allTables = output.querySelectorAll('table');
    const projectTable = allTables[1]; // Second table should be projects table
    const projectTableHTML = projectTable.innerHTML;
    
    console.log('Project Table HTML:', projectTableHTML);
    
    // The matching funds project should show:
    // - Allocated PM: 0.50
    expect(projectTableHTML).toContain('Project with Matching Funds');
    expect(projectTableHTML).toContain('0.50');
    
    // The base funding project should now show:
    // - Allocated PM: 0.50 (from matching funds allocation)
    // This is the KEY FIX: matching funds allocations count as allocations to base funding
    expect(projectTableHTML).toContain('Base Funding 210');
    
    // Find the Base Funding 210 row and verify it shows 0.50 allocated (not 0.00)
    const baseFundingRow = Array.from(projectTable.querySelectorAll('tbody tr'))
      .find(row => row.textContent.includes('Base Funding 210'));
    expect(baseFundingRow).toBeTruthy();
    
    // The row should have: name | allocated | planned | delta
    // We expect: Base Funding 210 | 0.50 | 10.00 | -9.50
    const cells = baseFundingRow.querySelectorAll('td');
    expect(cells[0].textContent).toBe('Base Funding 210');
    expect(cells[1].textContent).toBe('0.50'); // Allocated - this is the key assertion
    expect(cells[2].textContent).toBe('10.00'); // Planned
    expect(cells[3].textContent).toBe('-9.50'); // Delta
  });

  it('should show different deductions for different person types', async () => {
    // Create base funding for two types
    await addProject({
      id: 'bf210',
      name: 'Base Funding 210',
      isBaseFunding: true,
      baseFundingType: '210'
    });
    
    await addProject({
      id: 'bf220',
      name: 'Base Funding 220',
      isBaseFunding: true,
      baseFundingType: '220'
    });
    
    await addBudgetValue({
      projectId: 'bf210',
      plannedPM: 10.0,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    await addBudgetValue({
      projectId: 'bf220',
      plannedPM: 8.0,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    // Create matching funds project linked to type 210
    await addProject({
      id: 'proj001',
      name: 'Matching Project 210',
      deductsFromBaseFunding: true,
      baseFundingTypeId: '210'
    });
    
    // Create people of different types
    await addPerson({
      id: 'p001',
      name: 'Alice (210)',
      type: '210',
      active: true
    });
    
    await addPerson({
      id: 'p002',
      name: 'Bob (220)',
      type: '220',
      active: true
    });
    
    await addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2024-01', endMonth: null });
    await addFteValue({ personId: 'p002', fte: 1.0, startMonth: '2024-01', endMonth: null });
    
    // Allocate both people to the matching funds project
    await addAllocation({
      personId: 'p001',
      projectId: 'proj001',
      pm: 0.3,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    await addAllocation({
      personId: 'p002',
      projectId: 'proj001',
      pm: 0.4,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    // Generate report
    await calculateMonth('2024-06');
    
    const output = document.getElementById('resultsOutput');
    const baseFundingTable = output.querySelector('.base-funding-table');
    const tableHTML = baseFundingTable.innerHTML;
    
    console.log('Multi-type Base Funding Table:', tableHTML);
    
    // Base Funding 210 should show:
    // - Deduction: 0.30 (only Alice, who is type 210)
    // - Net: 10.00 - 0.30 = 9.70
    
    // Base Funding 220 should show:
    // - Deduction: 0.00 (Bob is type 220, but project links to type 210)
    // - Net: 8.00 - 0.00 = 8.00
    
    // Find the rows for each base funding type
    const rows = baseFundingTable.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    
    // Check Base Funding 210
    const bf210Row = Array.from(rows).find(row => row.innerHTML.includes('Base Funding 210'));
    expect(bf210Row).toBeTruthy();
    expect(bf210Row.innerHTML).toContain('10.00'); // Planned
    expect(bf210Row.innerHTML).toContain('0.30');  // Deductions (only Alice)
    expect(bf210Row.innerHTML).toContain('9.70');  // Net
    
    // Check Base Funding 220
    const bf220Row = Array.from(rows).find(row => row.innerHTML.includes('Base Funding 220'));
    expect(bf220Row).toBeTruthy();
    expect(bf220Row.innerHTML).toContain('8.00');  // Planned
    expect(bf220Row.innerHTML).toContain('0.00');  // Deductions (Bob doesn't count)
    expect(bf220Row.innerHTML).toContain('8.00');  // Net
    
    // Also verify the PROJECT table shows the allocations correctly
    const allTables = output.querySelectorAll('table');
    const projectTable = allTables[1]; // Second table should be projects table
    
    // Base Funding 210 should show 0.30 allocated (only Alice's allocation)
    const projectBf210Row = Array.from(projectTable.querySelectorAll('tbody tr'))
      .find(row => row.textContent.includes('Base Funding 210'));
    expect(projectBf210Row).toBeTruthy();
    const bf210Cells = projectBf210Row.querySelectorAll('td');
    expect(bf210Cells[1].textContent).toBe('0.30'); // Allocated (only Alice)
    
    // Base Funding 220 should show 0.00 allocated (no matching allocations)
    const projectBf220Row = Array.from(projectTable.querySelectorAll('tbody tr'))
      .find(row => row.textContent.includes('Base Funding 220'));
    expect(projectBf220Row).toBeTruthy();
    const bf220Cells = projectBf220Row.querySelectorAll('td');
    expect(bf220Cells[1].textContent).toBe('0.00'); // Allocated (no matching people)
  });
});
