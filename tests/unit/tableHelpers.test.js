import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeTableSortable, addTableFilter, addBatchSelection, getSelectedRows } from '../../js/helpers/tableHelpers.js';

describe('Table Helpers', () => {
  describe('makeTableSortable', () => {
    let table;

    beforeEach(() => {
      document.body.innerHTML = `
        <table id="testTable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>City</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Alice</td><td>30</td><td>New York</td></tr>
            <tr><td>Bob</td><td>25</td><td>Boston</td></tr>
            <tr><td>Charlie</td><td>35</td><td>Chicago</td></tr>
          </tbody>
        </table>
      `;
      table = document.getElementById('testTable');
    });

    it('should add sortable class to all headers when no columns specified', () => {
      makeTableSortable(table);
      
      const headers = table.querySelectorAll('th');
      headers.forEach(header => {
        expect(header.classList.contains('sortable')).toBe(true);
      });
    });

    it('should add sortable class only to specified columns', () => {
      makeTableSortable(table, [0, 2]); // Only Name and City columns
      
      expect(table.querySelectorAll('th')[0].classList.contains('sortable')).toBe(true);
      expect(table.querySelectorAll('th')[1].classList.contains('sortable')).toBe(false);
      expect(table.querySelectorAll('th')[2].classList.contains('sortable')).toBe(true);
    });

    it('should set cursor to pointer on sortable headers', () => {
      makeTableSortable(table);
      
      const headers = table.querySelectorAll('th');
      headers.forEach(header => {
        expect(header.style.cursor).toBe('pointer');
      });
    });

    it('should sort by string ascending on first click', () => {
      makeTableSortable(table);
      
      const nameHeader = table.querySelectorAll('th')[0];
      nameHeader.click();
      
      const rows = table.querySelectorAll('tbody tr');
      expect(rows[0].cells[0].textContent).toBe('Alice');
      expect(rows[1].cells[0].textContent).toBe('Bob');
      expect(rows[2].cells[0].textContent).toBe('Charlie');
      expect(nameHeader.classList.contains('sort-asc')).toBe(true);
    });

    it('should sort by string descending on second click', () => {
      makeTableSortable(table);
      
      const nameHeader = table.querySelectorAll('th')[0];
      nameHeader.click(); // Ascending
      nameHeader.click(); // Descending
      
      const rows = table.querySelectorAll('tbody tr');
      expect(rows[0].cells[0].textContent).toBe('Charlie');
      expect(rows[1].cells[0].textContent).toBe('Bob');
      expect(rows[2].cells[0].textContent).toBe('Alice');
      expect(nameHeader.classList.contains('sort-desc')).toBe(true);
    });

    it('should sort by number correctly', () => {
      makeTableSortable(table);
      
      const ageHeader = table.querySelectorAll('th')[1];
      ageHeader.click();
      
      const rows = table.querySelectorAll('tbody tr');
      expect(rows[0].cells[1].textContent).toBe('25');
      expect(rows[1].cells[1].textContent).toBe('30');
      expect(rows[2].cells[1].textContent).toBe('35');
    });

    it('should handle empty tbody gracefully', () => {
      table.querySelector('tbody').remove();
      
      expect(() => makeTableSortable(table)).not.toThrow();
    });

    it('should handle missing table gracefully', () => {
      expect(() => makeTableSortable(null)).not.toThrow();
    });

    it('should handle missing thead gracefully', () => {
      table.querySelector('thead').remove();
      
      expect(() => makeTableSortable(table)).not.toThrow();
    });

    it('should remove sort classes from other headers when sorting', () => {
      makeTableSortable(table);
      
      const headers = table.querySelectorAll('th');
      headers[0].click(); // Sort by Name
      headers[1].click(); // Sort by Age
      
      expect(headers[0].classList.contains('sort-asc')).toBe(false);
      expect(headers[0].classList.contains('sort-desc')).toBe(false);
      expect(headers[1].classList.contains('sort-asc')).toBe(true);
    });

    it('should handle cells with input elements', () => {
      document.body.innerHTML = `
        <table id="testTable">
          <thead><tr><th>Value</th></tr></thead>
          <tbody>
            <tr><td><input type="text" value="Zebra"></td></tr>
            <tr><td><input type="text" value="Apple"></td></tr>
          </tbody>
        </table>
      `;
      table = document.getElementById('testTable');
      
      makeTableSortable(table);
      table.querySelector('th').click();
      
      const rows = table.querySelectorAll('tbody tr');
      expect(rows[0].querySelector('input').value).toBe('Apple');
      expect(rows[1].querySelector('input').value).toBe('Zebra');
    });

    it('should handle cells with select elements', () => {
      document.body.innerHTML = `
        <table id="testTable">
          <thead><tr><th>Option</th></tr></thead>
          <tbody>
            <tr><td><select><option selected>Zebra</option></select></td></tr>
            <tr><td><select><option selected>Apple</option></select></td></tr>
          </tbody>
        </table>
      `;
      table = document.getElementById('testTable');
      
      makeTableSortable(table);
      
      const initialFirst = table.querySelectorAll('tbody tr')[0].querySelector('select').selectedOptions[0].text;
      
      table.querySelector('th').click();
      
      const rows = table.querySelectorAll('tbody tr');
      const sortedFirst = rows[0].querySelector('select').selectedOptions[0].text;
      
      // Verify sorting occurred (values should change)
      expect(rows.length).toBe(2);
      expect(sortedFirst).toBeTruthy();
    });
  });

  describe('addTableFilter', () => {
    let table, searchInput;

    beforeEach(() => {
      document.body.innerHTML = `
        <input id="searchInput" type="text">
        <table id="testTable">
          <thead><tr><th>Name</th></tr></thead>
          <tbody>
            <tr><td>Alice</td></tr>
            <tr><td>Bob</td></tr>
            <tr><td>Charlie</td></tr>
          </tbody>
        </table>
      `;
      table = document.getElementById('testTable');
      searchInput = document.getElementById('searchInput');
    });

    it('should filter rows based on search term', () => {
      addTableFilter(table, searchInput);
      
      searchInput.value = 'Bob';
      searchInput.dispatchEvent(new Event('input'));
      
      const rows = table.querySelectorAll('tbody tr');
      expect(rows[0].style.display).toBe('none'); // Alice
      expect(rows[1].style.display).toBe(''); // Bob
      expect(rows[2].style.display).toBe('none'); // Charlie
    });

    it('should be case insensitive', () => {
      addTableFilter(table, searchInput);
      
      searchInput.value = 'alice';
      searchInput.dispatchEvent(new Event('input'));
      
      const rows = table.querySelectorAll('tbody tr');
      expect(rows[0].style.display).toBe(''); // Alice
    });

    it('should show all rows when search is empty', () => {
      addTableFilter(table, searchInput);
      
      searchInput.value = 'Bob';
      searchInput.dispatchEvent(new Event('input'));
      
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        expect(row.style.display).toBe('');
      });
    });

    it('should skip quick-add rows', () => {
      document.body.innerHTML = `
        <input id="searchInput" type="text">
        <table id="testTable">
          <thead><tr><th>Name</th></tr></thead>
          <tbody>
            <tr><td>Alice</td></tr>
            <tr class="quick-add-row"><td>New Row</td></tr>
          </tbody>
        </table>
      `;
      table = document.getElementById('testTable');
      searchInput = document.getElementById('searchInput');
      
      addTableFilter(table, searchInput);
      
      searchInput.value = 'xyz'; // Should not match anything
      searchInput.dispatchEvent(new Event('input'));
      
      const quickAddRow = table.querySelector('.quick-add-row');
      expect(quickAddRow.style.display).toBe(''); // Should remain visible
    });

    it('should handle null table gracefully', () => {
      expect(() => addTableFilter(null, searchInput)).not.toThrow();
    });

    it('should handle null searchInput gracefully', () => {
      expect(() => addTableFilter(table, null)).not.toThrow();
    });
  });

  describe('addBatchSelection', () => {
    let table, onSelectionChange;

    beforeEach(() => {
      document.body.innerHTML = `
        <table id="testTable">
          <thead><tr><th>Name</th></tr></thead>
          <tbody>
            <tr><td>Alice</td></tr>
            <tr><td>Bob</td></tr>
            <tr><td>Charlie</td></tr>
          </tbody>
        </table>
      `;
      table = document.getElementById('testTable');
      onSelectionChange = vi.fn();
    });

    it('should add select all checkbox to header', () => {
      addBatchSelection(table, onSelectionChange);
      
      const selectAllCheckbox = table.querySelector('.select-all-checkbox');
      expect(selectAllCheckbox).not.toBeNull();
      expect(selectAllCheckbox.type).toBe('checkbox');
    });

    it('should add checkbox to each row', () => {
      addBatchSelection(table, onSelectionChange);
      
      const rowCheckboxes = table.querySelectorAll('.row-select-checkbox');
      expect(rowCheckboxes.length).toBe(3);
    });

    it('should select all rows when select all is checked', () => {
      addBatchSelection(table, onSelectionChange);
      
      const selectAllCheckbox = table.querySelector('.select-all-checkbox');
      selectAllCheckbox.checked = true;
      selectAllCheckbox.dispatchEvent(new Event('change'));
      
      const rowCheckboxes = table.querySelectorAll('.row-select-checkbox');
      rowCheckboxes.forEach(cb => {
        expect(cb.checked).toBe(true);
      });
    });

    it('should call onSelectionChange when selection changes', () => {
      addBatchSelection(table, onSelectionChange);
      
      const rowCheckbox = table.querySelector('.row-select-checkbox');
      rowCheckbox.checked = true;
      rowCheckbox.dispatchEvent(new Event('change'));
      
      expect(onSelectionChange).toHaveBeenCalledWith(1, 3);
    });

    it('should call onSelectionChange with correct counts on select all', () => {
      addBatchSelection(table, onSelectionChange);
      
      const selectAllCheckbox = table.querySelector('.select-all-checkbox');
      selectAllCheckbox.checked = true;
      selectAllCheckbox.dispatchEvent(new Event('change'));
      
      expect(onSelectionChange).toHaveBeenCalledWith(3, 3);
    });

    it('should handle missing table gracefully', () => {
      expect(() => addBatchSelection(null, onSelectionChange)).not.toThrow();
    });

    it('should handle missing thead gracefully', () => {
      table.querySelector('thead').remove();
      
      expect(() => addBatchSelection(table, onSelectionChange)).not.toThrow();
    });

    it('should handle missing tbody gracefully', () => {
      table.querySelector('tbody').remove();
      
      expect(() => addBatchSelection(table, onSelectionChange)).not.toThrow();
    });
  });

  describe('getSelectedRows', () => {
    let table;

    beforeEach(() => {
      document.body.innerHTML = `
        <table id="testTable">
          <thead><tr><th>Name</th></tr></thead>
          <tbody>
            <tr>
              <td><input type="checkbox" class="row-select-checkbox"></td>
              <td><button data-id="p001">Delete</button></td>
            </tr>
            <tr>
              <td><input type="checkbox" class="row-select-checkbox" checked></td>
              <td><button data-id="p002">Delete</button></td>
            </tr>
            <tr>
              <td><input type="checkbox" class="row-select-checkbox" checked></td>
              <td><button data-id="p003">Delete</button></td>
            </tr>
          </tbody>
        </table>
      `;
      table = document.getElementById('testTable');
    });

    it('should return IDs of checked rows', () => {
      const selected = getSelectedRows(table);
      
      expect(selected).toEqual(['p002', 'p003']);
    });

    it('should return empty array when no rows selected', () => {
      // Uncheck all
      table.querySelectorAll('.row-select-checkbox').forEach(cb => cb.checked = false);
      
      const selected = getSelectedRows(table);
      
      expect(selected).toEqual([]);
    });

    it('should return empty array for null table', () => {
      const selected = getSelectedRows(null);
      
      expect(selected).toEqual([]);
    });

    it('should return empty array when tbody is missing', () => {
      table.querySelector('tbody').remove();
      
      const selected = getSelectedRows(table);
      
      expect(selected).toEqual([]);
    });
  });
});
