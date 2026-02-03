import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createValidatedBatchDeleteHandler, createCascadeBatchDeleteHandler } from '../../js/helpers/batchDeleteHelpers.js';

// Mock dependencies
vi.mock('../../js/helpers/undoManager.js', () => ({
  saveState: vi.fn()
}));

vi.mock('../../js/main.js', () => ({
  scheduleAutoBackup: vi.fn()
}));

vi.mock('../../js/ui/toast.js', () => ({
  showSuccess: vi.fn()
}));

describe('Batch Delete Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm and window.alert
    global.confirm = vi.fn(() => true);
    global.alert = vi.fn();
  });

  describe('createValidatedBatchDeleteHandler', () => {
    it('should validate all deletions before proceeding', async () => {
      const validateDeletion = vi.fn()
        .mockResolvedValueOnce({ valid: true })
        .mockResolvedValueOnce({ valid: false, message: 'Cannot delete' });
      
      const deleteFunc = vi.fn();
      const renderFunc = vi.fn();
      
      const handler = createValidatedBatchDeleteHandler({
        validateDeletion,
        deleteFunc,
        renderFunc,
        entityName: 'test item',
        entityNamePlural: 'test items'
      });
      
      await handler(['1', '2']);
      
      expect(validateDeletion).toHaveBeenCalledTimes(2);
      expect(validateDeletion).toHaveBeenCalledWith(1);
      expect(validateDeletion).toHaveBeenCalledWith(2);
      expect(deleteFunc).not.toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Cannot delete some test items'));
    });

    it('should proceed with deletion when all validations pass', async () => {
      const validateDeletion = vi.fn().mockResolvedValue({ valid: true });
      const deleteFunc = vi.fn().mockResolvedValue(undefined);
      const renderFunc = vi.fn();
      
      const handler = createValidatedBatchDeleteHandler({
        validateDeletion,
        deleteFunc,
        renderFunc,
        entityName: 'test item',
        entityNamePlural: 'test items'
      });
      
      await handler(['1', '2', '3']);
      
      expect(validateDeletion).toHaveBeenCalledTimes(3);
      expect(global.confirm).toHaveBeenCalledWith('Delete 3 selected test items?');
      expect(deleteFunc).toHaveBeenCalledTimes(3);
      expect(deleteFunc).toHaveBeenCalledWith(1);
      expect(deleteFunc).toHaveBeenCalledWith(2);
      expect(deleteFunc).toHaveBeenCalledWith(3);
      expect(renderFunc).toHaveBeenCalled();
    });

    it('should cancel deletion if user declines confirmation', async () => {
      global.confirm = vi.fn(() => false);
      
      const validateDeletion = vi.fn().mockResolvedValue({ valid: true });
      const deleteFunc = vi.fn();
      const renderFunc = vi.fn();
      
      const handler = createValidatedBatchDeleteHandler({
        validateDeletion,
        deleteFunc,
        renderFunc,
        entityName: 'test item',
        entityNamePlural: 'test items'
      });
      
      await handler(['1', '2']);
      
      expect(deleteFunc).not.toHaveBeenCalled();
      expect(renderFunc).not.toHaveBeenCalled();
    });

    it('should convert string IDs to integers', async () => {
      const validateDeletion = vi.fn().mockResolvedValue({ valid: true });
      const deleteFunc = vi.fn().mockResolvedValue(undefined);
      const renderFunc = vi.fn();
      
      const handler = createValidatedBatchDeleteHandler({
        validateDeletion,
        deleteFunc,
        renderFunc,
        entityName: 'test item',
        entityNamePlural: 'test items'
      });
      
      await handler(['123', '456']);
      
      expect(validateDeletion).toHaveBeenCalledWith(123);
      expect(validateDeletion).toHaveBeenCalledWith(456);
      expect(deleteFunc).toHaveBeenCalledWith(123);
      expect(deleteFunc).toHaveBeenCalledWith(456);
    });
  });

  describe('createCascadeBatchDeleteHandler', () => {
    it('should delete child records before parent records', async () => {
      const deletionOrder = [];
      
      const getChildRecords = vi.fn().mockResolvedValue([
        { id: 101, parentId: '1' },
        { id: 102, parentId: '1' },
        { id: 103, parentId: '2' }
      ]);
      
      const filterChildRecords = vi.fn((records, parentId) => 
        records.filter(r => r.parentId === parentId)
      );
      
      const deleteChildRecord = vi.fn((id) => {
        deletionOrder.push({ type: 'child', id });
      });
      
      const deleteParent = vi.fn((id) => {
        deletionOrder.push({ type: 'parent', id });
      });
      
      const renderParent = vi.fn();
      const renderChild = vi.fn();
      
      const handler = createCascadeBatchDeleteHandler({
        getChildRecords,
        filterChildRecords,
        deleteChildRecord,
        deleteParent,
        renderParent,
        renderChild,
        parentName: 'parent',
        parentNamePlural: 'parents',
        childNamePlural: 'children'
      });
      
      await handler(['1', '2']);
      
      // Verify deletion order: children first, then parent
      expect(deletionOrder).toEqual([
        { type: 'child', id: 101 },
        { type: 'child', id: 102 },
        { type: 'parent', id: '1' },
        { type: 'child', id: 103 },
        { type: 'parent', id: '2' }
      ]);
      
      expect(renderParent).toHaveBeenCalled();
      expect(renderChild).toHaveBeenCalled();
    });

    it('should cancel deletion if user declines confirmation', async () => {
      global.confirm = vi.fn(() => false);
      
      const getChildRecords = vi.fn();
      const filterChildRecords = vi.fn();
      const deleteChildRecord = vi.fn();
      const deleteParent = vi.fn();
      const renderParent = vi.fn();
      const renderChild = vi.fn();
      
      const handler = createCascadeBatchDeleteHandler({
        getChildRecords,
        filterChildRecords,
        deleteChildRecord,
        deleteParent,
        renderParent,
        renderChild,
        parentName: 'parent',
        parentNamePlural: 'parents',
        childNamePlural: 'children'
      });
      
      await handler(['1', '2']);
      
      expect(getChildRecords).not.toHaveBeenCalled();
      expect(deleteParent).not.toHaveBeenCalled();
      expect(deleteChildRecord).not.toHaveBeenCalled();
    });

    it('should show confirmation message mentioning cascade deletion', async () => {
      const getChildRecords = vi.fn().mockResolvedValue([]);
      const filterChildRecords = vi.fn(() => []);
      const deleteChildRecord = vi.fn();
      const deleteParent = vi.fn();
      const renderParent = vi.fn();
      const renderChild = vi.fn();
      
      const handler = createCascadeBatchDeleteHandler({
        getChildRecords,
        filterChildRecords,
        deleteChildRecord,
        deleteParent,
        renderParent,
        renderChild,
        parentName: 'parent',
        parentNamePlural: 'parents',
        childNamePlural: 'children'
      });
      
      await handler(['1', '2']);
      
      expect(global.confirm).toHaveBeenCalledWith(
        'Delete 2 selected parents? This will also delete their children.'
      );
    });

    it('should handle parents with no child records', async () => {
      const getChildRecords = vi.fn().mockResolvedValue([]);
      const filterChildRecords = vi.fn(() => []);
      const deleteChildRecord = vi.fn();
      const deleteParent = vi.fn();
      const renderParent = vi.fn();
      const renderChild = vi.fn();
      
      const handler = createCascadeBatchDeleteHandler({
        getChildRecords,
        filterChildRecords,
        deleteChildRecord,
        deleteParent,
        renderParent,
        renderChild,
        parentName: 'parent',
        parentNamePlural: 'parents',
        childNamePlural: 'children'
      });
      
      await handler(['1', '2']);
      
      expect(deleteChildRecord).not.toHaveBeenCalled();
      expect(deleteParent).toHaveBeenCalledTimes(2);
      expect(deleteParent).toHaveBeenCalledWith('1');
      expect(deleteParent).toHaveBeenCalledWith('2');
    });
  });
});
