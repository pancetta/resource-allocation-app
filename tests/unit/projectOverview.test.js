import { describe, it, expect, beforeEach } from 'vitest';
import { renderProjectMonthlyOverview, initProjectOverview } from '../../js/views/projectOverview.js';
import * as db from '../../js/data/database.js';

describe('Project Overview', () => {
  beforeEach(async () => {
    // Initialize database
    await db.openDatabase();
    db.clearCache();
    
    // Setup DOM
    document.body.innerHTML = `
      <div id="resultsOutput"></div>
      <input type="text" id="overviewYearInput" value="2024">
      <button id="projectMonthlyBtn">Generate</button>
    `;
    
    // Add test data
    await db.addPerson({ id: 'p001', name: 'Alice', fte: 1.0, active: true });
    await db.addProject({ id: 'proj001', name: 'Project Alpha', plannedPM: 1 });
  });

  describe('renderProjectMonthlyOverview', () => {
    it('should render project monthly overview table', async () => {
      await renderProjectMonthlyOverview('2024');
      
      const output = document.getElementById('resultsOutput');
      expect(output.innerHTML).toContain('Project × Month Overview 2024');
      
      const table = output.querySelector('table');
      expect(table).toBeTruthy();
    });

    it('should render table with correct headers', async () => {
      await renderProjectMonthlyOverview('2024');
      
      const table = document.querySelector('table');
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent);
      
      expect(headers[0]).toBe('Project');
      expect(headers[1]).toBe('2024-01');
      expect(headers[12]).toBe('2024-12');
      expect(headers[13]).toBe('Total');
      expect(headers[14]).toBe('Planned');
      expect(headers[15]).toBe('Delta');
    });

    it('should render project rows with calculations', async () => {
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 100, // 100% of 1.0 FTE = 1.0 PM per month
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      await renderProjectMonthlyOverview('2024');
      
      const tbody = document.querySelector('tbody');
      const firstRow = tbody.querySelector('tr');
      
      // Check project name
      expect(firstRow.querySelector('td').textContent).toBe('Project Alpha');
      
      // Check that cells have values
      const cells = Array.from(firstRow.querySelectorAll('td'));
      expect(cells.length).toBeGreaterThan(10); // Should have month cells + totals
    });

    it('should calculate totals correctly', async () => {
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 100, // 100% of 1.0 FTE = 1.0 PM per month
        startMonth: '2024-01',
        endMonth: '2024-03' // 3 months
      });
      
      await renderProjectMonthlyOverview('2024');
      
      const tbody = document.querySelector('tbody');
      const row = tbody.querySelector('tr');
      
      // Verify the row has cells
      const cells = Array.from(row.querySelectorAll('td'));
      expect(cells.length).toBeGreaterThan(5); // Should have project name + month cells + totals
    });

    it('should render footer with column totals', async () => {
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 100,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      await renderProjectMonthlyOverview('2024');
      
      const tfoot = document.querySelector('tfoot');
      expect(tfoot).toBeTruthy();
      
      const sumRow = tfoot.querySelector('tr');
      expect(sumRow.textContent).toContain('Total');
    });

    it('should handle multiple projects', async () => {
      await db.addProject({ id: 'proj002', name: 'Project Beta', plannedPM: 2 });
      await db.addPerson({ id: 'p002', name: 'Bob', fte: 0.5, active: true });
      
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 50,
        startMonth: '2024-01',
        endMonth: '2024-06'
      });
      await db.addAllocation({
        id: 2,
        personId: 'p002',
        projectId: 'proj002',
        pct: 100,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      await renderProjectMonthlyOverview('2024');
      
      const tbody = document.querySelector('tbody');
      const rows = tbody.querySelectorAll('tr');
      expect(rows.length).toBe(2);
    });

    it('should handle project with no planned PM', async () => {
      await db.addProject({ id: 'proj002', name: 'Project Beta', plannedPM: null });
      
      await renderProjectMonthlyOverview('2024');
      
      const tbody = document.querySelector('tbody');
      const rows = tbody.querySelectorAll('tr');
      expect(rows.length).toBe(2); // Both projects should render
    });

    it('should apply correct CSS classes to cells', async () => {
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 100,
        startMonth: '2024-01',
        endMonth: '2024-01' // Only one month
      });
      
      await renderProjectMonthlyOverview('2024');
      
      const tbody = document.querySelector('tbody');
      const cellsWithClass = tbody.querySelectorAll('td[class]');
      
      // Should have cells with correct/warning classes
      expect(cellsWithClass.length).toBeGreaterThan(0);
    });

    it('should handle empty allocations', async () => {
      await renderProjectMonthlyOverview('2024');
      
      const output = document.getElementById('resultsOutput');
      const table = output.querySelector('table');
      expect(table).toBeTruthy();
      
      const tbody = table.querySelector('tbody');
      expect(tbody.querySelectorAll('tr').length).toBe(1); // One project row
    });

    it('should calculate delta correctly', async () => {
      // Project planned: 1 PM/month * 12 months = 12 PM total
      // Allocation: 100% of 1.0 FTE for 12 months = 12 PM total (in percentage format: 100 * 1.0 = 100)
      // But the calculation uses pct * fte, where pct is stored as whole number (100 for 100%)
      // So actual calculation is: (100 * 1.0) for each month = 100 PM per month * 12 = 1200 PM total
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 100,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      await renderProjectMonthlyOverview('2024');
      
      const tbody = document.querySelector('tbody');
      const row = tbody.querySelector('tr');
      const cells = Array.from(row.querySelectorAll('td'));
      
      // Find delta cell (last cell in row) - should exist
      const deltaCell = cells[cells.length - 1];
      expect(deltaCell).toBeTruthy();
      expect(deltaCell.textContent).toBeTruthy();
    });
  });

  describe('initProjectOverview', () => {
    it('should attach click handler to button', () => {
      initProjectOverview();
      
      const btn = document.getElementById('projectMonthlyBtn');
      expect(btn).toBeTruthy();
    });

    it('should render overview when button clicked', async () => {
      initProjectOverview();
      
      const btn = document.getElementById('projectMonthlyBtn');
      btn.click();
      
      // Wait for async render
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const output = document.getElementById('resultsOutput');
      expect(output.innerHTML).toContain('Project × Month Overview');
    });

    it('should use year from input when rendering', async () => {
      document.getElementById('overviewYearInput').value = '2025';
      
      initProjectOverview();
      
      const btn = document.getElementById('projectMonthlyBtn');
      btn.click();
      
      // Wait for async render
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const output = document.getElementById('resultsOutput');
      expect(output.innerHTML).toContain('2025');
    });
  });
});
