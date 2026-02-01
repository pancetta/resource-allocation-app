import { describe, it, expect, beforeEach } from 'vitest';
import { openDatabase, addPerson, addProject, addAllocation, addFteValue, addBudgetValue } from '../../js/data/database.js';
import { calculateMonth } from '../../js/views/monthlyReport.js';
import { calculateYear } from '../../js/views/yearlyReport.js';

describe('Calculation Integration Tests', () => {
  beforeEach(async () => {
    // Setup DOM
    document.body.innerHTML = '<div id="resultsOutput"></div>';
    
    // Open database
    await openDatabase();
    
    // Add test data - now with separate FTE and budget values
    await addPerson({ id: 'p001', name: 'Alice', active: true });
    await addFteValue({ personId: 'p001', fte: 1, startMonth: '2025-01', endMonth: null });
    
    await addPerson({ id: 'p002', name: 'Bob', active: true });
    await addFteValue({ personId: 'p002', fte: 0.8, startMonth: '2025-01', endMonth: null });
    
    await addProject({ id: 'proj001', name: 'Project Alpha' });
    await addBudgetValue({ projectId: 'proj001', plannedPM: 1.5, startMonth: '2025-01', endMonth: null });
    
    await addProject({ id: 'proj002', name: 'Project Beta' });
    await addBudgetValue({ projectId: 'proj002', plannedPM: 0.8, startMonth: '2025-01', endMonth: null });
  });

  describe('Monthly Calculations', () => {
    it('should calculate monthly allocations correctly', async () => {
      // Alice: 50% on Alpha, 50% on Beta
      await addAllocation({ personId: 'p001', projectId: 'proj001', pct: 0.5, startMonth: '2025-01', endMonth: '' });
      await addAllocation({ personId: 'p001', projectId: 'proj002', pct: 0.5, startMonth: '2025-01', endMonth: '' });
      
      // Bob: 100% on Alpha
      await addAllocation({ personId: 'p002', projectId: 'proj001', pct: 1, startMonth: '2025-01', endMonth: '' });
      
      await calculateMonth('2025-03');
      
      const output = document.getElementById('resultsOutput');
      expect(output.innerHTML).toContain('Monthly Report 2025-03');
      
      // Check that tables are rendered
      const tables = output.querySelectorAll('table');
      expect(tables.length).toBe(2); // Person table and Project table
      
      // Verify person table has data
      const personTable = tables[0];
      const personRows = personTable.querySelectorAll('tbody tr');
      expect(personRows.length).toBe(2); // Alice and Bob
      
      // Verify project table has data
      const projectTable = tables[1];
      const projectRows = projectTable.querySelectorAll('tbody tr');
      expect(projectRows.length).toBe(2); // Alpha and Beta
    });

    it('should respect allocation date ranges', async () => {
      // Alice on Alpha only in Jan-Feb
      await addAllocation({ personId: 'p001', projectId: 'proj001', pct: 1, startMonth: '2025-01', endMonth: '2025-02' });
      
      // Alice on Beta starting in March
      await addAllocation({ personId: 'p001', projectId: 'proj002', pct: 1, startMonth: '2025-03', endMonth: '' });
      
      await calculateMonth('2025-01');
      let output = document.getElementById('resultsOutput');
      expect(output.innerHTML).toContain('Monthly Report 2025-01');
      
      await calculateMonth('2025-03');
      output = document.getElementById('resultsOutput');
      expect(output.innerHTML).toContain('Monthly Report 2025-03');
    });

    it('should calculate person totals correctly', async () => {
      // Alice: 60% on Alpha, 40% on Beta = 1.0 FTE total
      await addAllocation({ personId: 'p001', projectId: 'proj001', pct: 0.6, startMonth: '2025-01', endMonth: '' });
      await addAllocation({ personId: 'p001', projectId: 'proj002', pct: 0.4, startMonth: '2025-01', endMonth: '' });
      
      await calculateMonth('2025-03');
      
      const output = document.getElementById('resultsOutput');
      const tables = output.querySelectorAll('table');
      const personTable = tables[0];
      
      // Find Alice's row and check total
      const aliceRow = Array.from(personTable.querySelectorAll('tbody tr')).find(row => 
        row.textContent.includes('Alice')
      );
      
      expect(aliceRow).toBeTruthy();
      // Total should be 1.00 (0.6 + 0.4)
      expect(aliceRow.textContent).toContain('1.00');
    });

    it('should calculate project totals correctly', async () => {
      // Alice (1.0 FTE) at 50% = 0.5 PM
      await addAllocation({ personId: 'p001', projectId: 'proj001', pct: 0.5, startMonth: '2025-01', endMonth: '' });
      
      // Bob (0.8 FTE) at 100% = 0.8 PM
      await addAllocation({ personId: 'p002', projectId: 'proj001', pct: 1, startMonth: '2025-01', endMonth: '' });
      
      // Total on Alpha should be 1.3 PM
      await calculateMonth('2025-03');
      
      const output = document.getElementById('resultsOutput');
      const tables = output.querySelectorAll('table');
      const projectTable = tables[1];
      
      // Find Alpha's row
      const alphaRow = Array.from(projectTable.querySelectorAll('tbody tr')).find(row => 
        row.textContent.includes('Project Alpha')
      );
      
      expect(alphaRow).toBeTruthy();
      // Allocated PM should be 1.30 (0.5 + 0.8)
      expect(alphaRow.textContent).toContain('1.30');
    });
  });

  describe('Yearly Calculations', () => {
    it('should calculate yearly allocations correctly', async () => {
      await addAllocation({ personId: 'p001', projectId: 'proj001', pct: 0.5, startMonth: '2025-01', endMonth: '' });
      await addAllocation({ personId: 'p001', projectId: 'proj002', pct: 0.5, startMonth: '2025-01', endMonth: '' });
      
      await calculateYear(2025);
      
      const output = document.getElementById('resultsOutput');
      expect(output.innerHTML).toContain('Yearly Overview 2025');
      
      const tables = output.querySelectorAll('table');
      expect(tables.length).toBe(2); // Person×Month and Project×Month tables
      
      // Verify person table has 12 month columns plus metadata columns
      const personTable = tables[0];
      const headers = personTable.querySelectorAll('thead th');
      expect(headers.length).toBe(16); // Person + 12 months + Total + FTE + Delta
    });

    it('should calculate yearly totals correctly', async () => {
      // Alice at 100% for full year
      await addAllocation({ personId: 'p001', projectId: 'proj001', pct: 1, startMonth: '2025-01', endMonth: '' });
      
      await calculateYear(2025);
      
      const output = document.getElementById('resultsOutput');
      const tables = output.querySelectorAll('table');
      const personTable = tables[0];
      
      const aliceRow = Array.from(personTable.querySelectorAll('tbody tr')).find(row => 
        row.textContent.includes('Alice')
      );
      
      expect(aliceRow).toBeTruthy();
      // Total should be 12.00 (1.0 PM × 12 months)
      expect(aliceRow.textContent).toContain('12.00');
    });

    it('should handle partial year allocations', async () => {
      // Alice only in Q1 (Jan-Mar)
      await addAllocation({ personId: 'p001', projectId: 'proj001', pct: 1, startMonth: '2025-01', endMonth: '2025-03' });
      
      await calculateYear(2025);
      
      const output = document.getElementById('resultsOutput');
      const tables = output.querySelectorAll('table');
      const personTable = tables[0];
      
      const aliceRow = Array.from(personTable.querySelectorAll('tbody tr')).find(row => 
        row.textContent.includes('Alice')
      );
      
      expect(aliceRow).toBeTruthy();
      // Total should be 3.00 (1.0 PM × 3 months)
      expect(aliceRow.textContent).toContain('3.00');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero FTE person', async () => {
      await addPerson({ id: 'p003', name: 'Charlie', fte: 0, active: true });
      await addAllocation({ personId: 'p003', projectId: 'proj001', pct: 1, startMonth: '2025-01', endMonth: '' });
      
      await calculateMonth('2025-03');
      
      const output = document.getElementById('resultsOutput');
      expect(output.innerHTML).toContain('Charlie');
    });

    it('should handle missing endMonth (ongoing allocation)', async () => {
      await addAllocation({ personId: 'p001', projectId: 'proj001', pct: 1, startMonth: '2025-01', endMonth: '' });
      
      await calculateMonth('2025-12');
      
      const output = document.getElementById('resultsOutput');
      const tables = output.querySelectorAll('table');
      expect(tables.length).toBe(2);
    });

    it('should handle no allocations', async () => {
      await calculateMonth('2025-03');
      
      const output = document.getElementById('resultsOutput');
      expect(output.innerHTML).toContain('Monthly Report 2025-03');
      
      const tables = output.querySelectorAll('table');
      expect(tables.length).toBe(2);
    });
  });
});
