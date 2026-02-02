import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addQuickAddRow, hasQuickAddRow, removeQuickAddRow } from '../../js/helpers/quickAdd.js';

describe('Quick Add Row Helper', () => {
  let table;

  beforeEach(() => {
    document.body.innerHTML = `
      <table id="testTable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Row 1</td>
            <td>100</td>
            <td><button>Delete</button></td>
          </tr>
        </tbody>
      </table>
    `;
    table = document.getElementById('testTable');
  });

  describe('addQuickAddRow', () => {
    it('should add a quick-add row to the table', () => {
      const onAdd = vi.fn();
      
      addQuickAddRow(table, ['Name', 'Value'], onAdd);
      
      const quickAddRow = table.querySelector('.quick-add-row');
      expect(quickAddRow).not.toBeNull();
    });

    it('should add quick-add row at the top of tbody', () => {
      const onAdd = vi.fn();
      
      addQuickAddRow(table, ['Name', 'Value'], onAdd);
      
      const firstRow = table.querySelector('tbody tr');
      expect(firstRow.classList.contains('quick-add-row')).toBe(true);
    });

    it('should create input fields with correct placeholders', () => {
      const onAdd = vi.fn();
      
      addQuickAddRow(table, ['Name placeholder', 'Value placeholder'], onAdd);
      
      const inputs = table.querySelectorAll('.quick-add-input');
      expect(inputs.length).toBe(2);
      expect(inputs[0].placeholder).toBe('Name placeholder');
      expect(inputs[1].placeholder).toBe('Value placeholder');
    });

    it('should add save and cancel buttons', () => {
      const onAdd = vi.fn();
      
      addQuickAddRow(table, ['Name'], onAdd);
      
      const saveBtn = table.querySelector('.quick-add-save');
      const cancelBtn = table.querySelector('.quick-add-cancel');
      
      expect(saveBtn).not.toBeNull();
      expect(cancelBtn).not.toBeNull();
    });

    it('should focus first input on creation', () => {
      const onAdd = vi.fn();
      
      addQuickAddRow(table, ['Name', 'Value'], onAdd);
      
      const firstInput = table.querySelector('.quick-add-input');
      expect(document.activeElement).toBe(firstInput);
    });

    it('should call onAdd when save button is clicked', () => {
      const onAdd = vi.fn();
      
      addQuickAddRow(table, ['Name', 'Value'], onAdd);
      
      const inputs = table.querySelectorAll('.quick-add-input');
      inputs[0].value = 'Test Name';
      inputs[1].value = 'Test Value';
      
      const saveBtn = table.querySelector('.quick-add-save');
      saveBtn.click();
      
      expect(onAdd).toHaveBeenCalledWith(['Test Name', 'Test Value']);
    });

    it('should remove quick-add row after save', () => {
      const onAdd = vi.fn();
      
      addQuickAddRow(table, ['Name'], onAdd);
      
      const input = table.querySelector('.quick-add-input');
      input.value = 'Test';
      
      const saveBtn = table.querySelector('.quick-add-save');
      saveBtn.click();
      
      expect(table.querySelector('.quick-add-row')).toBeNull();
    });

    it('should cancel without calling onAdd when all fields are empty', () => {
      const onAdd = vi.fn();
      
      addQuickAddRow(table, ['Name', 'Value'], onAdd);
      
      const saveBtn = table.querySelector('.quick-add-save');
      saveBtn.click();
      
      expect(onAdd).not.toHaveBeenCalled();
      expect(table.querySelector('.quick-add-row')).toBeNull();
    });

    it('should remove row when cancel button is clicked', () => {
      const onAdd = vi.fn();
      const onCancel = vi.fn();
      
      addQuickAddRow(table, ['Name'], onAdd, onCancel);
      
      const cancelBtn = table.querySelector('.quick-add-cancel');
      cancelBtn.click();
      
      expect(table.querySelector('.quick-add-row')).toBeNull();
      expect(onCancel).toHaveBeenCalled();
    });

    it('should save on Enter key in last input', () => {
      const onAdd = vi.fn();
      
      addQuickAddRow(table, ['Name', 'Value'], onAdd);
      
      const inputs = table.querySelectorAll('.quick-add-input');
      inputs[0].value = 'Test Name';
      inputs[1].value = 'Test Value';
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      inputs[1].dispatchEvent(enterEvent);
      
      expect(onAdd).toHaveBeenCalledWith(['Test Name', 'Test Value']);
    });

    it('should move to next input on Enter in non-last input', () => {
      const onAdd = vi.fn();
      
      addQuickAddRow(table, ['Name', 'Value'], onAdd);
      
      const inputs = table.querySelectorAll('.quick-add-input');
      inputs[0].value = 'Test';
      
      const focusSpy = vi.spyOn(inputs[1], 'focus');
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      inputs[0].dispatchEvent(enterEvent);
      
      expect(focusSpy).toHaveBeenCalled();
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('should cancel on Escape key', () => {
      const onAdd = vi.fn();
      const onCancel = vi.fn();
      
      addQuickAddRow(table, ['Name'], onAdd, onCancel);
      
      const input = table.querySelector('.quick-add-input');
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      input.dispatchEvent(escEvent);
      
      expect(table.querySelector('.quick-add-row')).toBeNull();
      expect(onCancel).toHaveBeenCalled();
    });

    it('should save on Tab in last input', () => {
      const onAdd = vi.fn();
      
      addQuickAddRow(table, ['Name', 'Value'], onAdd);
      
      const inputs = table.querySelectorAll('.quick-add-input');
      inputs[0].value = 'Test Name';
      inputs[1].value = 'Test Value';
      
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false });
      Object.defineProperty(tabEvent, 'preventDefault', { value: vi.fn() });
      inputs[1].dispatchEvent(tabEvent);
      
      expect(onAdd).toHaveBeenCalledWith(['Test Name', 'Test Value']);
    });

    it('should remove existing quick-add row before adding new one', () => {
      const onAdd = vi.fn();
      
      addQuickAddRow(table, ['Name'], onAdd);
      addQuickAddRow(table, ['Name'], onAdd);
      
      const quickAddRows = table.querySelectorAll('.quick-add-row');
      expect(quickAddRows.length).toBe(1);
    });

    it('should handle null table gracefully', () => {
      expect(() => addQuickAddRow(null, ['Name'], vi.fn())).not.toThrow();
    });

    it('should handle table without tbody gracefully', () => {
      table.querySelector('tbody').remove();
      
      expect(() => addQuickAddRow(table, ['Name'], vi.fn())).not.toThrow();
    });
  });

  describe('hasQuickAddRow', () => {
    it('should return false initially', () => {
      expect(hasQuickAddRow(table)).toBe(false);
    });

    it('should return true after adding quick-add row', () => {
      addQuickAddRow(table, ['Name'], vi.fn());
      
      expect(hasQuickAddRow(table)).toBe(true);
    });

    it('should return false after removing quick-add row', () => {
      addQuickAddRow(table, ['Name'], vi.fn());
      removeQuickAddRow(table);
      
      expect(hasQuickAddRow(table)).toBe(false);
    });

    it('should handle null table gracefully', () => {
      expect(hasQuickAddRow(null)).toBe(false);
    });

    it('should handle table without tbody gracefully', () => {
      table.querySelector('tbody').remove();
      
      expect(hasQuickAddRow(table)).toBe(false);
    });
  });

  describe('removeQuickAddRow', () => {
    it('should remove quick-add row from table', () => {
      addQuickAddRow(table, ['Name'], vi.fn());
      
      removeQuickAddRow(table);
      
      expect(table.querySelector('.quick-add-row')).toBeNull();
    });

    it('should not throw if no quick-add row exists', () => {
      expect(() => removeQuickAddRow(table)).not.toThrow();
    });

    it('should handle null table gracefully', () => {
      expect(() => removeQuickAddRow(null)).not.toThrow();
    });

    it('should handle table without tbody gracefully', () => {
      table.querySelector('tbody').remove();
      
      expect(() => removeQuickAddRow(table)).not.toThrow();
    });
  });
});
