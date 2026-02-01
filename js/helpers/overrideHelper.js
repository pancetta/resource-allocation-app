/**
 * Value Helper - Centralized logic for handling time-based FTE and Budget values
 * Eliminates duplication in report calculations
 */

import { isMonthInRange, compareMonths } from './dateHelper.js';

/**
 * Get the effective FTE for a person in a given month
 * @param {string} personId - The person's ID
 * @param {string} month - Month in YYYY-MM format
 * @param {Array} fteValues - Array of FTE value objects
 * @returns {number} Effective FTE for the month
 */
export function getEffectiveFte(personId, month, fteValues) {
    const applicableValues = fteValues.filter(value =>
        value.personId === personId &&
        isMonthInRange(month, value.startMonth, value.endMonth)
    );
    
    if (applicableValues.length === 0) {
        return 1; // Default FTE if no value found
    }
    
    // Use the most recent value (latest startMonth)
    const sortedValues = applicableValues.sort((a, b) =>
        compareMonths(b.startMonth, a.startMonth)
    );
    return sortedValues[0].fte;
}

/**
 * Get the effective planned PM for a project in a given month
 * @param {string} projectId - The project's ID
 * @param {string} month - Month in YYYY-MM format
 * @param {Array} budgetValues - Array of budget value objects
 * @returns {number} Effective planned PM for the month
 */
export function getEffectiveProjectBudget(projectId, month, budgetValues) {
    const applicableValues = budgetValues.filter(value =>
        value.projectId === projectId &&
        isMonthInRange(month, value.startMonth, value.endMonth)
    );
    
    if (applicableValues.length === 0) {
        return 0; // Default planned PM if no value found
    }
    
    // Use the most recent value (latest startMonth)
    const sortedValues = applicableValues.sort((a, b) =>
        compareMonths(b.startMonth, a.startMonth)
    );
    return sortedValues[0].plannedPM;
}

/**
 * Calculate total effective FTE for a person across multiple months
 * @param {string} personId - The person's ID
 * @param {Array} months - Array of month strings in YYYY-MM format
 * @param {Array} fteValues - Array of FTE value objects
 * @returns {number} Sum of effective FTE across all months
 */
export function getTotalEffectiveFte(personId, months, fteValues) {
    return months.reduce((sum, month) => {
        const monthFte = getEffectiveFte(personId, month, fteValues);
        return sum + monthFte;
    }, 0);
}

/**
 * Calculate total effective planned PM for a project across multiple months
 * @param {string} projectId - The project's ID
 * @param {Array} months - Array of month strings in YYYY-MM format
 * @param {Array} budgetValues - Array of budget value objects
 * @returns {number} Sum of effective planned PM across all months
 */
export function getTotalEffectiveProjectBudget(projectId, months, budgetValues) {
    return months.reduce((sum, month) => {
        const monthPlanned = getEffectiveProjectBudget(projectId, month, budgetValues);
        return sum + monthPlanned;
    }, 0);
}
