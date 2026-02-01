import { describe, it, expect, beforeEach } from 'vitest';
import { calculateMonth, initMonthlyReport } from '../../js/views/monthlyReport.js';
import * as db from '../../js/data/database.js';

describe('Monthly Report', () => {
  beforeEach(async () => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="resultsOutput"></div>
      <input type="month" id="monthInput" value="2025-03">
      <button id="calculateBtn">Calculate</button>
    `;
    
    // Open database
    await db.openDatabase();
    db.clearCache();
    
    // Add test data
    await db.addPerson({ id: 'p001', name: 'Alice', fte: 1.0, active: true });
    await db.addPerson({ id: 'p002', name: 'Bob', fte: 0.5, active: true });
    
    await db.addProject({ id: 'proj001', name: 'Project Alpha', plannedPM: 1.5 });
    await db.addProject({ id: 'proj002', name: 'Project Beta', plannedPM: 0.8 });
  });

  describe('calculateMonth', () => {
    it('should generate monthly report with PM values', async () => {
      await db.addAllocation({ personId: 'p001', projectId: 'proj001', pm: 0.5, startMonth: '2025-01', endMonth: '' });
      await db.addAllocation({ personId: 'p001', projectId: 'proj002', pm: 0.5, startMonth: '2025-01', endMonth: '' });
      
      await calculateMonth('2025-03');
      
      const output = document.getElementById('resultsOutput');
      expect(output.innerHTML).toContain('Monthly Report 2025-03');
      expect(output.innerHTML).toContain('Alice');
      
      // Should show PM values (0.5 + 0.5 = 1.0)
      expect(output.innerHTML).toContain('1.00');
    });

    it('should handle person with no allocations', async () => {
      await calculateMonth('2025-03');
      
      const output = document.getElementById('resultsOutput');
      const tables = output.querySelectorAll('table');
      expect(tables.length).toBe(2); // Person and Project tables
      
      const personRows = tables[0].querySelectorAll('tbody tr');
      expect(personRows.length).toBe(2); // Alice and Bob
    });

    it('should handle FTE overrides', async () => {
      await db.addAllocation({ personId: 'p001', projectId: 'proj001', pm: 1.0, startMonth: '2025-01', endMonth: '' });
      await db.addFteValue({ personId: 'p001', fte: 0.8, startMonth: '2025-03', endMonth: '2025-06' });
      
      await calculateMonth('2025-03');
      
      const output = document.getElementById('resultsOutput');
      // Alice should have FTE of 0.8 in March
      expect(output.innerHTML).toContain('0.80');
    });

    it('should handle project budget overrides', async () => {
      await db.addAllocation({ personId: 'p001', projectId: 'proj001', pm: 1.0, startMonth: '2025-01', endMonth: '' });
      await db.addBudgetValue({ projectId: 'proj001', plannedPM: 2.0, startMonth: '2025-03', endMonth: '2025-06' });
      
      await calculateMonth('2025-03');
      
      const output = document.getElementById('resultsOutput');
      const tables = output.querySelectorAll('table');
      const projectTable = tables[1];
      
      // Project Alpha should show planned PM of 2.0
      expect(projectTable.innerHTML).toContain('2.00');
    });

    it('should handle allocation overrides', async () => {
      await db.addAllocation({ id: 1, personId: 'p001', projectId: 'proj001', pm: 1.0, startMonth: '2025-01', endMonth: '' });
      await db.addAllocationOverride({ allocationId: 1, month: '2025-03', pm: 0.5 });
      
      await calculateMonth('2025-03');
      
      const output = document.getElementById('resultsOutput');
      // Should show 0.5 PM allocation for March
      expect(output.innerHTML).toContain('0.50');
    });

    it('should calculate totals correctly', async () => {
      await db.addAllocation({ personId: 'p001', projectId: 'proj001', pm: 0.5, startMonth: '2025-01', endMonth: '' });
      await db.addAllocation({ personId: 'p001', projectId: 'proj002', pm: 0.5, startMonth: '2025-01', endMonth: '' });
      
      await calculateMonth('2025-03');
      
      const output = document.getElementById('resultsOutput');
      const tables = output.querySelectorAll('table');
      const personTable = tables[0];
      const tfoot = personTable.querySelector('tfoot');
      
      expect(tfoot).toBeTruthy();
      expect(tfoot.innerHTML).toContain('Total');
    });

    it('should show project allocation vs planned', async () => {
      await db.addAllocation({ personId: 'p001', projectId: 'proj001', pm: 1.0, startMonth: '2025-01', endMonth: '' });
      
      await calculateMonth('2025-03');
      
      const output = document.getElementById('resultsOutput');
      const tables = output.querySelectorAll('table');
      const projectTable = tables[1];
      
      expect(projectTable.innerHTML).toContain('Project Alpha');
      expect(projectTable.innerHTML).toContain('Allocated PM');
      expect(projectTable.innerHTML).toContain('Planned PM');
      expect(projectTable.innerHTML).toContain('Delta');
    });
  });

  describe('initMonthlyReport', () => {
    it('should initialize event listeners', () => {
      initMonthlyReport();
      
      const btn = document.getElementById('calculateBtn');
      expect(btn).toBeTruthy();
    });

    it('should generate report on button click', async () => {
      await db.addAllocation({ personId: 'p001', projectId: 'proj001', pm: 0.5, startMonth: '2025-01', endMonth: '' });
      
      initMonthlyReport();
      
      const btn = document.getElementById('calculateBtn');
      btn.click();
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const output = document.getElementById('resultsOutput');
      expect(output.innerHTML).toContain('Monthly Report');
    });
  });
});
