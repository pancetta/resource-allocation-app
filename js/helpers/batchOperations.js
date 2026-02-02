/**
 * Batch Operations Helper
 * 
 * Provides UI for batch operations on table rows
 */

import { getSelectedRows } from './tableHelpers.js';

/**
 * Add batch operations toolbar to a table
 * @param {HTMLTableElement} table - The table element
 * @param {Object} operations - Object with operation name as key and handler function as value
 * @returns {HTMLElement} The toolbar element
 */
export function addBatchOperationsToolbar(table, operations) {
    if (!table) return null;
    
    // Check if toolbar already exists
    let toolbar = table.previousElementSibling;
    if (toolbar && toolbar.classList.contains('batch-toolbar')) {
        return toolbar;
    }
    
    // Create toolbar
    toolbar = document.createElement('div');
    toolbar.className = 'batch-toolbar';
    toolbar.style.display = 'none'; // Hidden by default
    
    // Add selection counter
    const counter = document.createElement('span');
    counter.className = 'batch-counter';
    counter.textContent = '0 selected';
    toolbar.appendChild(counter);
    
    // Add operation buttons
    Object.entries(operations).forEach(([name, handler]) => {
        const button = document.createElement('button');
        button.className = 'batch-action-btn';
        button.textContent = name;
        button.addEventListener('click', async () => {
            const selectedIds = getSelectedRows(table);
            if (selectedIds.length > 0) {
                await handler(selectedIds);
            }
        });
        toolbar.appendChild(button);
    });
    
    // Insert toolbar before table
    table.parentNode.insertBefore(toolbar, table);
    
    return toolbar;
}

/**
 * Update batch toolbar visibility and counter
 * @param {HTMLElement} toolbar - The toolbar element
 * @param {number} selectedCount - Number of selected items
 * @param {number} totalCount - Total number of items
 */
export function updateBatchToolbar(toolbar, selectedCount, totalCount) {
    if (!toolbar) return;
    
    const counter = toolbar.querySelector('.batch-counter');
    if (counter) {
        counter.textContent = `${selectedCount} of ${totalCount} selected`;
    }
    
    // Show/hide toolbar based on selection
    if (selectedCount > 0) {
        toolbar.style.display = 'flex';
    } else {
        toolbar.style.display = 'none';
    }
}

/**
 * Remove batch toolbar from table
 * @param {HTMLTableElement} table - The table element
 */
export function removeBatchToolbar(table) {
    if (!table) return;
    
    const toolbar = table.previousElementSibling;
    if (toolbar && toolbar.classList.contains('batch-toolbar')) {
        toolbar.remove();
    }
}
