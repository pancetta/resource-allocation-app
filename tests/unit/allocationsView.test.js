import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderAllocations, renderAllocationOverrides, populateAllocationSelect, initAllocationsView } from '../../js/views/allocationsView.js';
import * as db from '../../js/data/database.js';

// Mock scheduleAutoBackup
vi.mock('../../js/main.js', () => ({
    scheduleAutoBackup: vi.fn()
}));

// Mock global alert and confirm
global.alert = vi.fn(); // Mock alert to not throw
global.confirm = vi.fn(() => false); // Default to false (cancel) to avoid deleting overlaps in tests

describe('Allocations View', () => {
  beforeEach(async () => {
    // Initialize database
    await db.openDatabase();
    db.clearCache();
    
    // Setup DOM
    document.body.innerHTML = `
      <table id="allocationsTable">
        <tbody></tbody>
      </table>
      <select id="personSelect"></select>
      <select id="projectSelect"></select>
      <input type="number" id="pctInput" value="0.5" step="0.01" min="0" max="1">
      <input type="month" id="startMonthInput" value="2024-01">
      <input type="month" id="endMonthInput" value="2024-12">
      <button id="addAllocationBtn">Add Allocation</button>
      
      <table id="allocationOverridesTable">
        <tbody></tbody>
      </table>
      <select id="allocationSelect"></select>
      <input type="month" id="overrideMonthInput" value="2025-06">
      <input type="number" id="overridePctInput" value="0.5">
      <button id="addAllocationOverrideBtn">Add Override</button>
    `;
    
    // Add test data
    await db.addPerson({ id: 'p001', name: 'Alice', fte: 1.0, active: true });
    await db.addProject({ id: 'proj001', name: 'Project Alpha', plannedPM: 12 });
  });

  describe('renderAllocations', () => {
    it('should render empty table when no allocations exist', async () => {
      await renderAllocations();
      
      const tbody = document.querySelector('#allocationsTable tbody');
      expect(tbody.children.length).toBe(0);
    });

    it('should render allocations in table', async () => {
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 0.5,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      await renderAllocations();
      
      const tbody = document.querySelector('#allocationsTable tbody');
      expect(tbody.children.length).toBe(1);
      
      const firstRow = tbody.children[0];
      expect(firstRow.querySelector('.alloc-person')).toBeTruthy();
      expect(firstRow.querySelector('.alloc-project')).toBeTruthy();
      expect(firstRow.querySelector('.alloc-pct').value).toBe('0.5');
      expect(firstRow.querySelector('.alloc-start').value).toBe('2024-01');
      expect(firstRow.querySelector('.alloc-end').value).toBe('2024-12');
    });

    it('should render allocation with null end date', async () => {
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 0.5,
        startMonth: '2024-01',
        endMonth: null
      });
      
      await renderAllocations();
      
      const endInput = document.querySelector('.alloc-end');
      expect(endInput.value).toBe('');
    });

    it('should render multiple allocations', async () => {
      await db.addPerson({ id: 'p002', name: 'Bob', fte: 1.0, active: true });
      await db.addProject({ id: 'proj002', name: 'Project Beta', plannedPM: 6 });
      
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 0.5,
        startMonth: '2024-01',
        endMonth: '2024-06'
      });
      await db.addAllocation({
        id: 2,
        personId: 'p002',
        projectId: 'proj002',
        pct: 75,
        startMonth: '2024-07',
        endMonth: '2024-12'
      });
      
      await renderAllocations();
      
      const tbody = document.querySelector('#allocationsTable tbody');
      expect(tbody.children.length).toBe(2);
    });

    it('should filter person options to show only active people', async () => {
      await db.addPerson({ id: 'p002', name: 'Bob', fte: 1.0, active: false });
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 0.5,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      await renderAllocations();
      
      const personSelect = document.querySelector('.alloc-person');
      // Should only show active person (Alice)
      expect(personSelect.options.length).toBe(1);
      expect(personSelect.options[0].text).toBe('Alice');
    });
  });

  describe('event handlers', () => {
    it('should update allocation person on select change', async () => {
      await db.addPerson({ id: 'p002', name: 'Bob', fte: 1.0, active: true });
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 0.5,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      await renderAllocations();
      
      const personSelect = document.querySelector('.alloc-person');
      personSelect.value = 'p002';
      personSelect.dispatchEvent(new Event('change'));
      
      // Wait for async update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const allocations = await db.getAllocations();
      expect(allocations[0].personId).toBe('p002');
    });

    it('should update allocation project on select change', async () => {
      await db.addProject({ id: 'proj002', name: 'Project Beta', plannedPM: 6 });
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 0.5,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      await renderAllocations();
      
      const projectSelect = document.querySelector('.alloc-project');
      projectSelect.value = 'proj002';
      projectSelect.dispatchEvent(new Event('change'));
      
      // Wait for async update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const allocations = await db.getAllocations();
      expect(allocations[0].projectId).toBe('proj002');
    });

    it('should update allocation percentage on blur', async () => {
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 0.5,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      await renderAllocations();
      
      const pctInput = document.querySelector('.alloc-pct');
      pctInput.value = '75';
      pctInput.dispatchEvent(new Event('blur'));
      
      // Wait for async update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const allocations = await db.getAllocations();
      expect(allocations[0].pct).toBe(75);
    });

    it('should update allocation start month on blur', async () => {
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 0.5,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      await renderAllocations();
      
      const startInput = document.querySelector('.alloc-start');
      startInput.value = '2024-03';
      startInput.dispatchEvent(new Event('blur'));
      
      // Wait for async update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const allocations = await db.getAllocations();
      expect(allocations[0].startMonth).toBe('2024-03');
    });

    it('should update allocation end month on blur', async () => {
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 0.5,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      await renderAllocations();
      
      const endInput = document.querySelector('.alloc-end');
      endInput.value = '2024-06';
      endInput.dispatchEvent(new Event('blur'));
      
      // Wait for async update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const allocations = await db.getAllocations();
      expect(allocations[0].endMonth).toBe('2024-06');
    });

    it('should set end month to null when cleared', async () => {
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 0.5,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      await renderAllocations();
      
      const endInput = document.querySelector('.alloc-end');
      endInput.value = '';
      endInput.dispatchEvent(new Event('blur'));
      
      // Wait for async update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const allocations = await db.getAllocations();
      expect(allocations[0].endMonth).toBe(null);
    });

    it('should delete allocation on delete button click', async () => {
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 0.5,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      await renderAllocations();
      
      const deleteBtn = document.querySelector('.delete-allocation');
      deleteBtn.click();
      
      // Wait for async delete and re-render
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const allocations = await db.getAllocations();
      expect(allocations.length).toBe(0);
    });
  });

  describe('initAllocationsView', () => {
    it('should add allocation when button clicked', async () => {
      // Populate selects
      document.getElementById('personSelect').innerHTML = '<option value="p001">Alice</option>';
      document.getElementById('projectSelect').innerHTML = '<option value="proj001">Project Alpha</option>';
      
      initAllocationsView();
      
      const btn = document.getElementById('addAllocationBtn');
      btn.click();
      
      // Wait for async add and re-render
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const allocations = await db.getAllocations();
      expect(allocations.length).toBe(1);
      expect(allocations[0].personId).toBe('p001');
      expect(allocations[0].projectId).toBe('proj001');
      expect(allocations[0].pct).toBe(0.5);
      expect(allocations[0].startMonth).toBe('2024-01');
      expect(allocations[0].endMonth).toBe('2024-12');
    });

    it('should handle null end month when adding allocation', async () => {
      document.getElementById('personSelect').innerHTML = '<option value="p001">Alice</option>';
      document.getElementById('projectSelect').innerHTML = '<option value="proj001">Project Alpha</option>';
      document.getElementById('endMonthInput').value = '';
      
      initAllocationsView();
      
      const btn = document.getElementById('addAllocationBtn');
      btn.click();
      
      // Wait for async add
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const allocations = await db.getAllocations();
      expect(allocations[0].endMonth).toBe(null);
    });
  });

  describe('renderAllocationOverrides', () => {
    it('should render empty table when no overrides exist', async () => {
      await renderAllocationOverrides();
      
      const tbody = document.querySelector('#allocationOverridesTable tbody');
      expect(tbody.children.length).toBe(0);
    });

    it('should render allocation overrides in table', async () => {
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 1.0,
        startMonth: '2025-01',
        endMonth: null
      });
      
      await db.addAllocationOverride({
        allocationId: 1,
        month: '2025-06',
        pct: 0.5
      });
      
      await renderAllocationOverrides();
      
      const tbody = document.querySelector('#allocationOverridesTable tbody');
      expect(tbody.children.length).toBe(1);
      
      const row = tbody.children[0];
      // Month is in an input field
      const monthInput = row.querySelector('.override-month');
      expect(monthInput.value).toBe('2025-06');
      expect(row.textContent).toContain('0.5');
    });
  });

  describe('populateAllocationSelect', () => {
    it('should populate dropdown with allocations', async () => {
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 1.0,
        startMonth: '2025-01',
        endMonth: null
      });
      
      await populateAllocationSelect();
      
      const select = document.getElementById('allocationSelect');
      expect(select.options.length).toBe(1);
      expect(select.options[0].value).toBe('1');
    });
  });

  describe('allocation override management', () => {
    it('should add allocation override when override button clicked', async () => {
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 1.0,
        startMonth: '2025-01',
        endMonth: null
      });
      
      await populateAllocationSelect();
      
      initAllocationsView();
      
      document.getElementById('allocationSelect').value = '1';
      document.getElementById('overrideMonthInput').value = '2025-06';
      document.getElementById('overridePctInput').value = '0.5';
      
      const btn = document.getElementById('addAllocationOverrideBtn');
      btn.click();
      
      // Wait for async add
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const overrides = await db.getAllocationOverrides();
      expect(overrides.length).toBe(1);
      expect(overrides[0].allocationId).toBe(1);
      expect(overrides[0].month).toBe('2025-06');
      expect(overrides[0].pct).toBe(0.5);
    });

    it('should show alert when allocation override is missing data', async () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      initAllocationsView();
      
      document.getElementById('allocationSelect').value = '';
      document.getElementById('overrideMonthInput').value = '2025-06';
      
      const btn = document.getElementById('addAllocationOverrideBtn');
      btn.click();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(alertMock).toHaveBeenCalledWith('Please select an allocation and month');
      
      alertMock.mockRestore();
    });
  });
});
