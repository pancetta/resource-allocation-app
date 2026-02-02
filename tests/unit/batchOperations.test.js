import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addBatchOperationsToolbar, updateBatchToolbar, removeBatchToolbar } from '../../js/helpers/batchOperations.js';

describe('Batch Operations Helper', () => {
  let table;

  beforeEach(() => {
    document.body.innerHTML = `
      <div>
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
              <td><input type="checkbox" class="row-select-checkbox"></td>
              <td>Row 1</td>
              <td><button data-id="1">Delete</button></td>
            </tr>
            <tr>
              <td><input type="checkbox" class="row-select-checkbox" checked></td>
              <td>Row 2</td>
              <td><button data-id="2">Delete</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    table = document.getElementById('testTable');
  });

  describe('addBatchOperationsToolbar', () => {
    it('should create and insert toolbar before table', () => {
      const operations = {
        'Delete': vi.fn()
      };
      
      const toolbar = addBatchOperationsToolbar(table, operations);
      
      expect(toolbar).not.toBeNull();
      expect(toolbar.classList.contains('batch-toolbar')).toBe(true);
      expect(toolbar.nextElementSibling).toBe(table);
    });

    it('should return null for null table', () => {
      const operations = { 'Delete': vi.fn() };
      
      const toolbar = addBatchOperationsToolbar(null, operations);
      
      expect(toolbar).toBeNull();
    });

    it('should create selection counter', () => {
      const operations = { 'Delete': vi.fn() };
      
      const toolbar = addBatchOperationsToolbar(table, operations);
      const counter = toolbar.querySelector('.batch-counter');
      
      expect(counter).not.toBeNull();
      expect(counter.textContent).toBe('0 selected');
    });

    it('should create button for each operation', () => {
      const operations = {
        'Delete Selected': vi.fn(),
        'Export Selected': vi.fn()
      };
      
      const toolbar = addBatchOperationsToolbar(table, operations);
      const buttons = toolbar.querySelectorAll('.batch-action-btn');
      
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toBe('Delete Selected');
      expect(buttons[1].textContent).toBe('Export Selected');
    });

    it('should hide toolbar by default', () => {
      const operations = { 'Delete': vi.fn() };
      
      const toolbar = addBatchOperationsToolbar(table, operations);
      
      expect(toolbar.style.display).toBe('none');
    });

    it('should call handler when button clicked', async () => {
      const handler = vi.fn();
      const operations = { 'Delete': handler };
      
      const toolbar = addBatchOperationsToolbar(table, operations);
      const button = toolbar.querySelector('.batch-action-btn');
      
      button.click();
      
      expect(handler).toHaveBeenCalledWith(['2']); // Only checked row
    });

    it('should not call handler if no rows selected', async () => {
      // Uncheck all rows
      table.querySelectorAll('.row-select-checkbox').forEach(cb => cb.checked = false);
      
      const handler = vi.fn();
      const operations = { 'Delete': handler };
      
      const toolbar = addBatchOperationsToolbar(table, operations);
      const button = toolbar.querySelector('.batch-action-btn');
      
      button.click();
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('should return existing toolbar if already present', () => {
      const operations = { 'Delete': vi.fn() };
      
      const toolbar1 = addBatchOperationsToolbar(table, operations);
      const toolbar2 = addBatchOperationsToolbar(table, operations);
      
      expect(toolbar1).toBe(toolbar2);
      
      // Should only be one toolbar
      const toolbars = document.querySelectorAll('.batch-toolbar');
      expect(toolbars.length).toBe(1);
    });
  });

  describe('updateBatchToolbar', () => {
    it('should update counter text', () => {
      const operations = { 'Delete': vi.fn() };
      const toolbar = addBatchOperationsToolbar(table, operations);
      
      updateBatchToolbar(toolbar, 3, 10);
      
      const counter = toolbar.querySelector('.batch-counter');
      expect(counter.textContent).toBe('3 of 10 selected');
    });

    it('should show toolbar when items selected', () => {
      const operations = { 'Delete': vi.fn() };
      const toolbar = addBatchOperationsToolbar(table, operations);
      
      updateBatchToolbar(toolbar, 1, 10);
      
      expect(toolbar.style.display).toBe('flex');
    });

    it('should hide toolbar when no items selected', () => {
      const operations = { 'Delete': vi.fn() };
      const toolbar = addBatchOperationsToolbar(table, operations);
      
      // First show it
      updateBatchToolbar(toolbar, 1, 10);
      expect(toolbar.style.display).toBe('flex');
      
      // Then hide it
      updateBatchToolbar(toolbar, 0, 10);
      expect(toolbar.style.display).toBe('none');
    });

    it('should handle null toolbar gracefully', () => {
      expect(() => updateBatchToolbar(null, 1, 10)).not.toThrow();
    });

    it('should handle missing counter gracefully', () => {
      const toolbar = document.createElement('div');
      toolbar.className = 'batch-toolbar';
      
      expect(() => updateBatchToolbar(toolbar, 1, 10)).not.toThrow();
    });
  });

  describe('removeBatchToolbar', () => {
    it('should remove toolbar from DOM', () => {
      const operations = { 'Delete': vi.fn() };
      addBatchOperationsToolbar(table, operations);
      
      // Verify toolbar exists
      let toolbar = table.previousElementSibling;
      expect(toolbar).not.toBeNull();
      expect(toolbar.classList.contains('batch-toolbar')).toBe(true);
      
      removeBatchToolbar(table);
      
      // After removal, toolbar should be gone
      const toolbarAfter = document.querySelector('.batch-toolbar');
      expect(toolbarAfter).toBeNull();
    });

    it('should handle null table gracefully', () => {
      expect(() => removeBatchToolbar(null)).not.toThrow();
    });

    it('should handle table without toolbar gracefully', () => {
      expect(() => removeBatchToolbar(table)).not.toThrow();
    });

    it('should only remove batch toolbar, not other siblings', () => {
      const otherDiv = document.createElement('div');
      otherDiv.className = 'some-other-element';
      table.parentNode.insertBefore(otherDiv, table);
      
      const operations = { 'Delete': vi.fn() };
      addBatchOperationsToolbar(table, operations);
      
      removeBatchToolbar(table);
      
      // Other div should still be there
      expect(document.querySelector('.some-other-element')).not.toBeNull();
    });
  });
});
