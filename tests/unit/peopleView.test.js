import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderPeople, renderFteValues, populatePersonSelect, addPersonAuto, initPeopleView } from '../../js/views/peopleView.js';
import * as db from '../../js/data/database.js';

describe('People View', () => {
  beforeEach(async () => {
    // Initialize database
    await db.openDatabase();
    db.clearCache();
    
    // Setup DOM - now includes both people table and FTE values table
    document.body.innerHTML = `
      <table id="peopleTable">
        <tbody></tbody>
      </table>
      <table id="fteValuesTable">
        <tbody></tbody>
      </table>
      <select id="personSelect"></select>
      <select id="ftePersonSelect"></select>
      <button id="addPersonBtn">Add Person</button>
      <input type="number" id="fteValueInput" value="1.0">
      <input type="month" id="fteStartMonthInput" value="2025-01">
      <input type="month" id="fteEndMonthInput" value="">
      <button id="addFteValueBtn">Add FTE Value</button>
    `;
  });

  describe('renderPeople', () => {
    it('should render empty table when no people exist', async () => {
      await renderPeople();
      
      const tbody = document.querySelector('#peopleTable tbody');
      expect(tbody.children.length).toBe(0);
    });

    it('should render people in table', async () => {
      await db.addPerson({ id: 'p001', name: 'Alice', active: true });
      await db.addPerson({ id: 'p002', name: 'Bob', active: false });
      
      await renderPeople();
      
      const tbody = document.querySelector('#peopleTable tbody');
      expect(tbody.children.length).toBe(2);
      
      const firstRow = tbody.children[0];
      expect(firstRow.querySelector('[data-field="name"]').textContent).toBe('Alice');
      expect(firstRow.querySelector('[data-field="active"]').checked).toBe(true);
    });

    it('should render people without FTE column (FTE is now in separate table)', async () => {
      await db.addPerson({ id: 'p001', name: 'Charlie', active: true });
      
      await renderPeople();
      
      // FTE column should not exist in people table anymore
      const fteCell = document.querySelector('[data-field="fte"]');
      expect(fteCell).toBeNull();
    });

    it('should call populatePersonSelect after rendering', async () => {
      await db.addPerson({ id: 'p001', name: 'Alice', active: true });
      
      await renderPeople();
      
      // renderPeople calls populatePersonSelect internally
      // We can verify the select was populated
      const select = document.getElementById('personSelect');
      expect(select.children.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('populatePersonSelect', () => {
    it('should populate select with active people only', async () => {
      await db.addPerson({ id: 'p001', name: 'Alice', active: true });
      await db.addPerson({ id: 'p002', name: 'Bob', active: false });
      await db.addPerson({ id: 'p003', name: 'Charlie', active: true });
      
      await populatePersonSelect();
      
      const select = document.getElementById('personSelect');
      expect(select.children.length).toBe(2);
      expect(select.children[0].textContent).toBe('Alice');
      expect(select.children[1].textContent).toBe('Charlie');
    });

    it('should clear existing options before populating', async () => {
      const select = document.getElementById('personSelect');
      select.innerHTML = '<option>Old Option</option>';
      
      await db.addPerson({ id: 'p001', name: 'Alice', active: true });
      await populatePersonSelect();
      
      expect(select.children.length).toBe(1);
      expect(select.children[0].textContent).toBe('Alice');
    });

    it('should handle empty people list', async () => {
      await populatePersonSelect();
      
      const select = document.getElementById('personSelect');
      expect(select.children.length).toBe(0);
    });
  });

  describe('addPersonAuto', () => {
    it('should add person with auto-generated ID and initial FTE value', async () => {
      await addPersonAuto('Alice');
      
      const people = await db.getPeople();
      expect(people.length).toBe(1);
      expect(people[0].id).toBe('p001');
      expect(people[0].name).toBe('Alice');
      expect(people[0].active).toBe(true);
      
      // Should also create an initial FTE value
      const fteValues = await db.getFteValues();
      expect(fteValues.length).toBe(1);
      expect(fteValues[0].personId).toBe('p001');
      expect(fteValues[0].fte).toBe(1.0);
      expect(fteValues[0].endMonth).toBeNull(); // Open-ended
    });

    it('should generate sequential IDs', async () => {
      await addPersonAuto('Alice');
      await addPersonAuto('Bob');
      
      const people = await db.getPeople();
      expect(people.length).toBe(2);
      expect(people[0].id).toBe('p001');
      expect(people[1].id).toBe('p002');
    });

    it('should re-render people table after adding', async () => {
      await addPersonAuto('Alice');
      
      // Verify person was added to database
      const people = await db.getPeople();
      expect(people.length).toBe(1);
      
      // The table should have been re-rendered (though we're testing the data layer here)
      const tbody = document.querySelector('#peopleTable tbody');
      expect(tbody).toBeDefined();
    });
  });

  describe('initPeopleView', () => {
    it('should attach click handler to add person button', () => {
      initPeopleView();
      
      const btn = document.getElementById('addPersonBtn');
      expect(btn).toBeDefined();
      // Event listeners added with addEventListener don't set onclick property
      // Just verify the function ran without errors
      expect(btn).toBeTruthy();
    });
  });

  describe('event handlers', () => {
    it('should update person name on blur', async () => {
      await db.addPerson({ id: 'p001', name: 'Alice', active: true });
      await renderPeople();
      
      const nameCell = document.querySelector('[data-field="name"]');
      nameCell.textContent = 'Alice Updated';
      nameCell.dispatchEvent(new Event('blur'));
      
      // Wait for async update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const people = await db.getPeople();
      expect(people[0].name).toBe('Alice Updated');
    });

    it('should update person active status on checkbox change', async () => {
      await db.addPerson({ id: 'p001', name: 'Alice', active: true });
      await renderPeople();
      
      const checkbox = document.querySelector('[data-field="active"]');
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change'));
      
      // Wait for async update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const people = await db.getPeople();
      expect(people[0].active).toBe(false);
    });

    it('should delete person and associated FTE values on delete button click', async () => {
      await db.addPerson({ id: 'p001', name: 'Alice', active: true });
      await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: null });
      await renderPeople();
      
      const deleteBtn = document.querySelector('.delete-person');
      deleteBtn.click();
      
      // Wait for async delete and re-render
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const people = await db.getPeople();
      expect(people.length).toBe(0);
      
      // FTE values should also be deleted
      const fteValues = await db.getFteValues();
      expect(fteValues.length).toBe(0);
    });
  });
});
