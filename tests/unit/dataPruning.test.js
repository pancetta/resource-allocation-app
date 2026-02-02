import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { showDataPruningDialog } from '../../js/helpers/dataPruning.js';

// Mock database module
vi.mock('../../js/data/database.js', () => ({
  getPeople: vi.fn(async () => [
    { id: 'p001', name: 'Alice', active: true },
    { id: 'p002', name: 'Bob', active: false },
    { id: 'p003', name: 'Charlie', active: false }
  ]),
  getProjects: vi.fn(async () => [
    { id: 'proj001', name: 'Project A' },
    { id: 'proj002', name: 'Project B' }
  ]),
  getFteValues: vi.fn(async () => [
    { id: 1, personId: 'p001', fte: 1.0, startMonth: '2023-01', endMonth: '2023-12' },
    { id: 2, personId: 'p002', fte: 0.5, startMonth: '2024-01', endMonth: '2024-12' },
    { id: 3, personId: 'p003', fte: 1.0, startMonth: '2024-01', endMonth: null }
  ]),
  getBudgetValues: vi.fn(async () => [
    { id: 1, projectId: 'proj001', plannedPM: 5, startMonth: '2023-01', endMonth: '2023-12' },
    { id: 2, projectId: 'proj002', plannedPM: 10, startMonth: '2024-01', endMonth: '2024-12' }
  ]),
  getAllocations: vi.fn(async () => [
    { id: 1, personId: 'p001', projectId: 'proj001', pm: 1, startMonth: '2023-01', endMonth: '2023-12' },
    { id: 2, personId: 'p002', projectId: 'proj002', pm: 0.5, startMonth: '2024-01', endMonth: '2024-12' }
  ]),
  deletePerson: vi.fn(async () => {}),
  deleteProject: vi.fn(async () => {}),
  deleteFteValue: vi.fn(async () => {}),
  deleteBudgetValue: vi.fn(async () => {}),
  deleteAllocation: vi.fn(async () => {})
}));

// Mock undo manager
vi.mock('../../js/helpers/undoManager.js', () => ({
  saveState: vi.fn(async () => {})
}));

// Mock toast
vi.mock('../../js/ui/toast.js', () => ({
  showSuccess: vi.fn()
}));

describe('Data Pruning Helper', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any remaining modals
    const overlay = document.querySelector('.import-preview-overlay');
    if (overlay) {
      overlay.remove();
    }
  });

  describe('showDataPruningDialog', () => {
    it('should create and show modal overlay', async () => {
      const promise = showDataPruningDialog();
      
      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const overlay = document.querySelector('.import-preview-overlay');
      expect(overlay).not.toBeNull();
      
      // Close
      const closeBtn = document.querySelector('.import-preview-close');
      closeBtn.click();
      
      await promise;
    });

    it('should show pruning options', async () => {
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const modal = document.querySelector('.import-preview-modal');
      expect(modal.innerHTML).toContain('Delete Inactive People');
      expect(modal.innerHTML).toContain('Delete Old FTE/Budget Values');
      expect(modal.innerHTML).toContain('Delete Old Allocations');
      
      // Close
      const closeBtn = document.querySelector('.import-preview-close');
      closeBtn.click();
      await promise;
    });

    it('should display count of inactive people', async () => {
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const modal = document.querySelector('.import-preview-modal');
      expect(modal.innerHTML).toContain('(2 people)'); // Bob and Charlie are inactive
      
      // Close
      const closeBtn = document.querySelector('.import-preview-close');
      closeBtn.click();
      await promise;
    });

    it('should have inactive people checkbox checked by default', async () => {
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const checkbox = document.querySelector('#pruneInactivePeople');
      expect(checkbox.checked).toBe(true);
      
      // Close
      const closeBtn = document.querySelector('.import-preview-close');
      closeBtn.click();
      await promise;
    });

    it('should have date inputs for old data pruning', async () => {
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const oldDataInput = document.querySelector('#pruneOldDataBefore');
      const oldAllocationsInput = document.querySelector('#pruneOldAllocationsBefore');
      
      expect(oldDataInput).not.toBeNull();
      expect(oldDataInput.type).toBe('month');
      expect(oldAllocationsInput).not.toBeNull();
      expect(oldAllocationsInput.type).toBe('month');
      
      // Close
      const closeBtn = document.querySelector('.import-preview-close');
      closeBtn.click();
      await promise;
    });

    it('should close on X button click', async () => {
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const closeBtn = document.querySelector('.import-preview-close');
      closeBtn.click();
      
      await promise;
      
      expect(document.querySelector('.import-preview-overlay')).toBeNull();
    });

    it('should close on Cancel button click', async () => {
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const cancelBtn = document.querySelector('.import-preview-cancel');
      cancelBtn.click();
      
      await promise;
      
      expect(document.querySelector('.import-preview-overlay')).toBeNull();
    });

    it('should close on Escape key', async () => {
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escEvent);
      
      await promise;
      
      expect(document.querySelector('.import-preview-overlay')).toBeNull();
    });

    it('should update old data count when date selected', async () => {
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const oldDataInput = document.querySelector('#pruneOldDataBefore');
      oldDataInput.value = '2024-01';
      oldDataInput.dispatchEvent(new Event('change'));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const countDisplay = document.querySelector('#oldDataCount');
      // Should show FTE values + budget values that end before 2024-01
      // That's 1 FTE (ends 2023-12) + 1 budget (ends 2023-12) = 2 total
      expect(countDisplay.textContent).toContain('1 FTE');
      expect(countDisplay.textContent).toContain('1 budget');
      
      // Close
      const closeBtn = document.querySelector('.import-preview-close');
      closeBtn.click();
      await promise;
    });

    it('should update allocations count when date selected', async () => {
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const oldAllocationsInput = document.querySelector('#pruneOldAllocationsBefore');
      oldAllocationsInput.value = '2024-01';
      oldAllocationsInput.dispatchEvent(new Event('change'));
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const countDisplay = document.querySelector('#oldAllocationsCount');
      // Should show allocations that end before 2024-01
      // That's 1 allocation (ends 2023-12)
      expect(countDisplay.textContent).toContain('(1 allocations)');
      
      // Close
      const closeBtn = document.querySelector('.import-preview-close');
      closeBtn.click();
      await promise;
    });

    it('should show preview button initially', async () => {
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const previewBtn = document.querySelector('#previewPruneBtn');
      const executeBtn = document.querySelector('#executePruneBtn');
      
      expect(previewBtn).not.toBeNull();
      expect(previewBtn.style.display).not.toBe('none');
      expect(executeBtn.style.display).toBe('none');
      
      // Close
      const closeBtn = document.querySelector('.import-preview-close');
      closeBtn.click();
      await promise;
    });

    it('should show execute button after preview', async () => {
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Check inactive people
      const checkbox = document.querySelector('#pruneInactivePeople');
      checkbox.checked = true;
      
      const previewBtn = document.querySelector('#previewPruneBtn');
      previewBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const executeBtn = document.querySelector('#executePruneBtn');
      expect(executeBtn.style.display).toBe('inline-block');
      expect(previewBtn.style.display).toBe('none');
      
      // Close
      const closeBtn = document.querySelector('.import-preview-close');
      closeBtn.click();
      await promise;
    });

    it('should show preview content after preview click', async () => {
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const previewBtn = document.querySelector('#previewPruneBtn');
      previewBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const previewSection = document.querySelector('#prunePreview');
      expect(previewSection.style.display).toBe('block');
      expect(previewSection.textContent).toContain('Preview of Items to be Deleted');
      
      // Close
      const closeBtn = document.querySelector('.import-preview-close');
      closeBtn.click();
      await promise;
    });

    it('should execute pruning when execute button clicked', async () => {
      const db = await import('../../js/data/database.js');
      const undoManager = await import('../../js/helpers/undoManager.js');
      const toast = await import('../../js/ui/toast.js');
      
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Set up pruning options
      const checkbox = document.querySelector('#pruneInactivePeople');
      checkbox.checked = true;
      
      const previewBtn = document.querySelector('#previewPruneBtn');
      previewBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const executeBtn = document.querySelector('#executePruneBtn');
      executeBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await promise;
      
      // Should have saved state for undo
      expect(undoManager.saveState).toHaveBeenCalledWith('Data pruning');
      
      // Should have deleted inactive people and their FTE values
      expect(db.deletePerson).toHaveBeenCalled();
      expect(db.deleteFteValue).toHaveBeenCalled();
      
      // Should show success toast
      expect(toast.showSuccess).toHaveBeenCalled();
    });

    it('should return early if document is undefined', async () => {
      const originalDocument = global.document;
      global.document = undefined;
      
      await showDataPruningDialog();
      
      global.document = originalDocument;
      
      // Should complete without error
      expect(true).toBe(true);
    });

    it('should handle empty preview gracefully', async () => {
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Uncheck all options
      const checkbox = document.querySelector('#pruneInactivePeople');
      checkbox.checked = false;
      
      const previewBtn = document.querySelector('#previewPruneBtn');
      previewBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const previewContent = document.querySelector('#prunePreviewContent');
      expect(previewContent.textContent).toContain('No items selected');
      
      // Close
      const closeBtn = document.querySelector('.import-preview-close');
      closeBtn.click();
      await promise;
    });

    it('should prune old FTE/budget values when date selected', async () => {
      const db = await import('../../js/data/database.js');
      
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Uncheck inactive people
      const checkbox = document.querySelector('#pruneInactivePeople');
      checkbox.checked = false;
      
      // Set date for old data
      const oldDataInput = document.querySelector('#pruneOldDataBefore');
      oldDataInput.value = '2024-01';
      oldDataInput.dispatchEvent(new Event('change'));
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const previewBtn = document.querySelector('#previewPruneBtn');
      previewBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const executeBtn = document.querySelector('#executePruneBtn');
      executeBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await promise;
      
      // Should have deleted old FTE and budget values
      expect(db.deleteFteValue).toHaveBeenCalled();
      expect(db.deleteBudgetValue).toHaveBeenCalled();
    });

    it('should prune old allocations when date selected', async () => {
      const db = await import('../../js/data/database.js');
      
      const promise = showDataPruningDialog();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Uncheck inactive people
      const checkbox = document.querySelector('#pruneInactivePeople');
      checkbox.checked = false;
      
      // Set date for old allocations
      const oldAllocationsInput = document.querySelector('#pruneOldAllocationsBefore');
      oldAllocationsInput.value = '2024-01';
      oldAllocationsInput.dispatchEvent(new Event('change'));
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const previewBtn = document.querySelector('#previewPruneBtn');
      previewBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const executeBtn = document.querySelector('#executePruneBtn');
      executeBtn.click();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await promise;
      
      // Should have deleted old allocations
      expect(db.deleteAllocation).toHaveBeenCalled();
    });
  });
});
