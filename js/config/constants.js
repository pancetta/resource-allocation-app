/**
 * Application-wide constants
 * Centralizes magic numbers and strings used throughout the application
 */

// Date and time constants
export const DATE_FORMAT = 'YYYY-MM';
export const MIGRATION_DEFAULT_START_MONTH = '2020-01';
export const MONTHS_PER_YEAR = 12;

// Numeric constraints
export const MIN_FTE = 0;
export const MAX_FTE = 1;
export const MIN_ALLOCATION_PCT = 0;
export const MAX_ALLOCATION_PCT = 100;
export const MIN_PLANNED_PM = 0;

// Display formatting
export const DECIMAL_PLACES = 2;

/**
 * Format a number for display with standard decimal places
 * @param {number} value - The number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(value) {
    return value.toFixed(DECIMAL_PLACES);
}

/**
 * Format a number for display, handling null/undefined
 * @param {number|null|undefined} value - The number to format
 * @param {string} defaultValue - Value to return if input is null/undefined
 * @returns {string} Formatted number string or default
 */
export function formatNumberSafe(value, defaultValue = '0.00') {
    if (value === null || value === undefined) {
        return defaultValue;
    }
    return formatNumber(value);
}
