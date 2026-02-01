/**
 * Date Helper - Centralized logic for month/date handling
 * Standardizes month format (YYYY-MM) and provides utilities for date operations
 */

/**
 * Get array of months for a given year in YYYY-MM format
 * @param {number|string} year - The year (e.g., 2025)
 * @returns {Array<string>} Array of month strings ['2025-01', '2025-02', ..., '2025-12']
 */
export function getMonthsInYear(year) {
    return Array.from({ length: 12 }, (_, i) => 
        `${year}-${String(i + 1).padStart(2, '0')}`
    );
}

/**
 * Check if a month falls within a date range
 * @param {string} month - Month to check in YYYY-MM format
 * @param {string} startMonth - Start month in YYYY-MM format
 * @param {string|null} endMonth - End month in YYYY-MM format (or null for open-ended)
 * @returns {boolean} True if month is within range (inclusive)
 */
export function isMonthInRange(month, startMonth, endMonth) {
    return month >= startMonth && (!endMonth || month <= endMonth);
}

/**
 * Compare two month strings lexicographically
 * Useful for sorting months chronologically
 * @param {string} month1 - First month in YYYY-MM format
 * @param {string} month2 - Second month in YYYY-MM format
 * @returns {number} Negative if month1 < month2, positive if month1 > month2, 0 if equal
 */
export function compareMonths(month1, month2) {
    return month1.localeCompare(month2);
}

/**
 * Get the most recent month from an array of months
 * @param {Array<string>} months - Array of months in YYYY-MM format
 * @returns {string|null} The latest month, or null if array is empty
 */
export function getLatestMonth(months) {
    if (months.length === 0) return null;
    return months.reduce((latest, current) => 
        compareMonths(current, latest) > 0 ? current : latest
    );
}

/**
 * Get the earliest month from an array of months
 * @param {Array<string>} months - Array of months in YYYY-MM format
 * @returns {string|null} The earliest month, or null if array is empty
 */
export function getEarliestMonth(months) {
    if (months.length === 0) return null;
    return months.reduce((earliest, current) => 
        compareMonths(current, earliest) < 0 ? current : earliest
    );
}

/**
 * Extract year from month string
 * @param {string} month - Month in YYYY-MM format
 * @returns {string} Year portion (e.g., '2025')
 */
export function getYearFromMonth(month) {
    return month.split('-')[0];
}

/**
 * Extract month number from month string
 * @param {string} month - Month in YYYY-MM format
 * @returns {number} Month number 1-12
 */
export function getMonthNumberFromMonth(month) {
    return parseInt(month.split('-')[1], 10);
}

/**
 * Check if two months are in the same year
 * @param {string} month1 - First month in YYYY-MM format
 * @param {string} month2 - Second month in YYYY-MM format
 * @returns {boolean} True if both months are in the same year
 */
export function isSameYear(month1, month2) {
    return getYearFromMonth(month1) === getYearFromMonth(month2);
}
