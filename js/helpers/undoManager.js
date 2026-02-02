/**
 * Undo/Redo Manager
 * 
 * Maintains history of database states for undo/redo functionality
 */

import { exportData, importData } from '../data/database.js';

const MAX_HISTORY = 20;
let undoStack = [];
let redoStack = [];
let isApplyingState = false;

/**
 * Save current state to undo stack
 * @param {string} actionName - Description of the action
 */
export async function saveState(actionName) {
    if (isApplyingState) return; // Don't save during undo/redo
    
    try {
        const state = await exportData();
        
        // Add to undo stack
        undoStack.push({
            data: state,
            action: actionName,
            timestamp: Date.now()
        });
        
        // Limit stack size
        if (undoStack.length > MAX_HISTORY) {
            undoStack.shift();
        }
        
        // Clear redo stack on new action
        redoStack = [];
        
        // Update UI buttons
        updateUndoRedoButtons();
    } catch (error) {
        console.error('Failed to save state:', error);
    }
}

/**
 * Undo last action
 */
export async function undo() {
    if (undoStack.length === 0) return false;
    
    try {
        isApplyingState = true;
        
        // Save current state to redo stack first
        const currentState = await exportData();
        const lastAction = undoStack.pop();
        
        redoStack.push({
            data: currentState,
            action: lastAction.action,
            timestamp: Date.now()
        });
        
        // Apply previous state
        await importData(lastAction.data, false); // false = don't reload page
        
        updateUndoRedoButtons();
        return true;
    } catch (error) {
        console.error('Undo failed:', error);
        return false;
    } finally {
        isApplyingState = false;
    }
}

/**
 * Redo last undone action
 */
export async function redo() {
    if (redoStack.length === 0) return false;
    
    try {
        isApplyingState = true;
        
        // Save current state to undo stack
        const currentState = await exportData();
        const nextAction = redoStack.pop();
        
        undoStack.push({
            data: currentState,
            action: nextAction.action,
            timestamp: Date.now()
        });
        
        // Apply next state
        await importData(nextAction.data, false); // false = don't reload page
        
        updateUndoRedoButtons();
        return true;
    } catch (error) {
        console.error('Redo failed:', error);
        return false;
    } finally {
        isApplyingState = false;
    }
}

/**
 * Check if undo is available
 */
export function canUndo() {
    return undoStack.length > 0;
}

/**
 * Check if redo is available
 */
export function canRedo() {
    return redoStack.length > 0;
}

/**
 * Get last action name
 */
export function getLastAction() {
    if (undoStack.length === 0) return null;
    return undoStack[undoStack.length - 1].action;
}

/**
 * Get next redo action name
 */
export function getNextRedoAction() {
    if (redoStack.length === 0) return null;
    return redoStack[redoStack.length - 1].action;
}

/**
 * Update undo/redo button states
 */
export function updateUndoRedoButtons() {
    if (typeof document === 'undefined') return;
    
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
        undoBtn.disabled = !canUndo();
        const lastAction = getLastAction();
        undoBtn.title = lastAction ? `Undo: ${lastAction}` : 'Nothing to undo';
    }
    
    if (redoBtn) {
        redoBtn.disabled = !canRedo();
        const nextAction = getNextRedoAction();
        redoBtn.title = nextAction ? `Redo: ${nextAction}` : 'Nothing to redo';
    }
}

/**
 * Initialize undo/redo keyboard shortcuts
 */
export function initUndoRedoShortcuts() {
    if (typeof document === 'undefined') return;
    
    document.addEventListener('keydown', async (e) => {
        // Ctrl/Cmd + Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            const success = await undo();
            if (success) {
                const { showSuccess } = await import('../ui/toast.js');
                showSuccess('Undo successful');
            }
        }
        
        // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
        if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
            ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
            e.preventDefault();
            const success = await redo();
            if (success) {
                const { showSuccess } = await import('../ui/toast.js');
                showSuccess('Redo successful');
            }
        }
    });
}
