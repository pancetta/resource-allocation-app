/**
 * Import Preview Helper
 * 
 * Provides preview functionality before importing data
 */

import { importAllData } from '../data/database.js';

/**
 * Show import preview dialog
 * @param {Object} data - The data to be imported
 * @returns {Promise<boolean>} True if user confirms import
 */
export async function showImportPreview(data) {
    if (typeof document === 'undefined') return false;
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'import-preview-overlay';
    
    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'import-preview-modal';
    
    // Parse and analyze the data
    const stats = analyzeImportData(data);
    
    modal.innerHTML = `
        <div class="import-preview-header">
            <h2>📤 Import Data Preview</h2>
            <button class="import-preview-close" title="Cancel">&times;</button>
        </div>
        <div class="import-preview-body">
            <div class="import-warning">
                ⚠️ <strong>Warning:</strong> This will replace all existing data!
            </div>
            
            <h3>Data to be Imported:</h3>
            <table class="import-stats-table">
                <tr>
                    <td><strong>People:</strong></td>
                    <td>${stats.people} person(s)</td>
                </tr>
                <tr>
                    <td><strong>Projects:</strong></td>
                    <td>${stats.projects} project(s)</td>
                </tr>
                <tr>
                    <td><strong>Allocations:</strong></td>
                    <td>${stats.allocations} allocation(s)</td>
                </tr>
                <tr>
                    <td><strong>FTE Values:</strong></td>
                    <td>${stats.fteValues} FTE value(s)</td>
                </tr>
                <tr>
                    <td><strong>Budget Values:</strong></td>
                    <td>${stats.budgetValues} budget value(s)</td>
                </tr>
                <tr>
                    <td><strong>Overrides:</strong></td>
                    <td>${stats.overrides} override(s)</td>
                </tr>
            </table>
            
            ${stats.errors.length > 0 ? `
            <div class="import-errors">
                <h3>⚠️ Validation Issues:</h3>
                <ul>
                    ${stats.errors.map(err => `<li>${err}</li>`).join('')}
                </ul>
            </div>
            ` : '<div class="import-success">✅ Data structure looks valid</div>'}
            
            ${stats.warnings.length > 0 ? `
            <div class="import-warnings">
                <h3>⚠️ Warnings:</h3>
                <ul>
                    ${stats.warnings.map(warn => `<li>${warn}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
        <div class="import-preview-footer">
            <button class="import-preview-cancel">Cancel</button>
            <button class="import-preview-confirm" ${stats.errors.length > 0 ? 'disabled' : ''}>
                ${stats.errors.length > 0 ? 'Cannot Import (Errors Found)' : 'Import Data'}
            </button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Return a promise that resolves when user makes a choice
    return new Promise((resolve) => {
        const closeBtn = modal.querySelector('.import-preview-close');
        const cancelBtn = modal.querySelector('.import-preview-cancel');
        const confirmBtn = modal.querySelector('.import-preview-confirm');
        
        const cleanup = () => {
            overlay.remove();
        };
        
        const handleCancel = () => {
            cleanup();
            resolve(false);
        };
        
        const handleConfirm = async () => {
            if (stats.errors.length > 0) return; // Disabled if errors
            
            cleanup();
            resolve(true);
        };
        
        closeBtn.addEventListener('click', handleCancel);
        cancelBtn.addEventListener('click', handleCancel);
        confirmBtn.addEventListener('click', handleConfirm);
        
        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}

/**
 * Analyze import data and return statistics
 * @param {Object} data - The data to analyze
 * @returns {Object} Statistics and validation results
 */
function analyzeImportData(data) {
    const stats = {
        people: 0,
        projects: 0,
        allocations: 0,
        fteValues: 0,
        budgetValues: 0,
        overrides: 0,
        errors: [],
        warnings: []
    };
    
    try {
        // Check data structure
        if (!data || typeof data !== 'object') {
            stats.errors.push('Invalid data format');
            return stats;
        }
        
        // Count items
        if (data.people && Array.isArray(data.people)) {
            stats.people = data.people.length;
        } else {
            stats.warnings.push('No people data found');
        }
        
        if (data.projects && Array.isArray(data.projects)) {
            stats.projects = data.projects.length;
        } else {
            stats.warnings.push('No projects data found');
        }
        
        if (data.defaultAllocations && Array.isArray(data.defaultAllocations)) {
            stats.allocations = data.defaultAllocations.length;
        } else {
            stats.warnings.push('No allocations data found');
        }
        
        if (data.fteValues && Array.isArray(data.fteValues)) {
            stats.fteValues = data.fteValues.length;
        } else {
            stats.warnings.push('No FTE values found');
        }
        
        if (data.budgetValues && Array.isArray(data.budgetValues)) {
            stats.budgetValues = data.budgetValues.length;
        } else {
            stats.warnings.push('No budget values found');
        }
        
        if (data.allocationOverrides && Array.isArray(data.allocationOverrides)) {
            stats.overrides = data.allocationOverrides.length;
        }
        
        // Basic validation
        if (stats.people === 0 && stats.projects === 0) {
            stats.errors.push('No people or projects found in import data');
        }
        
    } catch (e) {
        stats.errors.push(`Error analyzing data: ${e.message}`);
    }
    
    return stats;
}
