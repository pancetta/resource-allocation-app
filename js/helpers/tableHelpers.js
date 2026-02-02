/**
 * Table Enhancement Utilities
 * 
 * Provides sorting and filtering functionality for tables
 */

/**
 * Make a table sortable
 * @param {HTMLTableElement} table - The table element
 * @param {Array<number>} sortableColumns - Indices of columns that should be sortable
 */
export function makeTableSortable(table, sortableColumns = []) {
    if (!table) return;
    
    const thead = table.querySelector('thead');
    if (!thead) return;
    
    const headers = thead.querySelectorAll('th');
    const tbody = table.querySelector('tbody');
    
    headers.forEach((header, index) => {
        // Skip if not in sortable columns (empty array = all sortable)
        if (sortableColumns.length > 0 && !sortableColumns.includes(index)) {
            return;
        }
        
        header.classList.add('sortable');
        header.style.cursor = 'pointer';
        
        header.addEventListener('click', () => {
            sortTable(table, index, header);
        });
    });
}

/**
 * Sort table by column
 * @param {HTMLTableElement} table - The table element
 * @param {number} columnIndex - Column index to sort by
 * @param {HTMLElement} header - Header element clicked
 */
function sortTable(table, columnIndex, header) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Determine sort direction
    let ascending = true;
    if (header.classList.contains('sort-asc')) {
        ascending = false;
    }
    
    // Remove sort classes from all headers
    table.querySelectorAll('th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Add appropriate class
    header.classList.add(ascending ? 'sort-asc' : 'sort-desc');
    
    // Sort rows
    rows.sort((a, b) => {
        const aCell = a.cells[columnIndex];
        const bCell = b.cells[columnIndex];
        
        if (!aCell || !bCell) return 0;
        
        let aValue = getCellValue(aCell);
        let bValue = getCellValue(bCell);
        
        // Try to parse as number
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return ascending ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
        
        if (aValue < bValue) return ascending ? -1 : 1;
        if (aValue > bValue) return ascending ? 1 : -1;
        return 0;
    });
    
    // Re-append rows in sorted order
    rows.forEach(row => tbody.appendChild(row));
}

/**
 * Get value from cell (handles input elements)
 */
function getCellValue(cell) {
    // Check for input elements
    const input = cell.querySelector('input[type="text"], input[type="number"]');
    if (input) return input.value;
    
    const select = cell.querySelector('select');
    if (select) return select.options[select.selectedIndex]?.text || '';
    
    const checkbox = cell.querySelector('input[type="checkbox"]');
    if (checkbox) return checkbox.checked ? '1' : '0';
    
    // Get text content
    return cell.textContent.trim();
}

/**
 * Add search/filter to table
 * @param {HTMLTableElement} table - The table element
 * @param {HTMLInputElement} searchInput - The search input element
 */
export function addTableFilter(table, searchInput) {
    if (!table || !searchInput) return;
    
    searchInput.addEventListener('input', () => {
        filterTable(table, searchInput.value);
    });
}

/**
 * Filter table rows by search term
 * @param {HTMLTableElement} table - The table element
 * @param {string} searchTerm - The search term
 */
function filterTable(table, searchTerm) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    const term = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        // Skip quick-add row
        if (row.classList.contains('quick-add-row')) {
            return;
        }
        
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

/**
 * Add batch selection to table
 * @param {HTMLTableElement} table - The table element
 * @param {Function} onSelectionChange - Callback when selection changes
 */
export function addBatchSelection(table, onSelectionChange) {
    if (!table) return;
    
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    
    if (!thead || !tbody) return;
    
    // Check if checkbox column already exists (to avoid duplicate additions)
    if (thead.querySelector('.select-all-checkbox')) {
        return; // Already initialized
    }
    
    // Add checkbox column header
    const selectAllTh = document.createElement('th');
    selectAllTh.innerHTML = '<input type="checkbox" class="select-all-checkbox">';
    thead.insertBefore(selectAllTh, thead.firstChild);
    
    // Add select all functionality
    const selectAllCheckbox = selectAllTh.querySelector('.select-all-checkbox');
    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = tbody.querySelectorAll('.row-select-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = selectAllCheckbox.checked;
        });
        updateSelection();
    });
    
    // Add checkboxes to each row
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const selectTd = document.createElement('td');
        selectTd.innerHTML = '<input type="checkbox" class="row-select-checkbox">';
        row.insertBefore(selectTd, row.firstChild);
        
        const checkbox = selectTd.querySelector('.row-select-checkbox');
        checkbox.addEventListener('change', updateSelection);
    });
    
    function updateSelection() {
        const checkboxes = Array.from(tbody.querySelectorAll('.row-select-checkbox'));
        const selected = checkboxes.filter(cb => cb.checked);
        
        if (onSelectionChange) {
            onSelectionChange(selected.length, checkboxes.length);
        }
    }
}

/**
 * Get selected row IDs from table
 * @param {HTMLTableElement} table - The table element
 * @returns {Array<string>} Array of selected row IDs
 */
export function getSelectedRows(table) {
    if (!table) return [];
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return [];
    
    const selected = [];
    const checkboxes = tbody.querySelectorAll('.row-select-checkbox:checked');
    
    checkboxes.forEach(checkbox => {
        const row = checkbox.closest('tr');
        // Look for data-id attribute in the row or its cells
        const deleteBtn = row.querySelector('[data-id]');
        if (deleteBtn) {
            selected.push(deleteBtn.getAttribute('data-id'));
        }
    });
    
    return selected;
}
