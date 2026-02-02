/**
 * UI Enhancements Initialization
 * 
 * Initializes various UI improvements like help panel, undo/redo buttons, etc.
 */

import { undo, redo, updateUndoRedoButtons } from '../helpers/undoManager.js';
import { showSuccess, showError } from './toast.js';

/**
 * Initialize undo/redo buttons
 */
export function initUndoRedoButtons() {
    if (typeof document === 'undefined') return;
    
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
        undoBtn.addEventListener('click', async () => {
            const success = await undo();
            if (success) {
                showSuccess('Undo successful');
            } else {
                showError('Nothing to undo');
            }
        });
    }
    
    if (redoBtn) {
        redoBtn.addEventListener('click', async () => {
            const success = await redo();
            if (success) {
                showSuccess('Redo successful');
            } else {
                showError('Nothing to redo');
            }
        });
    }
    
    // Initial button state update
    updateUndoRedoButtons();
}

/**
 * Initialize help panel
 */
export function initHelpPanel() {
    if (typeof document === 'undefined') return;
    
    const helpBtn = document.getElementById('helpBtn');
    const helpPanel = document.getElementById('helpPanel');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    
    if (helpBtn && helpPanel) {
        helpBtn.addEventListener('click', () => {
            helpPanel.classList.add('open');
        });
    }
    
    if (closeHelpBtn && helpPanel) {
        closeHelpBtn.addEventListener('click', () => {
            helpPanel.classList.remove('open');
        });
    }
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && helpPanel && helpPanel.classList.contains('open')) {
            helpPanel.classList.remove('open');
        }
    });
    
    // Update help content based on active tab
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-button')) {
            updateHelpContent(e.target.dataset.tab);
        }
    });
}

/**
 * Update help panel content based on active tab
 * @param {string} tabName - Name of the active tab
 */
function updateHelpContent(tabName) {
    const helpContent = document.getElementById('helpPanelContent');
    if (!helpContent) return;
    
    const helpData = {
        people: {
            title: 'People Tab Help',
            sections: [
                {
                    heading: 'Adding People',
                    content: 'Click "Add Person" to add a new team member. Fill in their name and details.'
                },
                {
                    heading: 'FTE (Full-Time Equivalent)',
                    content: 'FTE represents work capacity: 1.0 = full-time, 0.5 = half-time, 0.0 = on leave. You can set different FTE values for different time periods.'
                },
                {
                    heading: 'Active Status',
                    content: 'Uncheck "Active" to hide people from allocations (e.g., former employees) without deleting them.'
                }
            ]
        },
        projects: {
            title: 'Projects Tab Help',
            sections: [
                {
                    heading: 'Adding Projects',
                    content: 'Click "Add Project" to create a new project.'
                },
                {
                    heading: 'Budget Values',
                    content: 'Set planned person-months (PM) for different time periods. This helps track if projects are over or under allocated.'
                }
            ]
        },
        allocations: {
            title: 'Allocations Tab Help',
            sections: [
                {
                    heading: 'Creating Allocations',
                    content: 'Assign people to projects with specific PM (person-months) per month. Example: 0.5 PM = half a person\'s time.'
                },
                {
                    heading: 'Date Ranges',
                    content: 'Set start and end months. Leave end month empty for ongoing allocations.'
                },
                {
                    heading: 'Overrides',
                    content: 'Create month-specific exceptions for special cases (e.g., vacation, partial month).'
                }
            ]
        },
        results: {
            title: 'Results Tab Help',
            sections: [
                {
                    heading: 'Monthly Report',
                    content: 'View person and project allocations for a specific month. Green = matches budget, Yellow = slight mismatch, Red = significant mismatch.'
                },
                {
                    heading: 'Yearly Overview',
                    content: 'See allocation trends across an entire year month-by-month.'
                },
                {
                    heading: 'Project × Month',
                    content: 'View all projects across months in a grid format.'
                }
            ]
        },
        data: {
            title: 'Data Management Help',
            sections: [
                {
                    heading: 'Export Data',
                    content: 'Download all your data as a JSON file. Do this regularly to prevent data loss!'
                },
                {
                    heading: 'Import Data',
                    content: 'Restore data from a previously exported JSON file. This replaces ALL current data.'
                },
                {
                    heading: 'Automatic Backups',
                    content: 'Backups are saved in browser storage. Use "Download Latest Auto-Backup" for instant access to your latest changes.'
                }
            ]
        }
    };
    
    const data = helpData[tabName];
    if (!data) return;
    
    let html = `<div class="help-section"><h3>${data.title}</h3></div>`;
    data.sections.forEach(section => {
        html += `
            <div class="help-section">
                <h3>${section.heading}</h3>
                <p>${section.content}</p>
            </div>
        `;
    });
    
    // Add common sections
    html += `
        <div class="help-section">
            <h3>Keyboard Shortcuts</h3>
            <p><kbd>Ctrl/Cmd + Z</kbd> - Undo last change</p>
            <p><kbd>Ctrl/Cmd + Shift + Z</kbd> or <kbd>Ctrl/Cmd + Y</kbd> - Redo</p>
        </div>
        
        <div class="help-section">
            <h3>General Tips</h3>
            <p>• Click column headers to sort tables</p>
            <p>• Use search boxes to quickly find items</p>
            <p>• Hover over ℹ️ icons for field-specific help</p>
            <p>• Export data regularly to prevent loss</p>
        </div>
    `;
    
    helpContent.innerHTML = html;
}

/**
 * Initialize auto-save indicator
 */
export function initAutoSaveIndicator() {
    if (typeof document === 'undefined') return;
    
    const indicator = document.getElementById('autoSaveIndicator');
    if (!indicator) return;
    
    // Show indicator
    indicator.style.display = 'flex';
    
    // Listen for data changes
    let saveTimeout;
    document.addEventListener('dataChanged', () => {
        // Clear existing timeout
        if (saveTimeout) clearTimeout(saveTimeout);
        
        // Show saving status
        indicator.classList.remove('saved');
        indicator.classList.add('saving');
        indicator.querySelector('#autoSaveText').textContent = 'Saving...';
        
        // After a delay, show saved status
        saveTimeout = setTimeout(() => {
            indicator.classList.remove('saving');
            indicator.classList.add('saved');
            indicator.querySelector('#autoSaveText').textContent = 'All changes saved';
        }, 1000);
    });
}

/**
 * Initialize all UI enhancements
 */
export function initUIEnhancements() {
    initUndoRedoButtons();
    initHelpPanel();
    initAutoSaveIndicator();
}
