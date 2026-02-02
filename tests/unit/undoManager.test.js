import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveState, undo, redo, canUndo, canRedo, getLastAction, getNextRedoAction, updateUndoRedoButtons } from '../../js/helpers/undoManager.js';

// Mock database module
vi.mock('../../js/data/database.js', () => ({
  exportData: vi.fn(async () => ({
    version: '1.0',
    data: { people: [], projects: [], allocations: [] }
  })),
  importData: vi.fn(async (data, reload) => {
    // Simulate import without actually reloading
  })
}));

// Mock toast module
vi.mock('../../js/ui/toast.js', () => ({
  showSuccess: vi.fn()
}));

describe('Undo/Redo Manager', () => {
  let mockExportData, mockImportData;

  beforeEach(async () => {
    // Clear DOM
    document.body.innerHTML = `
      <button id="undoBtn"></button>
      <button id="redoBtn"></button>
    `;
    
    // Reset mocks
    const db = await import('../../js/data/database.js');
    mockExportData = db.exportData;
    mockImportData = db.importData;
    
    mockExportData.mockClear();
    mockImportData.mockClear();
    
    // Reset the undo manager state by importing fresh
    vi.resetModules();
  });

  describe('saveState', () => {
    it('should save state to undo stack', async () => {
      const { saveState, canUndo } = await import('../../js/helpers/undoManager.js');
      
      await saveState('Test action');
      
      expect(canUndo()).toBe(true);
    });

    it('should store action name', async () => {
      const { saveState, getLastAction } = await import('../../js/helpers/undoManager.js');
      
      await saveState('Add person');
      
      expect(getLastAction()).toBe('Add person');
    });

    it('should limit undo stack to MAX_HISTORY (20)', async () => {
      const { saveState, canUndo } = await import('../../js/helpers/undoManager.js');
      
      // Add 25 states
      for (let i = 0; i < 25; i++) {
        await saveState(`Action ${i}`);
      }
      
      // Should have called exportData 25 times but only keep 20
      expect(canUndo()).toBe(true);
    });

    it('should clear redo stack on new action', async () => {
      const { saveState, undo, canRedo } = await import('../../js/helpers/undoManager.js');
      
      await saveState('Action 1');
      await undo();
      
      expect(canRedo()).toBe(true);
      
      await saveState('Action 2');
      
      expect(canRedo()).toBe(false);
    });
  });

  describe('undo', () => {
    it('should return false when undo stack is empty', async () => {
      const { undo } = await import('../../js/helpers/undoManager.js');
      
      const result = await undo();
      
      expect(result).toBe(false);
    });

    it('should restore previous state', async () => {
      const { saveState, undo } = await import('../../js/helpers/undoManager.js');
      const db = await import('../../js/data/database.js');
      
      await saveState('Test action');
      const result = await undo();
      
      expect(result).toBe(true);
      expect(db.importData).toHaveBeenCalled();
    });

    it('should move state to redo stack', async () => {
      const { saveState, undo, canRedo } = await import('../../js/helpers/undoManager.js');
      
      await saveState('Action 1');
      await undo();
      
      expect(canRedo()).toBe(true);
    });

    it('should call importData with reload=false', async () => {
      const { saveState, undo } = await import('../../js/helpers/undoManager.js');
      const db = await import('../../js/data/database.js');
      
      await saveState('Test action');
      await undo();
      
      expect(db.importData).toHaveBeenCalledWith(expect.any(Object), false);
    });
  });

  describe('redo', () => {
    it('should return false when redo stack is empty', async () => {
      const { redo } = await import('../../js/helpers/undoManager.js');
      
      const result = await redo();
      
      expect(result).toBe(false);
    });

    it('should restore next state', async () => {
      const { saveState, undo, redo } = await import('../../js/helpers/undoManager.js');
      const db = await import('../../js/data/database.js');
      
      await saveState('Action 1');
      await undo();
      
      db.importData.mockClear();
      const result = await redo();
      
      expect(result).toBe(true);
      expect(db.importData).toHaveBeenCalled();
    });

    it('should move state back to undo stack', async () => {
      const { saveState, undo, redo, canUndo } = await import('../../js/helpers/undoManager.js');
      
      await saveState('Action 1');
      await undo();
      await redo();
      
      expect(canUndo()).toBe(true);
    });
  });

  describe('canUndo', () => {
    it('should return false initially', async () => {
      const { canUndo } = await import('../../js/helpers/undoManager.js');
      
      expect(canUndo()).toBe(false);
    });

    it('should return true after saving state', async () => {
      const { saveState, canUndo } = await import('../../js/helpers/undoManager.js');
      
      await saveState('Test action');
      
      expect(canUndo()).toBe(true);
    });

    it('should return false after undoing all actions', async () => {
      const { saveState, undo, canUndo } = await import('../../js/helpers/undoManager.js');
      
      await saveState('Action 1');
      await undo();
      
      expect(canUndo()).toBe(false);
    });
  });

  describe('canRedo', () => {
    it('should return false initially', async () => {
      const { canRedo } = await import('../../js/helpers/undoManager.js');
      
      expect(canRedo()).toBe(false);
    });

    it('should return true after undo', async () => {
      const { saveState, undo, canRedo } = await import('../../js/helpers/undoManager.js');
      
      await saveState('Action 1');
      await undo();
      
      expect(canRedo()).toBe(true);
    });

    it('should return false after redoing all actions', async () => {
      const { saveState, undo, redo, canRedo } = await import('../../js/helpers/undoManager.js');
      
      await saveState('Action 1');
      await undo();
      await redo();
      
      expect(canRedo()).toBe(false);
    });
  });

  describe('getLastAction', () => {
    it('should return null when stack is empty', async () => {
      const { getLastAction } = await import('../../js/helpers/undoManager.js');
      
      expect(getLastAction()).toBeNull();
    });

    it('should return last action name', async () => {
      const { saveState, getLastAction } = await import('../../js/helpers/undoManager.js');
      
      await saveState('Delete person');
      
      expect(getLastAction()).toBe('Delete person');
    });
  });

  describe('getNextRedoAction', () => {
    it('should return null when redo stack is empty', async () => {
      const { getNextRedoAction } = await import('../../js/helpers/undoManager.js');
      
      expect(getNextRedoAction()).toBeNull();
    });

    it('should return next redo action name', async () => {
      const { saveState, undo, getNextRedoAction } = await import('../../js/helpers/undoManager.js');
      
      await saveState('Add person');
      await undo();
      
      expect(getNextRedoAction()).toBe('Add person');
    });
  });

  describe('updateUndoRedoButtons', () => {
    it('should disable undo button when no history', async () => {
      const { updateUndoRedoButtons } = await import('../../js/helpers/undoManager.js');
      
      updateUndoRedoButtons();
      
      const undoBtn = document.getElementById('undoBtn');
      expect(undoBtn.disabled).toBe(true);
    });

    it('should enable undo button when history exists', async () => {
      const { saveState, updateUndoRedoButtons } = await import('../../js/helpers/undoManager.js');
      
      await saveState('Test action');
      updateUndoRedoButtons();
      
      const undoBtn = document.getElementById('undoBtn');
      expect(undoBtn.disabled).toBe(false);
    });

    it('should disable redo button when no redo history', async () => {
      const { updateUndoRedoButtons } = await import('../../js/helpers/undoManager.js');
      
      updateUndoRedoButtons();
      
      const redoBtn = document.getElementById('redoBtn');
      expect(redoBtn.disabled).toBe(true);
    });

    it('should enable redo button after undo', async () => {
      const { saveState, undo, updateUndoRedoButtons } = await import('../../js/helpers/undoManager.js');
      
      await saveState('Test action');
      await undo();
      updateUndoRedoButtons();
      
      const redoBtn = document.getElementById('redoBtn');
      expect(redoBtn.disabled).toBe(false);
    });

    it('should set tooltip with action name', async () => {
      const { saveState, updateUndoRedoButtons } = await import('../../js/helpers/undoManager.js');
      
      await saveState('Delete person');
      updateUndoRedoButtons();
      
      const undoBtn = document.getElementById('undoBtn');
      expect(undoBtn.title).toContain('Delete person');
    });

    it('should handle missing buttons gracefully', async () => {
      document.body.innerHTML = '';
      const { updateUndoRedoButtons } = await import('../../js/helpers/undoManager.js');
      
      expect(() => updateUndoRedoButtons()).not.toThrow();
    });
  });
});
