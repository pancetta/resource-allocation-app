/**
 * Validation Helper - Functions to validate data integrity
 * Ensures entities have required time-based values
 */

import { getFteValues, getBudgetValues } from '../data/database.js';
import { 
    MIN_FTE, 
    MAX_FTE, 
    MIN_ALLOCATION_PCT, 
    MAX_ALLOCATION_PCT, 
    MIN_PLANNED_PM 
} from '../config/constants.js';

/**
 * Check if a person has at least one FTE value
 * @param {string} personId - The person's ID
 * @returns {Promise<boolean>} True if person has at least one FTE value
 */
export async function personHasFteValue(personId) {
    const fteValues = await getFteValues();
    return fteValues.some(v => v.personId === personId);
}

/**
 * Check if a project has at least one budget value
 * @param {string} projectId - The project's ID
 * @returns {Promise<boolean>} True if project has at least one budget value
 */
export async function projectHasBudgetValue(projectId) {
    const budgetValues = await getBudgetValues();
    return budgetValues.some(v => v.projectId === projectId);
}

/**
 * Get count of FTE values for a person
 * @param {string} personId - The person's ID
 * @returns {Promise<number>} Number of FTE values for this person
 */
export async function getFteValueCount(personId) {
    const fteValues = await getFteValues();
    return fteValues.filter(v => v.personId === personId).length;
}

/**
 * Get count of budget values for a project
 * @param {string} projectId - The project's ID
 * @returns {Promise<number>} Number of budget values for this project
 */
export async function getBudgetValueCount(projectId) {
    const budgetValues = await getBudgetValues();
    return budgetValues.filter(v => v.projectId === projectId).length;
}

/**
 * Validate FTE value is within acceptable range (0 to 1)
 * @param {number} fte - The FTE value to validate
 * @returns {{valid: boolean, message: string}} Validation result
 */
export function validateFteValue(fte) {
    const value = parseFloat(fte);
    
    if (isNaN(value)) {
        return { valid: false, message: 'FTE must be a valid number' };
    }
    
    if (value < MIN_FTE) {
        return { valid: false, message: `FTE cannot be below ${MIN_FTE}` };
    }
    
    if (value > MAX_FTE) {
        return { valid: false, message: `FTE cannot be above ${MAX_FTE}` };
    }
    
    return { valid: true, message: '' };
}

/**
 * Validate planned PM (budget) value is not negative
 * @param {number} plannedPM - The planned PM value to validate
 * @returns {{valid: boolean, message: string}} Validation result
 */
export function validatePlannedPM(plannedPM) {
    const value = parseFloat(plannedPM);
    
    if (isNaN(value)) {
        return { valid: false, message: 'Planned PM must be a valid number' };
    }
    
    if (value < MIN_PLANNED_PM) {
        return { valid: false, message: 'Planned PM cannot be negative' };
    }
    
    return { valid: true, message: '' };
}

/**
 * Validate allocation percentage is within acceptable range (0 to 100)
 * @param {number} pct - The allocation percentage to validate
 * @returns {{valid: boolean, message: string}} Validation result
 */
export function validateAllocationPercentage(pct) {
    const value = parseFloat(pct);
    
    if (isNaN(value)) {
        return { valid: false, message: 'Allocation percentage must be a valid number' };
    }
    
    if (value < MIN_ALLOCATION_PCT) {
        return { valid: false, message: 'Allocation percentage cannot be negative' };
    }
    
    if (value > MAX_ALLOCATION_PCT) {
        return { valid: false, message: `Allocation percentage cannot exceed ${MAX_ALLOCATION_PCT}` };
    }
    
    return { valid: true, message: '' };
}

/**
 * Validate that deleting an FTE value won't leave person without any values
 * @param {number} fteValueId - The FTE value ID to delete
 * @returns {Promise<{valid: boolean, message: string}>} Validation result
 */
export async function validateFteValueDeletion(fteValueId) {
    const fteValues = await getFteValues();
    const value = fteValues.find(v => v.id === fteValueId);
    
    if (!value) {
        return { valid: false, message: 'FTE value not found' };
    }
    
    const count = fteValues.filter(v => v.personId === value.personId).length;
    
    if (count <= 1) {
        return { 
            valid: false, 
            message: 'Cannot delete the last FTE value for a person. Add another FTE value first.' 
        };
    }
    
    return { valid: true, message: '' };
}

/**
 * Validate that deleting a budget value won't leave project without any values
 * @param {number} budgetValueId - The budget value ID to delete
 * @returns {Promise<{valid: boolean, message: string}>} Validation result
 */
export async function validateBudgetValueDeletion(budgetValueId) {
    const budgetValues = await getBudgetValues();
    const value = budgetValues.find(v => v.id === budgetValueId);
    
    if (!value) {
        return { valid: false, message: 'Budget value not found' };
    }
    
    const count = budgetValues.filter(v => v.projectId === value.projectId).length;
    
    if (count <= 1) {
        return { 
            valid: false, 
            message: 'Cannot delete the last budget value for a project. Add another budget value first.' 
        };
    }
    
    return { valid: true, message: '' };
}
