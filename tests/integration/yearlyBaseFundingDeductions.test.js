import { describe, it, expect, beforeEach } from 'vitest';
import { calculateYear } from '../../js/views/yearlyReport.js';
import {
  openDatabase,
  getPeople,
  addPerson,
  getProjects,
  addProject,
  addAllocation,
  addFteValue,
  addBudgetValue,
  clearCache
} from '../../js/data/database.js';

describe('Yearly Report - Base Funding Deductions', () => {
  beforeEach(async () => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="resultsOutput"></div>
      <input type="number" id="yearInput" value="2024">
      <button id="calculateYearBtn">Calculate</button>
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

  it('should display base funding summary section in yearly report', async () => {
    // Setup: Create base funding project for type 210
    await addProject({
      id: 'bf210',
      name: 'Base Funding 210',
      isBaseFunding: true,
      baseFundingType: '210'
    });
    
    // Add budget for base funding
    await addBudgetValue({
      projectId: 'bf210',
      plannedPM: 10.0,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    // Create a project that deducts from base funding
    await addProject({
      id: 'proj001',
      name: 'Project A',
      deductsFromBaseFunding: true,
      baseFundingTypeId: '210'
    });
    
    // Create a person of type 210
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
    
    // Add allocation: 0.5 PM to Project A
    await addAllocation({
      personId: 'p001',
      projectId: 'proj001',
      pm: 0.5,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    // Generate yearly report
    await calculateYear(2024);
    
    const output = document.getElementById('resultsOutput');
    
    // Verify base funding section exists
    expect(output.innerHTML).toContain('Base Funding Summary');
    
    // Verify base funding project name appears
    expect(output.innerHTML).toContain('Base Funding 210');
    
    // Verify table has correct columns
    expect(output.innerHTML).toContain('Planned PM');
    expect(output.innerHTML).toContain('Deductions');
    expect(output.innerHTML).toContain('Net Available');
  });

  it('should calculate yearly base funding deductions correctly', async () => {
    // Setup: Create base funding project
    await addProject({
      id: 'bf210',
      name: 'Base Funding 210',
      isBaseFunding: true,
      baseFundingType: '210'
    });
    
    // Add budget for base funding (10 PM per month)
    await addBudgetValue({
      projectId: 'bf210',
      plannedPM: 10.0,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    // Create a project that deducts from base funding
    await addProject({
      id: 'proj001',
      name: 'Project A',
      deductsFromBaseFunding: true,
      baseFundingTypeId: '210'
    });
    
    // Create a person of type 210
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
    
    // Add allocation: 0.5 PM to Project A for full year
    await addAllocation({
      personId: 'p001',
      projectId: 'proj001',
      pm: 0.5,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    // Generate yearly report
    await calculateYear(2024);
    
    const output = document.getElementById('resultsOutput');
    const baseFundingTable = output.querySelector('.base-funding-table');
    
    // Verify base funding table exists
    expect(baseFundingTable).toBeTruthy();
    
    // The yearly total should be:
    // Planned: 10.0 PM/month * 12 months = 120.0 PM/year
    // Deductions: 0.5 PM/month * 12 months = 6.0 PM/year
    // Net: 120.0 - 6.0 = 114.0 PM/year
    expect(baseFundingTable.innerHTML).toContain('120.00'); // Total planned
    expect(baseFundingTable.innerHTML).toContain('6.00');   // Total deductions
    expect(baseFundingTable.innerHTML).toContain('114.00'); // Net available
  });

  it('should show over-allocated status when deductions exceed planned', async () => {
    // Setup: Create base funding project with low budget
    await addProject({
      id: 'bf210',
      name: 'Base Funding 210',
      isBaseFunding: true,
      baseFundingType: '210'
    });
    
    // Add budget for base funding (only 2 PM per month)
    await addBudgetValue({
      projectId: 'bf210',
      plannedPM: 2.0,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    // Create a project that deducts from base funding
    await addProject({
      id: 'proj001',
      name: 'Project A',
      deductsFromBaseFunding: true,
      baseFundingTypeId: '210'
    });
    
    // Create a person of type 210
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
    
    // Add allocation: 3.0 PM to Project A (MORE than available base funding of 2.0)
    await addAllocation({
      personId: 'p001',
      projectId: 'proj001',
      pm: 3.0,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    // Generate yearly report
    await calculateYear(2024);
    
    const output = document.getElementById('resultsOutput');
    
    // Yearly totals:
    // Planned: 2.0 * 12 = 24.0
    // Deductions: 3.0 * 12 = 36.0
    // Net: 24.0 - 36.0 = -12.0 (negative = over-allocated)
    expect(output.innerHTML).toContain('⚠ Over-allocated');
    expect(output.innerHTML).toContain('24.00');  // Planned
    expect(output.innerHTML).toContain('36.00');  // Deductions
    expect(output.innerHTML).toContain('-12.00'); // Net (negative)
  });

  it('should handle multiple base funding types', async () => {
    // Setup: Create base funding projects for types 210 and 220
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
    
    // Add budgets
    await addBudgetValue({
      projectId: 'bf210',
      plannedPM: 10.0,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    await addBudgetValue({
      projectId: 'bf220',
      plannedPM: 5.0,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    // Create projects that deduct from different base funding types
    await addProject({
      id: 'proj001',
      name: 'Project A',
      deductsFromBaseFunding: true,
      baseFundingTypeId: '210'
    });
    
    await addProject({
      id: 'proj002',
      name: 'Project B',
      deductsFromBaseFunding: true,
      baseFundingTypeId: '220'
    });
    
    // Create people of different types
    await addPerson({
      id: 'p001',
      name: 'Alice',
      type: '210',
      active: true
    });
    
    await addPerson({
      id: 'p002',
      name: 'Bob',
      type: '220',
      active: true
    });
    
    // Add FTE values
    await addFteValue({
      personId: 'p001',
      fte: 1.0,
      startMonth: '2024-01',
      endMonth: null
    });
    
    await addFteValue({
      personId: 'p002',
      fte: 1.0,
      startMonth: '2024-01',
      endMonth: null
    });
    
    // Add allocations
    await addAllocation({
      personId: 'p001',
      projectId: 'proj001',
      pm: 0.3,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    await addAllocation({
      personId: 'p002',
      projectId: 'proj002',
      pm: 0.4,
      startMonth: '2024-01',
      endMonth: '2024-12'
    });
    
    // Generate yearly report
    await calculateYear(2024);
    
    const output = document.getElementById('resultsOutput');
    const baseFundingTable = output.querySelector('.base-funding-table');
    
    // Verify both base funding types appear
    expect(baseFundingTable.innerHTML).toContain('Base Funding 210');
    expect(baseFundingTable.innerHTML).toContain('Base Funding 220');
    
    // BF 210: Planned 120, Deductions 3.6, Net 116.4
    // BF 220: Planned 60, Deductions 4.8, Net 55.2
    const rows = baseFundingTable.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });
});
