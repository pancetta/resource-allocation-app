/**
 * Validation Helper - Functions to validate data integrity
 * Ensures entities have required time-based values
 */

import { getFteValues, getBudgetValues, getAllocations } from '../data/database.js';

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
    
    if (value < 0) {
        return { valid: false, message: 'FTE cannot be below 0' };
    }
    
    if (value > 1) {
        return { valid: false, message: 'FTE cannot be above 1' };
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
    
    if (value < 0) {
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
    
    if (value < 0) {
        return { valid: false, message: 'Allocation percentage cannot be negative' };
    }
    
    if (value > 100) {
        return { valid: false, message: 'Allocation percentage cannot exceed 100' };
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

/**
 * Check if two date ranges overlap
 * @param {string} start1 - Start month of first range (YYYY-MM)
 * @param {string|null} end1 - End month of first range (YYYY-MM) or null for open-ended
 * @param {string} start2 - Start month of second range (YYYY-MM)
 * @param {string|null} end2 - End month of second range (YYYY-MM) or null for open-ended
 * @returns {boolean} True if ranges overlap
 */
function dateRangesOverlap(start1, end1, start2, end2) {
    // If either range has no end date (open-ended), check if they could overlap
    if (!end1 || !end2) {
        // If first range has no end, check if second range starts before or at first range start
        if (!end1 && !end2) {
            // Both open-ended - they definitely overlap if start dates are same or different
            return true;
        }
        if (!end1) {
            // First is open-ended, second has an end
            // They overlap if second range doesn't end before first starts
            return end2 >= start1;
        }
        if (!end2) {
            // Second is open-ended, first has an end
            // They overlap if first range doesn't end before second starts
            return end1 >= start2;
        }
    }
    
    // Both have end dates - check for standard overlap
    // Ranges overlap if: start1 <= end2 AND start2 <= end1
    return start1 <= end2 && start2 <= end1;
}

/**
 * Find overlapping FTE values for a person
 * @param {string} personId - The person's ID
 * @param {string} startMonth - Start month of new FTE value (YYYY-MM)
 * @param {string|null} endMonth - End month of new FTE value (YYYY-MM) or null for open-ended
 * @param {number} [excludeId] - Optional FTE value ID to exclude from check (for updates)
 * @returns {Promise<Array>} Array of overlapping FTE values
 */
export async function findOverlappingFteValues(personId, startMonth, endMonth, excludeId = null) {
    const fteValues = await getFteValues();
    
    return fteValues.filter(value => {
        // Skip the value being updated
        if (excludeId !== null && value.id === excludeId) {
            return false;
        }
        
        // Only check values for the same person
        if (value.personId !== personId) {
            return false;
        }
        
        // Check if date ranges overlap
        return dateRangesOverlap(startMonth, endMonth, value.startMonth, value.endMonth);
    });
}

/**
 * Find overlapping budget values for a project
 * @param {string} projectId - The project's ID
 * @param {string} startMonth - Start month of new budget value (YYYY-MM)
 * @param {string|null} endMonth - End month of new budget value (YYYY-MM) or null for open-ended
 * @param {number} [excludeId] - Optional budget value ID to exclude from check (for updates)
 * @returns {Promise<Array>} Array of overlapping budget values
 */
export async function findOverlappingBudgetValues(projectId, startMonth, endMonth, excludeId = null) {
    const budgetValues = await getBudgetValues();
    
    return budgetValues.filter(value => {
        // Skip the value being updated
        if (excludeId !== null && value.id === excludeId) {
            return false;
        }
        
        // Only check values for the same project
        if (value.projectId !== projectId) {
            return false;
        }
        
        // Check if date ranges overlap
        return dateRangesOverlap(startMonth, endMonth, value.startMonth, value.endMonth);
    });
}

/**
 * Get the month before a given month
 * @param {string} month - Month in YYYY-MM format
 * @returns {string} Previous month in YYYY-MM format
 */
export function getMonthBefore(month) {
    const date = new Date(month + '-01');
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7);
}

/**
 * Find open-ended FTE values that should be closed when adding a new value
 * Returns open-ended entries that would overlap with the new entry
 * @param {string} personId - The person's ID
 * @param {string} startMonth - Start month of new FTE value (YYYY-MM)
 * @returns {Promise<Array>} Array of open-ended FTE values to close
 */
export async function findOpenEndedFteValuesToClose(personId, startMonth) {
    const fteValues = await getFteValues();
    
    return fteValues.filter(value => {
        // Only check values for the same person
        if (value.personId !== personId) {
            return false;
        }
        
        // Only look for open-ended values
        if (value.endMonth !== null) {
            return false;
        }
        
        // Only include if this value starts before the new value
        // (so it would overlap with the new entry)
        return value.startMonth < startMonth;
    });
}

/**
 * Find open-ended budget values that should be closed when adding a new value
 * Returns open-ended entries that would overlap with the new entry
 * @param {string} projectId - The project's ID
 * @param {string} startMonth - Start month of new budget value (YYYY-MM)
 * @returns {Promise<Array>} Array of open-ended budget values to close
 */
export async function findOpenEndedBudgetValuesToClose(projectId, startMonth) {
    const budgetValues = await getBudgetValues();
    
    return budgetValues.filter(value => {
        // Only check values for the same project
        if (value.projectId !== projectId) {
            return false;
        }
        
        // Only look for open-ended values
        if (value.endMonth !== null) {
            return false;
        }
        
        // Only include if this value starts before the new value
        // (so it would overlap with the new entry)
        return value.startMonth < startMonth;
    });
}

/**********************
 * Allocation Overlap Detection
 **********************/

/**
 * Find overlapping allocations for a person-project pair
 * @param {string} personId - The person's ID
 * @param {string} projectId - The project's ID
 * @param {string} startMonth - Start month of new allocation (YYYY-MM)
 * @param {string|null} endMonth - End month of new allocation (YYYY-MM) or null for open-ended
 * @param {number} [excludeId] - Optional allocation ID to exclude from check (for updates)
 * @returns {Promise<Array>} Array of overlapping allocations
 */
export async function findOverlappingAllocations(personId, projectId, startMonth, endMonth, excludeId = null) {
    const allocations = await getAllocations();
    
    return allocations.filter(alloc => {
        // Skip the allocation being updated
        if (excludeId !== null && alloc.id === excludeId) {
            return false;
        }
        
        // Only check allocations for the same person and project
        if (alloc.personId !== personId || alloc.projectId !== projectId) {
            return false;
        }
        
        // Check if date ranges overlap
        return dateRangesOverlap(startMonth, endMonth, alloc.startMonth, alloc.endMonth);
    });
}

/**
 * Find open-ended allocations that should be closed when adding a new allocation
 * Returns open-ended entries that would overlap with the new entry
 * @param {string} personId - The person's ID
 * @param {string} projectId - The project's ID
 * @param {string} startMonth - Start month of new allocation (YYYY-MM)
 * @returns {Promise<Array>} Array of open-ended allocations to close
 */
export async function findOpenEndedAllocationsToClose(personId, projectId, startMonth) {
    const allocations = await getAllocations();
    
    return allocations.filter(alloc => {
        // Only check allocations for the same person and project
        if (alloc.personId !== personId || alloc.projectId !== projectId) {
            return false;
        }
        
        // Only look for open-ended allocations
        if (alloc.endMonth !== null) {
            return false;
        }
        
        // Only include if this allocation starts before the new one
        // (so it would overlap with the new entry)
        return alloc.startMonth < startMonth;
    });
}
