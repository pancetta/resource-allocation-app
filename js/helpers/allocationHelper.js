/**********************
 * Allocation Calculation Helpers
 * 
 * This module provides optimized helpers for allocation calculations
 * to avoid repeated filtering and improve report performance.
 **********************/

import { isMonthInRange, compareMonths } from './dateHelper.js';
import { getEffectiveFte } from './overrideHelper.js';

/**
 * Build an index map for fast allocation lookups by person and project
 * @param {Array} allocations - Array of allocation objects
 * @returns {Map} Map with composite keys "personId:projectId" pointing to allocation arrays
 */
export function buildAllocationIndex(allocations) {
    const index = new Map();
    
    for (const alloc of allocations) {
        const key = `${alloc.personId}:${alloc.projectId}`;
        if (!index.has(key)) {
            index.set(key, []);
        }
        index.get(key).push(alloc);
    }
    
    return index;
}

/**
 * Build an index map for fast allocation override lookups
 * @param {Array} allocationOverrides - Array of allocation override objects
 * @returns {Map} Map with composite keys "allocationId:month" pointing to override objects
 */
export function buildAllocationOverrideIndex(allocationOverrides) {
    const index = new Map();
    
    for (const override of allocationOverrides) {
        const key = `${override.allocationId}:${override.month}`;
        index.set(key, override);
    }
    
    return index;
}

/**
 * Calculate person-months for a specific person/project/month combination
 * @param {Map} allocationIndex - Pre-built allocation index
 * @param {string} personId - Person ID
 * @param {string} projectId - Project ID
 * @param {string} month - Month string in YYYY-MM format
 * @param {number} fte - Person's FTE value
 * @param {Map} [allocationOverrideIndex] - Optional pre-built allocation override index
 * @returns {number} Calculated person-months
 */
export function calculatePM(allocationIndex, personId, projectId, month, fte, allocationOverrideIndex = null) {
    const key = `${personId}:${projectId}`;
    const allocations = allocationIndex.get(key);
    
    if (!allocations) {
        return 0;
    }
    
    return allocations.reduce((sum, alloc) => {
        // Check if allocation is active for this month
        if (isMonthInRange(month, alloc.startMonth, alloc.endMonth)) {
            // Check for allocation override
            let pct = alloc.pct;
            if (allocationOverrideIndex) {
                const overrideKey = `${alloc.id}:${month}`;
                const override = allocationOverrideIndex.get(overrideKey);
                if (override) {
                    pct = override.pct;
                }
            }
            return sum + (pct * fte);
        }
        return sum;
    }, 0);
}

/**
 * Calculate total person-months for a person across all projects for a given month
 * @param {Map} allocationIndex - Pre-built allocation index
 * @param {string} personId - Person ID
 * @param {Array} projects - Array of project objects
 * @param {string} month - Month string in YYYY-MM format
 * @param {number} fte - Person's FTE value
 * @param {Map} [allocationOverrideIndex] - Optional pre-built allocation override index
 * @returns {number} Total person-months
 */
export function calculatePersonTotal(allocationIndex, personId, projects, month, fte, allocationOverrideIndex = null) {
    let total = 0;
    
    for (const project of projects) {
        total += calculatePM(allocationIndex, personId, project.id, month, fte, allocationOverrideIndex);
    }
    
    return total;
}

/**
 * Calculate total person-months for a project across all people for a given month
 * @param {Map} allocationIndex - Pre-built allocation index
 * @param {string} projectId - Project ID
 * @param {Array} people - Array of person objects
 * @param {string} month - Month string in YYYY-MM format
 * @param {Array} [fteValues] - Optional array of FTE value objects
 * @param {Map} [allocationOverrideIndex] - Optional pre-built allocation override index
 * @returns {number} Total person-months
 */
export function calculateProjectTotal(allocationIndex, projectId, people, month, fteValues = null, allocationOverrideIndex = null) {
    let total = 0;
    
    for (const person of people) {
        // Get effective FTE using helper
        const fte = fteValues ? getEffectiveFte(person.id, month, fteValues) : 1;
        
        total += calculatePM(allocationIndex, person.id, projectId, month, fte, allocationOverrideIndex);
    }
    
    return total;
}

/**
 * Calculate monthly totals for a person across multiple months
 * @param {Map} allocationIndex - Pre-built allocation index
 * @param {string} personId - Person ID
 * @param {Array} projects - Array of project objects
 * @param {Array} months - Array of month strings in YYYY-MM format
 * @param {number} fte - Person's FTE value (base value, overrides handled per-month)
 * @param {Array} [fteOverrides] - Optional array of FTE override objects
 * @param {Map} [allocationOverrideIndex] - Optional pre-built allocation override index
 * @returns {Array} Array of monthly totals
 */
export function calculatePersonMonthlyTotals(allocationIndex, personId, projects, months, fte, fteOverrides = null, allocationOverrideIndex = null) {
    return months.map(month => {
        let effectiveFte = fte;
        
        // Check for FTE override for this specific month
        if (fteOverrides) {
            const applicableOverrides = fteOverrides.filter(override => 
                override.personId === personId &&
                override.startMonth <= month &&
                (!override.endMonth || override.endMonth >= month)
            );
            
            if (applicableOverrides.length > 0) {
                const sortedOverrides = applicableOverrides.sort((a, b) => 
                    b.startMonth.localeCompare(a.startMonth)
                );
                effectiveFte = sortedOverrides[0].fte;
            }
        }
        
        return calculatePersonTotal(allocationIndex, personId, projects, month, effectiveFte, allocationOverrideIndex);
    });
}

/**
 * Calculate monthly totals for a project across multiple months
 * @param {Map} allocationIndex - Pre-built allocation index
 * @param {string} projectId - Project ID
 * @param {Array} people - Array of person objects
 * @param {Array} months - Array of month strings in YYYY-MM format
 * @param {Array} [fteOverrides] - Optional array of FTE override objects
 * @param {Map} [allocationOverrideIndex] - Optional pre-built allocation override index
 * @returns {Array} Array of monthly totals
 */
export function calculateProjectMonthlyTotals(allocationIndex, projectId, people, months, fteOverrides = null, allocationOverrideIndex = null) {
    return months.map(month => calculateProjectTotal(allocationIndex, projectId, people, month, fteOverrides, allocationOverrideIndex));
}

/**
 * Sum an array of numbers
 * @param {Array<number>} arr - Array of numbers to sum
 * @returns {number} Sum of all numbers in the array
 */
export function sumArray(arr) {
    return arr.reduce((sum, val) => sum + val, 0);
}

/**
 * Convert percentage allocation to person-months per month
 * @param {number} fte - Person's FTE value (0.0 to 1.0)
 * @param {number} pct - Allocation percentage (0.0 to 1.0)
 * @returns {number} Person-months per month
 */
export function pctToPMPerMonth(fte, pct) {
    return fte * pct;
}

/**
 * Convert percentage allocation to person-months per year
 * @param {number} fte - Person's FTE value (0.0 to 1.0)
 * @param {number} pct - Allocation percentage (0.0 to 1.0)
 * @returns {number} Person-months per year
 */
export function pctToPMPerYear(fte, pct) {
    return fte * pct * 12;
}

/**
 * Format PM and percentage together for display
 * @param {number} pm - Person-months value
 * @param {number} fte - Person's FTE value for calculating percentage
 * @returns {string} Formatted string like "0.50 (50%)"
 */
export function formatPMWithPct(pm, fte) {
    if (fte === 0) {
        return `${pm.toFixed(2)} (N/A)`;
    }
    const pct = (pm / fte) * 100;
    return `${pm.toFixed(2)} (${pct.toFixed(0)}%)`;
}
