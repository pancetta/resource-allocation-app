/**
 * Quick Add Row Helper
 * 
 * Provides functionality to add a quick-add row to tables
 * for inline adding of new items
 */

/**
 * Add a quick-add row to a table
 * @param {HTMLTableElement} table - The table element
 * @param {Array<string>} placeholders - Placeholder text for each column
 * @param {Function} onAdd - Callback when add is triggered (receives values array)
 * @param {Function} onCancel - Optional callback when cancelled
 */
export function addQuickAddRow(table, placeholders, onAdd, onCancel) {
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    // Remove existing quick-add row if present
    const existing = tbody.querySelector('.quick-add-row');
    if (existing) {
        existing.remove();
    }
    
    // Create quick-add row
    const tr = document.createElement('tr');
    tr.className = 'quick-add-row';
    
    // Count total columns from table header
    const thead = table.querySelector('thead');
    const headerRow = thead ? thead.querySelector('tr') : null;
    const totalColumns = headerRow ? headerRow.querySelectorAll('th').length : placeholders.length + 1;
    
    // Create input cells
    const cells = placeholders.map((placeholder, index) => {
        return `<td><input type="text" class="quick-add-input" data-index="${index}" placeholder="${placeholder}"></td>`;
    }).join('');
    
    // Calculate number of empty cells needed to fill the gap
    // We have: placeholders.length input cells + 1 action cell
    // We need: totalColumns cells
    const emptyCellsNeeded = totalColumns - placeholders.length - 1;
    const emptyCells = emptyCellsNeeded > 0 ? '<td></td>'.repeat(emptyCellsNeeded) : '';
    
    // Add action buttons
    tr.innerHTML = `
        ${cells}
        ${emptyCells}
        <td class="quick-add-actions">
            <button class="quick-add-save" title="Save (Enter)">✓</button>
            <button class="quick-add-cancel" title="Cancel (Esc)">✗</button>
        </td>
    `;
    
    // Add to table (at the top)
    tbody.insertBefore(tr, tbody.firstChild);
    
    // Get all inputs
    const inputs = tr.querySelectorAll('.quick-add-input');
    const saveBtn = tr.querySelector('.quick-add-save');
    const cancelBtn = tr.querySelector('.quick-add-cancel');
    
    // Focus first input
    if (inputs.length > 0) {
        inputs[0].focus();
    }
    
    // Handle save
    const handleSave = () => {
        const values = Array.from(inputs).map(input => input.value.trim());
        
        // Check if at least one value is filled
        if (values.every(v => !v)) {
            // All empty, just cancel
            handleCancel();
            return;
        }
        
        // Call the callback with values
        if (onAdd) {
            onAdd(values);
        }
        
        // Remove the quick-add row
        tr.remove();
    };
    
    // Handle cancel
    const handleCancel = () => {
        tr.remove();
        if (onCancel) {
            onCancel();
        }
    };
    
    // Button click handlers
    saveBtn.addEventListener('click', handleSave);
    cancelBtn.addEventListener('click', handleCancel);
    
    // Keyboard navigation
    inputs.forEach((input, index) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // If last input, save; otherwise move to next
                if (index === inputs.length - 1) {
                    handleSave();
                } else {
                    inputs[index + 1].focus();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            } else if (e.key === 'Tab' && index === inputs.length - 1 && !e.shiftKey) {
                // On last input, Tab triggers save
                e.preventDefault();
                handleSave();
            }
        });
    });
    
    return tr;
}

/**
 * Check if a table has an active quick-add row
 * @param {HTMLTableElement} table - The table element
 * @returns {boolean}
 */
export function hasQuickAddRow(table) {
    if (!table) return false;
    const tbody = table.querySelector('tbody');
    if (!tbody) return false;
    return tbody.querySelector('.quick-add-row') !== null;
}

/**
 * Remove quick-add row from table
 * @param {HTMLTableElement} table - The table element
 */
export function removeQuickAddRow(table) {
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    const quickAddRow = tbody.querySelector('.quick-add-row');
    if (quickAddRow) {
        quickAddRow.remove();
    }
}
