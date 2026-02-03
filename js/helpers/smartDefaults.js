/**
 * Smart Defaults Helper
 * 
 * Provides smart default values for form inputs
 */

/**
 * Get current month in YYYY-MM format
 * @returns {string} Current month
 */
export function getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Get next month in YYYY-MM format
 * @returns {string} Next month
 */
export function getNextMonth() {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Get current year
 * @returns {number} Current year
 */
export function getCurrentYear() {
    return new Date().getFullYear();
}

/**
 * Initialize smart defaults for all form inputs
 */
export function initSmartDefaults() {
    if (typeof document === 'undefined') return;
    
    // Set current month for start month inputs
    const startMonthInputs = [
        'fteStartMonthInput',
        'budgetStartMonthInput',
        'startMonthInput',
        'overrideMonthInput'
    ];
    
    const currentMonth = getCurrentMonth();
    startMonthInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input && !input.value) {
            input.value = currentMonth;
        }
    });
    
    // Set current year for year inputs
    const yearInputs = [
        'yearInput',
        'overviewYearInput',
        'timelineYearInput'
    ];
    
    const currentYear = getCurrentYear();
    yearInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input && !input.value) {
            input.value = currentYear;
        }
    });
    
    // Set month input for monthly report to current month
    const monthInput = document.getElementById('monthInput');
    if (monthInput && !monthInput.value) {
        monthInput.value = currentMonth;
    }
    
    // Remember last used values in localStorage
    setupValueMemory();
}

/**
 * Setup value memory for frequently used inputs
 */
function setupValueMemory() {
    const inputsToRemember = [
        { id: 'fteValueInput', key: 'lastFTE', default: 1.0 },
        { id: 'budgetValueInput', key: 'lastBudget', default: 5 },
        { id: 'pmInput', key: 'lastPM', default: 1 }
    ];
    
    inputsToRemember.forEach(({ id, key, default: defaultValue }) => {
        const input = document.getElementById(id);
        if (!input) return;
        
        // Load saved value
        const saved = localStorage.getItem(key);
        if (saved) {
            input.value = saved;
        }
        
        // Save value on change
        input.addEventListener('change', () => {
            localStorage.setItem(key, input.value);
        });
    });
}

/**
 * Auto-fill date when adding new items
 * @param {string} inputId - ID of the month input
 */
export function autoFillDate(inputId) {
    if (typeof document === 'undefined') return;
    
    const input = document.getElementById(inputId);
    if (input && !input.value) {
        input.value = getCurrentMonth();
    }
}
