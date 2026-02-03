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
                    content: 'FTE represents work capacity: 1.0 = full-time, 0.5 = half-time, 0.0 = on leave. You can set different FTE values for different time periods.<br><br><strong>Key concept:</strong> For a single month, 1.0 FTE = 1 PM of available capacity. See the Glossary for more details.'
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
                    heading: 'Budget Values (Planned PM)',
                    content: 'Set planned person-months (PM) for different time periods. This helps track if projects are over or under allocated.<br><br><strong>Example:</strong> A project with 5 PM planned per month means it expects 5 person-months of effort each month.'
                }
            ]
        },
        allocations: {
            title: 'Allocations Tab Help',
            sections: [
                {
                    heading: 'Creating Allocations',
                    content: 'Assign people to projects with specific PM (person-months) per month.<br><br><strong>Example:</strong> 0.5 PM = half a person\'s working time for that month.<br><br><strong>Note:</strong> PM is the source of truth. Percentages in reports are calculated as (PM / FTE) × 100.'
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
                    content: 'View person and project allocations for a specific month. Green = matches budget, Yellow = slight mismatch, Red = significant mismatch.<br><br><strong>Understanding the columns:</strong><ul style="margin-top: 8px;"><li><strong>FTE:</strong> Person\'s capacity for that month</li><li><strong>PM:</strong> Actual allocated work (source of truth)</li><li><strong>%:</strong> Utilization (calculated as PM/FTE × 100)</li><li><strong>Delta:</strong> Over/under allocation (PM - FTE)</li></ul>'
                },
                {
                    heading: 'Yearly Overview',
                    content: 'See allocation trends across an entire year month-by-month. Values shown are in PM (person-months).<br><br><strong>Person table:</strong> Shows PM allocated per month, compared to FTE capacity.<br><br><strong>Project table:</strong> Shows PM allocated per month, compared to planned PM budget.'
                },
                {
                    heading: 'Project × Month',
                    content: 'View all projects across months in a grid format showing PM allocations.'
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
        <div class="help-section glossary-section">
            <h3>📖 Glossary: FTE, PM, and %</h3>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 10px;">
                <p style="margin-top: 0;"><strong>Understanding the three units in this app:</strong></p>
                
                <div style="margin: 12px 0; padding: 10px; background: white; border-left: 4px solid #007bff;">
                    <strong>FTE (Full-Time Equivalent)</strong> — Capacity
                    <ul style="margin: 5px 0 0 20px;">
                        <li><strong>What:</strong> A person's work capacity/availability</li>
                        <li><strong>Range:</strong> 0.0 to 1.0 (1.0 = full-time, 0.5 = half-time)</li>
                        <li><strong>For a month:</strong> 1.0 FTE = 1 PM of capacity</li>
                        <li><strong>Example:</strong> Someone working part-time has 0.5 FTE</li>
                    </ul>
                </div>
                
                <div style="margin: 12px 0; padding: 10px; background: white; border-left: 4px solid #28a745;">
                    <strong>PM (Person-Months)</strong> — Allocation (Source of Truth)
                    <ul style="margin: 5px 0 0 20px;">
                        <li><strong>What:</strong> Amount of work allocated to a project</li>
                        <li><strong>Unit:</strong> Person-months (time-based effort)</li>
                        <li><strong>Source of truth:</strong> This is the primary value stored</li>
                        <li><strong>Example:</strong> 0.5 PM = half a person's month of work</li>
                    </ul>
                </div>
                
                <div style="margin: 12px 0; padding: 10px; background: white; border-left: 4px solid #ffc107;">
                    <strong>% (Percentage)</strong> — Utilization (Calculated)
                    <ul style="margin: 5px 0 0 20px;">
                        <li><strong>What:</strong> How much of a person's capacity is used</li>
                        <li><strong>Formula:</strong> % = (PM / FTE) × 100</li>
                        <li><strong>Derived:</strong> Always calculated from PM and FTE</li>
                        <li><strong>Example:</strong> 0.5 PM on 1.0 FTE = 50% utilization</li>
                        <li><strong>Example:</strong> 0.5 PM on 0.5 FTE = 100% utilization</li>
                    </ul>
                </div>
                
                <div style="margin-top: 15px; padding: 10px; background: #e7f3ff; border-radius: 4px;">
                    <strong>💡 Key Insight:</strong> PM is the single source of truth. FTE defines capacity, and % shows utilization. For a single month: <code>1.0 FTE = 1 PM of capacity</code>
                </div>
            </div>
        </div>
        
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
