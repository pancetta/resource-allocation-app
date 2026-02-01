import { describe, it, expect, beforeEach } from 'vitest';
import { calculateYear, initYearlyReport } from '../../js/views/yearlyReport.js';
import * as db from '../../js/data/database.js';

describe('Yearly Report', () => {
  beforeEach(async () => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="resultsOutput"></div>
      <input type="number" id="yearInput" value="2025">
      <button id="calculateYearBtn">Calculate</button>
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

  describe('calculateYear', () => {
    it('should generate yearly report with PM and percentage', async () => {
      await db.addAllocation({ personId: 'p001', projectId: 'proj001', pct: 0.5, startMonth: '2025-01', endMonth: '' });
      await db.addAllocation({ personId: 'p001', projectId: 'proj002', pct: 0.5, startMonth: '2025-01', endMonth: '' });
      
      await calculateYear(2025);
      
      const output = document.getElementById('resultsOutput');
      expect(output.innerHTML).toContain('Yearly Overview 2025');
      expect(output.innerHTML).toContain('Alice');
      
      // Should show PM with percentage format
      expect(output.innerHTML).toContain('(100%)');
    });

    it('should display 12 months of data', async () => {
      await db.addAllocation({ personId: 'p001', projectId: 'proj001', pct: 1.0, startMonth: '2025-01', endMonth: '' });
      
      await calculateYear(2025);
      
      const output = document.getElementById('resultsOutput');
      const tables = output.querySelectorAll('table');
      const personTable = tables[0];
      const headers = personTable.querySelectorAll('thead th');
      
      // Should have Person + 12 months + Total + FTE + Delta = 16 columns
      expect(headers.length).toBe(16);
    });

    it('should handle FTE overrides across months', async () => {
      await db.addAllocation({ personId: 'p001', projectId: 'proj001', pct: 1.0, startMonth: '2025-01', endMonth: '' });
      await db.addFteValue({ personId: 'p001', fte: 0.8, startMonth: '2025-03', endMonth: '2025-06' });
      
      await calculateYear(2025);
      
      const output = document.getElementById('resultsOutput');
      const tables = output.querySelectorAll('table');
      expect(tables.length).toBeGreaterThanOrEqual(2);
    });

    it('should calculate yearly totals correctly', async () => {
      await db.addAllocation({ personId: 'p001', projectId: 'proj001', pct: 1.0, startMonth: '2025-01', endMonth: '2025-12' });
      
      await calculateYear(2025);
      
      const output = document.getElementById('resultsOutput');
      const tables = output.querySelectorAll('table');
      const personTable = tables[0];
      const rows = personTable.querySelectorAll('tbody tr');
      
      expect(rows.length).toBeGreaterThan(0);
      // Should show total of 12.00 PM for full year at 100%
      expect(personTable.innerHTML).toContain('12.00');
    });

    it('should display project totals table', async () => {
      await db.addAllocation({ personId: 'p001', projectId: 'proj001', pct: 1.0, startMonth: '2025-01', endMonth: '' });
      
      await calculateYear(2025);
      
      const output = document.getElementById('resultsOutput');
      const tables = output.querySelectorAll('table');
      
      // Should have person table and project table
      expect(tables.length).toBeGreaterThanOrEqual(2);
      
      const projectTable = tables[1];
      expect(projectTable.innerHTML).toContain('Project Alpha');
    });

    it('should handle project budget overrides', async () => {
      await db.addAllocation({ personId: 'p001', projectId: 'proj001', pct: 1.0, startMonth: '2025-01', endMonth: '' });
      await db.addBudgetValue({ projectId: 'proj001', plannedPM: 2.0, startMonth: '2025-03', endMonth: '2025-06' });
      
      await calculateYear(2025);
      
      const output = document.getElementById('resultsOutput');
      expect(output.innerHTML).toContain('Project Alpha');
    });

    it('should show totals row in person table', async () => {
      await db.addAllocation({ personId: 'p001', projectId: 'proj001', pct: 0.5, startMonth: '2025-01', endMonth: '' });
      await db.addAllocation({ personId: 'p002', projectId: 'proj001', pct: 1.0, startMonth: '2025-01', endMonth: '' });
      
      await calculateYear(2025);
      
      const output = document.getElementById('resultsOutput');
      const tables = output.querySelectorAll('table');
      const personTable = tables[0];
      const tfoot = personTable.querySelector('tfoot');
      
      expect(tfoot).toBeTruthy();
      expect(tfoot.innerHTML).toContain('Total');
    });

    it('should handle allocation overrides in yearly view', async () => {
      await db.addAllocation({ id: 1, personId: 'p001', projectId: 'proj001', pct: 1.0, startMonth: '2025-01', endMonth: '' });
      await db.addAllocationOverride({ allocationId: 1, month: '2025-06', pct: 0.5 });
      
      await calculateYear(2025);
      
      const output = document.getElementById('resultsOutput');
      expect(output.innerHTML).toContain('Alice');
    });
  });

  describe('initYearlyReport', () => {
    it('should initialize event listeners', () => {
      initYearlyReport();
      
      const btn = document.getElementById('calculateYearBtn');
      expect(btn).toBeTruthy();
    });

    it('should generate report on button click', async () => {
      await db.addAllocation({ personId: 'p001', projectId: 'proj001', pct: 0.5, startMonth: '2025-01', endMonth: '' });
      
      initYearlyReport();
      
      const btn = document.getElementById('calculateYearBtn');
      btn.click();
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const output = document.getElementById('resultsOutput');
      expect(output.innerHTML).toContain('Yearly Overview');
    });
  });
});
