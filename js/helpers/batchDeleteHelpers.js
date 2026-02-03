/**
 * Batch Delete Helpers
 * 
 * Reusable functions for creating batch delete handlers with common patterns
 */

import { saveState } from './undoManager.js';
import { scheduleAutoBackup } from '../main.js';
import { showSuccess } from '../ui/toast.js';

/**
 * Creates a batch delete handler with validation
 * Used for simple entities like FTE values and Budget values
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.validateDeletion - Async function to validate each deletion (id) => Promise<{valid: boolean, message?: string}>
 * @param {Function} options.deleteFunc - Async function to delete an item (id) => Promise<void>
 * @param {Function} options.renderFunc - Function to re-render the view after deletion
 * @param {string} options.entityName - Name of entity for messages (e.g., "FTE value", "budget value")
 * @param {string} options.entityNamePlural - Plural name of entity for messages (e.g., "FTE values", "budget values")
 * @returns {Function} Batch delete handler function
 */
export function createValidatedBatchDeleteHandler({
    validateDeletion,
    deleteFunc,
    renderFunc,
    entityName,
    entityNamePlural
}) {
    return async (selectedIds) => {
        // Validate all deletions first
        const invalidDeletions = [];
        for (const id of selectedIds) {
            const validation = await validateDeletion(parseInt(id));
            if (!validation.valid) {
                invalidDeletions.push({ id, message: validation.message });
            }
        }
        
        if (invalidDeletions.length > 0) {
            const messages = invalidDeletions.map(d => `ID ${d.id}: ${d.message}`).join('\n');
            alert(`Cannot delete some ${entityNamePlural}:\n${messages}`);
            return;
        }
        
        if (!confirm(`Delete ${selectedIds.length} selected ${entityNamePlural}?`)) {
            return;
        }
        
        await saveState(`Batch delete ${selectedIds.length} ${entityNamePlural}`);
        
        for (const id of selectedIds) {
            await deleteFunc(parseInt(id));
        }
        
        scheduleAutoBackup();
        renderFunc();
        showSuccess(`Deleted ${selectedIds.length} ${entityNamePlural}`);
    };
}

/**
 * Creates a batch delete handler with cascade deletion
 * Used for parent entities like People and Projects that have child records
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.getChildRecords - Async function to get all child records () => Promise<Array>
 * @param {Function} options.filterChildRecords - Function to filter child records for a parent (childRecords, parentId) => Array
 * @param {Function} options.deleteChildRecord - Async function to delete a child record (childId) => Promise<void>
 * @param {Function} options.deleteParent - Async function to delete the parent (id) => Promise<void>
 * @param {Function} options.renderParent - Function to re-render the parent view
 * @param {Function} options.renderChild - Function to re-render the child view
 * @param {string} options.parentName - Name of parent entity for messages (e.g., "person", "project")
 * @param {string} options.parentNamePlural - Plural name of parent entity (e.g., "people", "projects")
 * @param {string} options.childNamePlural - Plural name of child entity (e.g., "FTE values", "budget values")
 * @returns {Function} Batch delete handler function
 */
export function createCascadeBatchDeleteHandler({
    getChildRecords,
    filterChildRecords,
    deleteChildRecord,
    deleteParent,
    renderParent,
    renderChild,
    parentName,
    parentNamePlural,
    childNamePlural
}) {
    return async (selectedIds) => {
        if (!confirm(`Delete ${selectedIds.length} selected ${parentNamePlural}? This will also delete their ${childNamePlural}.`)) {
            return;
        }
        
        await saveState(`Batch delete ${selectedIds.length} ${parentNamePlural}`);
        
        for (const id of selectedIds) {
            // Delete child records first
            const childRecords = await getChildRecords();
            const parentChildRecords = filterChildRecords(childRecords, id);
            for (const childRecord of parentChildRecords) {
                await deleteChildRecord(childRecord.id);
            }
            // Then delete the parent
            await deleteParent(id);
        }
        
        scheduleAutoBackup();
        renderParent();
        renderChild();
        showSuccess(`Deleted ${selectedIds.length} ${parentNamePlural}`);
    };
}
