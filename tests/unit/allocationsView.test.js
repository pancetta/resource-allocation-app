import { describe, it, expect, beforeEach } from 'vitest';
import { renderAllocations, initAllocationsView } from '../../js/views/allocationsView.js';
import * as db from '../../js/data/database.js';

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
      <input type="number" id="pctInput" value="50">
      <input type="month" id="startMonthInput" value="2024-01">
      <input type="month" id="endMonthInput" value="2024-12">
      <button id="addAllocationBtn">Add Allocation</button>
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
        pct: 50,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      await renderAllocations();
      
      const tbody = document.querySelector('#allocationsTable tbody');
      expect(tbody.children.length).toBe(1);
      
      const firstRow = tbody.children[0];
      expect(firstRow.querySelector('.alloc-person')).toBeTruthy();
      expect(firstRow.querySelector('.alloc-project')).toBeTruthy();
      expect(firstRow.querySelector('.alloc-pct').value).toBe('50');
      expect(firstRow.querySelector('.alloc-start').value).toBe('2024-01');
      expect(firstRow.querySelector('.alloc-end').value).toBe('2024-12');
    });

    it('should render allocation with null end date', async () => {
      await db.addAllocation({
        id: 1,
        personId: 'p001',
        projectId: 'proj001',
        pct: 50,
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
        pct: 50,
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
        pct: 50,
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
        pct: 50,
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
        pct: 50,
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
        pct: 50,
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
        pct: 50,
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
        pct: 50,
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
        pct: 50,
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
        pct: 50,
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
      expect(allocations[0].pct).toBe(50);
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
});
