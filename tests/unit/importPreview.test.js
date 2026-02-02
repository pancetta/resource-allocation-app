import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showImportPreview } from '../../js/helpers/importPreview.js';

describe('Import Preview Helper', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('showImportPreview', () => {
    it('should create and show modal overlay', async () => {
      const data = {
        people: [{ id: 'p001', name: 'Alice' }],
        projects: [{ id: 'proj001', name: 'Project A' }]
      };
      
      const promise = showImportPreview(data);
      
      const overlay = document.querySelector('.import-preview-overlay');
      expect(overlay).not.toBeNull();
      
      // Cancel to cleanup
      const cancelBtn = document.querySelector('.import-preview-cancel');
      cancelBtn.click();
      
      const result = await promise;
      expect(result).toBe(false);
    });

    it('should display data statistics correctly', async () => {
      const data = {
        people: [{ id: 'p001' }, { id: 'p002' }],
        projects: [{ id: 'proj001' }],
        defaultAllocations: [{ id: 1 }, { id: 2 }, { id: 3 }],
        fteValues: [{ id: 1 }],
        budgetValues: [{ id: 1 }, { id: 2 }],
        allocationOverrides: []
      };
      
      const promise = showImportPreview(data);
      
      const modal = document.querySelector('.import-preview-modal');
      expect(modal.innerHTML).toContain('2 person(s)');
      expect(modal.innerHTML).toContain('1 project(s)');
      expect(modal.innerHTML).toContain('3 allocation(s)');
      expect(modal.innerHTML).toContain('1 FTE value(s)');
      expect(modal.innerHTML).toContain('2 budget value(s)');
      expect(modal.innerHTML).toContain('0 override(s)');
      
      // Cancel
      const cancelBtn = document.querySelector('.import-preview-cancel');
      cancelBtn.click();
      await promise;
    });

    it('should show success message for valid data', async () => {
      const data = {
        people: [{ id: 'p001', name: 'Alice' }],
        projects: [{ id: 'proj001', name: 'Project A' }]
      };
      
      const promise = showImportPreview(data);
      
      const modal = document.querySelector('.import-preview-modal');
      expect(modal.innerHTML).toContain('Data structure looks valid');
      expect(modal.querySelector('.import-success')).not.toBeNull();
      
      // Cancel
      const cancelBtn = document.querySelector('.import-preview-cancel');
      cancelBtn.click();
      await promise;
    });

    it('should show error for invalid data', async () => {
      const data = {}; // No people or projects
      
      const promise = showImportPreview(data);
      
      const modal = document.querySelector('.import-preview-modal');
      expect(modal.innerHTML).toContain('No people or projects found');
      expect(modal.querySelector('.import-errors')).not.toBeNull();
      
      // Cancel
      const cancelBtn = document.querySelector('.import-preview-cancel');
      cancelBtn.click();
      await promise;
    });

    it('should disable confirm button when errors present', async () => {
      const data = {}; // Invalid
      
      const promise = showImportPreview(data);
      
      const confirmBtn = document.querySelector('.import-preview-confirm');
      expect(confirmBtn.disabled).toBe(true);
      expect(confirmBtn.textContent).toContain('Cannot Import');
      
      // Cancel
      const cancelBtn = document.querySelector('.import-preview-cancel');
      cancelBtn.click();
      await promise;
    });

    it('should show warnings for missing optional data', async () => {
      const data = {
        people: [{ id: 'p001' }]
        // Missing projects, allocations, etc.
      };
      
      const promise = showImportPreview(data);
      
      const modal = document.querySelector('.import-preview-modal');
      expect(modal.innerHTML).toContain('No projects data found');
      expect(modal.querySelector('.import-warnings')).not.toBeNull();
      
      // Cancel
      const cancelBtn = document.querySelector('.import-preview-cancel');
      cancelBtn.click();
      await promise;
    });

    it('should return false when cancel button clicked', async () => {
      const data = {
        people: [{ id: 'p001' }],
        projects: [{ id: 'proj001' }]
      };
      
      const promise = showImportPreview(data);
      
      const cancelBtn = document.querySelector('.import-preview-cancel');
      cancelBtn.click();
      
      const result = await promise;
      expect(result).toBe(false);
    });

    it('should return true when confirm button clicked', async () => {
      const data = {
        people: [{ id: 'p001' }],
        projects: [{ id: 'proj001' }]
      };
      
      const promise = showImportPreview(data);
      
      const confirmBtn = document.querySelector('.import-preview-confirm');
      confirmBtn.click();
      
      const result = await promise;
      expect(result).toBe(true);
    });

    it('should close modal when X button clicked', async () => {
      const data = {
        people: [{ id: 'p001' }],
        projects: [{ id: 'proj001' }]
      };
      
      const promise = showImportPreview(data);
      
      const closeBtn = document.querySelector('.import-preview-close');
      closeBtn.click();
      
      const result = await promise;
      expect(result).toBe(false);
      
      // Modal should be removed
      expect(document.querySelector('.import-preview-overlay')).toBeNull();
    });

    it('should close on Escape key', async () => {
      const data = {
        people: [{ id: 'p001' }],
        projects: [{ id: 'proj001' }]
      };
      
      const promise = showImportPreview(data);
      
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escEvent);
      
      const result = await promise;
      expect(result).toBe(false);
    });

    it('should not close on other keys', async () => {
      const data = {
        people: [{ id: 'p001' }],
        projects: [{ id: 'proj001' }]
      };
      
      const promise = showImportPreview(data);
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(enterEvent);
      
      // Modal should still be present
      expect(document.querySelector('.import-preview-overlay')).not.toBeNull();
      
      // Cancel
      const cancelBtn = document.querySelector('.import-preview-cancel');
      cancelBtn.click();
      await promise;
    });

    it('should handle non-object data gracefully', async () => {
      const data = "invalid";
      
      const promise = showImportPreview(data);
      
      const modal = document.querySelector('.import-preview-modal');
      expect(modal.innerHTML).toContain('Invalid data format');
      
      // Cancel
      const cancelBtn = document.querySelector('.import-preview-cancel');
      cancelBtn.click();
      await promise;
    });

    it('should handle null data gracefully', async () => {
      const data = null;
      
      const promise = showImportPreview(data);
      
      const modal = document.querySelector('.import-preview-modal');
      expect(modal.innerHTML).toContain('Invalid data format');
      
      // Cancel
      const cancelBtn = document.querySelector('.import-preview-cancel');
      cancelBtn.click();
      await promise;
    });

    it('should handle non-array data properties', async () => {
      const data = {
        people: "not an array",
        projects: [{ id: 'proj001' }]
      };
      
      const promise = showImportPreview(data);
      
      const modal = document.querySelector('.import-preview-modal');
      expect(modal.innerHTML).toContain('No people data found');
      
      // Cancel
      const cancelBtn = document.querySelector('.import-preview-cancel');
      cancelBtn.click();
      await promise;
    });

    it('should return false for undefined document', async () => {
      const originalDocument = global.document;
      global.document = undefined;
      
      const result = await showImportPreview({ people: [] });
      
      expect(result).toBe(false);
      
      global.document = originalDocument;
    });

    it('should not block confirmation for valid data with warnings', async () => {
      const data = {
        people: [{ id: 'p001' }],
        projects: [{ id: 'proj001' }]
        // Missing some optional fields - will show warnings but not errors
      };
      
      const promise = showImportPreview(data);
      
      const confirmBtn = document.querySelector('.import-preview-confirm');
      expect(confirmBtn.disabled).toBe(false);
      
      confirmBtn.click();
      const result = await promise;
      expect(result).toBe(true);
    });

    it('should handle empty arrays correctly', async () => {
      const data = {
        people: [],
        projects: [],
        defaultAllocations: [],
        fteValues: [],
        budgetValues: [],
        allocationOverrides: []
      };
      
      const promise = showImportPreview(data);
      
      const modal = document.querySelector('.import-preview-modal');
      expect(modal.innerHTML).toContain('0 person(s)');
      expect(modal.innerHTML).toContain('0 project(s)');
      expect(modal.innerHTML).toContain('No people or projects found');
      
      // Cancel
      const cancelBtn = document.querySelector('.import-preview-cancel');
      cancelBtn.click();
      await promise;
    });
  });
});
