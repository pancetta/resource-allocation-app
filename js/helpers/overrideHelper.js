/**
 * Override Helper - Centralized logic for handling FTE and Budget overrides
 * Eliminates duplication in report calculations
 */

import { isMonthInRange, compareMonths } from './dateHelper.js';

/**
 * Get the effective FTE for a person in a given month, considering FTE overrides
 * @param {string} personId - The person's ID
 * @param {string} month - Month in YYYY-MM format
 * @param {number} defaultFte - Default FTE value from person record
 * @param {Array} fteOverrides - Array of FTE override objects
 * @returns {number} Effective FTE for the month
 */
export function getEffectiveFte(personId, month, defaultFte, fteOverrides) {
    const applicableOverrides = fteOverrides.filter(override =>
        override.personId === personId &&
        isMonthInRange(month, override.startMonth, override.endMonth)
    );
    
    if (applicableOverrides.length === 0) {
        return defaultFte;
    }
    
    // Use the most recent override (latest startMonth)
    const sortedOverrides = applicableOverrides.sort((a, b) =>
        compareMonths(b.startMonth, a.startMonth)
    );
    return sortedOverrides[0].fte;
}

/**
 * Get the effective planned PM for a project in a given month, considering budget overrides
 * @param {string} projectId - The project's ID
 * @param {string} month - Month in YYYY-MM format
 * @param {number} defaultPlannedPM - Default planned PM from project record
 * @param {Array} projectBudgetOverrides - Array of budget override objects
 * @returns {number} Effective planned PM for the month
 */
export function getEffectiveProjectBudget(projectId, month, defaultPlannedPM, projectBudgetOverrides) {
    const applicableOverrides = projectBudgetOverrides.filter(override =>
        override.projectId === projectId &&
        isMonthInRange(month, override.startMonth, override.endMonth)
    );
    
    if (applicableOverrides.length === 0) {
        return defaultPlannedPM;
    }
    
    // Use the most recent override (latest startMonth)
    const sortedOverrides = applicableOverrides.sort((a, b) =>
        compareMonths(b.startMonth, a.startMonth)
    );
    return sortedOverrides[0].plannedPM;
}

/**
 * Calculate total effective FTE for a person across multiple months
 * @param {string} personId - The person's ID
 * @param {number} defaultFte - Default FTE value from person record
 * @param {Array} months - Array of month strings in YYYY-MM format
 * @param {Array} fteOverrides - Array of FTE override objects
 * @returns {number} Sum of effective FTE across all months
 */
export function getTotalEffectiveFte(personId, defaultFte, months, fteOverrides) {
    return months.reduce((sum, month) => {
        const monthFte = getEffectiveFte(personId, month, defaultFte, fteOverrides);
        return sum + monthFte;
    }, 0);
}

/**
 * Calculate total effective planned PM for a project across multiple months
 * @param {string} projectId - The project's ID
 * @param {number} defaultPlannedPM - Default planned PM from project record
 * @param {Array} months - Array of month strings in YYYY-MM format
 * @param {Array} projectBudgetOverrides - Array of budget override objects
 * @returns {number} Sum of effective planned PM across all months
 */
export function getTotalEffectiveProjectBudget(projectId, defaultPlannedPM, months, projectBudgetOverrides) {
    return months.reduce((sum, month) => {
        const monthPlanned = getEffectiveProjectBudget(projectId, month, defaultPlannedPM, projectBudgetOverrides);
        return sum + monthPlanned;
    }, 0);
}
