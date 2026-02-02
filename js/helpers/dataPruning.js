/**
 * Data Pruning Helper
 * 
 * Provides functionality to prune old/inactive data
 */

import { getPeople, getProjects, getFteValues, getBudgetValues, getAllocations, deletePerson, deleteProject, deleteFteValue, deleteBudgetValue, deleteAllocation } from '../data/database.js';
import { saveState } from './undoManager.js';
import { showSuccess } from '../ui/toast.js';

/**
 * Show data pruning dialog
 * @returns {Promise<void>}
 */
export async function showDataPruningDialog() {
    if (typeof document === 'undefined') return;
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'import-preview-overlay'; // Reuse import preview styles
    
    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'import-preview-modal';
    
    modal.innerHTML = `
        <div class="import-preview-header">
            <h2>🗑️ Data Pruning Tool</h2>
            <button class="import-preview-close" title="Close">&times;</button>
        </div>
        <div class="import-preview-body">
            <div class="import-warning">
                ⚠️ <strong>Warning:</strong> This will permanently delete data. Use undo if needed.
            </div>
            
            <h3>Prune Options:</h3>
            
            <div class="prune-option">
                <input type="checkbox" id="pruneInactivePeople" checked>
                <label for="pruneInactivePeople">
                    <strong>Delete Inactive People</strong>
                    <span id="inactivePeopleCount" class="prune-count">Checking...</span>
                </label>
                <p class="prune-description">Remove people marked as inactive and all their FTE values.</p>
            </div>
            
            <div class="prune-option">
                <label for="pruneOldDataBefore"><strong>Delete Old FTE/Budget Values Before:</strong></label>
                <input type="month" id="pruneOldDataBefore">
                <span id="oldDataCount" class="prune-count">Select date to see count</span>
                <p class="prune-description">Remove FTE and budget values that end before this date.</p>
            </div>
            
            <div class="prune-option">
                <label for="pruneOldAllocationsBefore"><strong>Delete Old Allocations Before:</strong></label>
                <input type="month" id="pruneOldAllocationsBefore">
                <span id="oldAllocationsCount" class="prune-count">Select date to see count</span>
                <p class="prune-description">Remove allocations that end before this date.</p>
            </div>
            
            <div id="prunePreview" style="display: none; margin-top: 20px;">
                <h3>Preview of Items to be Deleted:</h3>
                <div id="prunePreviewContent"></div>
            </div>
        </div>
        <div class="import-preview-footer">
            <button class="import-preview-cancel">Cancel</button>
            <button id="previewPruneBtn" class="import-preview-confirm" style="background-color: #8CB903;">Preview</button>
            <button id="executePruneBtn" class="import-preview-confirm" style="display: none;">Execute Pruning</button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Setup event handlers
    const closeBtn = modal.querySelector('.import-preview-close');
    const cancelBtn = modal.querySelector('.import-preview-cancel');
    const previewBtn = modal.querySelector('#previewPruneBtn');
    const executeBtn = modal.querySelector('#executePruneBtn');
    const oldDataInput = modal.querySelector('#pruneOldDataBefore');
    const oldAllocationsInput = modal.querySelector('#pruneOldAllocationsBefore');
    
    // Update counts
    updateInactivePeopleCount();
    
    oldDataInput.addEventListener('change', updateOldDataCount);
    oldAllocationsInput.addEventListener('change', updateOldAllocationsCount);
    
    // Preview button
    previewBtn.addEventListener('click', async () => {
        const preview = await generatePrunePreview();
        displayPrunePreview(preview);
        previewBtn.style.display = 'none';
        executeBtn.style.display = 'inline-block';
    });
    
    // Execute button
    executeBtn.addEventListener('click', async () => {
        const pruneInactivePeople = modal.querySelector('#pruneInactivePeople').checked;
        const oldDataBefore = oldDataInput.value;
        const oldAllocationsBefore = oldAllocationsInput.value;
        
        const count = await executePruning(pruneInactivePeople, oldDataBefore, oldAllocationsBefore);
        
        overlay.remove();
        showSuccess(`Pruned ${count} items successfully`);
    });
    
    // Close handlers
    const handleClose = () => overlay.remove();
    closeBtn.addEventListener('click', handleClose);
    cancelBtn.addEventListener('click', handleClose);
    
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            handleClose();
            document.removeEventListener('keydown', escHandler);
        }
    });
    
    async function updateInactivePeopleCount() {
        const people = await getPeople();
        const inactiveCount = people.filter(p => !p.active).length;
        modal.querySelector('#inactivePeopleCount').textContent = `(${inactiveCount} people)`;
    }
    
    async function updateOldDataCount() {
        const date = oldDataInput.value;
        if (!date) return;
        
        const fteValues = await getFteValues();
        const budgetValues = await getBudgetValues();
        
        const oldFte = fteValues.filter(v => v.endMonth && v.endMonth < date).length;
        const oldBudget = budgetValues.filter(v => v.endMonth && v.endMonth < date).length;
        
        modal.querySelector('#oldDataCount').textContent = `(${oldFte} FTE + ${oldBudget} budget = ${oldFte + oldBudget} total)`;
    }
    
    async function updateOldAllocationsCount() {
        const date = oldAllocationsInput.value;
        if (!date) return;
        
        const allocations = await getAllocations();
        const oldCount = allocations.filter(a => a.endMonth && a.endMonth < date).length;
        
        modal.querySelector('#oldAllocationsCount').textContent = `(${oldCount} allocations)`;
    }
    
    async function generatePrunePreview() {
        const preview = {
            inactivePeople: [],
            oldFteValues: [],
            oldBudgetValues: [],
            oldAllocations: []
        };
        
        if (modal.querySelector('#pruneInactivePeople').checked) {
            const people = await getPeople();
            preview.inactivePeople = people.filter(p => !p.active);
        }
        
        const oldDataBefore = oldDataInput.value;
        if (oldDataBefore) {
            const fteValues = await getFteValues();
            const budgetValues = await getBudgetValues();
            const people = await getPeople();
            const projects = await getProjects();
            
            preview.oldFteValues = fteValues.filter(v => v.endMonth && v.endMonth < oldDataBefore).map(v => {
                const person = people.find(p => p.id === v.personId);
                return { ...v, personName: person?.name || v.personId };
            });
            
            preview.oldBudgetValues = budgetValues.filter(v => v.endMonth && v.endMonth < oldDataBefore).map(v => {
                const project = projects.find(p => p.id === v.projectId);
                return { ...v, projectName: project?.name || v.projectId };
            });
        }
        
        const oldAllocationsBefore = oldAllocationsInput.value;
        if (oldAllocationsBefore) {
            const allocations = await getAllocations();
            const people = await getPeople();
            const projects = await getProjects();
            
            preview.oldAllocations = allocations.filter(a => a.endMonth && a.endMonth < oldAllocationsBefore).map(a => {
                const person = people.find(p => p.id === a.personId);
                const project = projects.find(p => p.id === a.projectId);
                return { ...a, personName: person?.name || a.personId, projectName: project?.name || a.projectId };
            });
        }
        
        return preview;
    }
    
    function displayPrunePreview(preview) {
        const previewDiv = modal.querySelector('#prunePreview');
        const contentDiv = modal.querySelector('#prunePreviewContent');
        
        let html = '';
        
        if (preview.inactivePeople.length > 0) {
            html += `<h4>Inactive People (${preview.inactivePeople.length}):</h4><ul>`;
            preview.inactivePeople.forEach(p => {
                html += `<li>${p.name}</li>`;
            });
            html += `</ul>`;
        }
        
        if (preview.oldFteValues.length > 0) {
            html += `<h4>Old FTE Values (${preview.oldFteValues.length}):</h4><ul>`;
            preview.oldFteValues.slice(0, 10).forEach(v => {
                html += `<li>${v.personName}: ${v.fte} (${v.startMonth} to ${v.endMonth || 'ongoing'})</li>`;
            });
            if (preview.oldFteValues.length > 10) {
                html += `<li>... and ${preview.oldFteValues.length - 10} more</li>`;
            }
            html += `</ul>`;
        }
        
        if (preview.oldBudgetValues.length > 0) {
            html += `<h4>Old Budget Values (${preview.oldBudgetValues.length}):</h4><ul>`;
            preview.oldBudgetValues.slice(0, 10).forEach(v => {
                html += `<li>${v.projectName}: ${v.plannedPM} PM (${v.startMonth} to ${v.endMonth || 'ongoing'})</li>`;
            });
            if (preview.oldBudgetValues.length > 10) {
                html += `<li>... and ${preview.oldBudgetValues.length - 10} more</li>`;
            }
            html += `</ul>`;
        }
        
        if (preview.oldAllocations.length > 0) {
            html += `<h4>Old Allocations (${preview.oldAllocations.length}):</h4><ul>`;
            preview.oldAllocations.slice(0, 10).forEach(a => {
                html += `<li>${a.personName} → ${a.projectName}: ${a.pm} PM (${a.startMonth} to ${a.endMonth || 'ongoing'})</li>`;
            });
            if (preview.oldAllocations.length > 10) {
                html += `<li>... and ${preview.oldAllocations.length - 10} more</li>`;
            }
            html += `</ul>`;
        }
        
        if (!html) {
            html = '<p><em>No items selected for pruning</em></p>';
        }
        
        contentDiv.innerHTML = html;
        previewDiv.style.display = 'block';
    }
    
    async function executePruning(pruneInactivePeople, oldDataBefore, oldAllocationsBefore) {
        let totalDeleted = 0;
        
        await saveState('Data pruning');
        
        // Delete inactive people and their FTE values
        if (pruneInactivePeople) {
            const people = await getPeople();
            const inactivePeople = people.filter(p => !p.active);
            
            for (const person of inactivePeople) {
                // Delete FTE values
                const fteValues = await getFteValues();
                const personFte = fteValues.filter(v => v.personId === person.id);
                for (const fte of personFte) {
                    await deleteFteValue(fte.id);
                    totalDeleted++;
                }
                
                // Delete person
                await deletePerson(person.id);
                totalDeleted++;
            }
        }
        
        // Delete old FTE and budget values
        if (oldDataBefore) {
            const fteValues = await getFteValues();
            const budgetValues = await getBudgetValues();
            
            const oldFte = fteValues.filter(v => v.endMonth && v.endMonth < oldDataBefore);
            for (const fte of oldFte) {
                await deleteFteValue(fte.id);
                totalDeleted++;
            }
            
            const oldBudget = budgetValues.filter(v => v.endMonth && v.endMonth < oldDataBefore);
            for (const budget of oldBudget) {
                await deleteBudgetValue(budget.id);
                totalDeleted++;
            }
        }
        
        // Delete old allocations
        if (oldAllocationsBefore) {
            const allocations = await getAllocations();
            const oldAllocations = allocations.filter(a => a.endMonth && a.endMonth < oldAllocationsBefore);
            
            for (const allocation of oldAllocations) {
                await deleteAllocation(allocation.id);
                totalDeleted++;
            }
        }
        
        return totalDeleted;
    }
}
