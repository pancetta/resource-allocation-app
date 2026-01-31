/**********************
 * Allocation Calculation Helpers
 * 
 * This module provides optimized helpers for allocation calculations
 * to avoid repeated filtering and improve report performance.
 **********************/

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
 * Calculate person-months for a specific person/project/month combination
 * @param {Map} allocationIndex - Pre-built allocation index
 * @param {string} personId - Person ID
 * @param {string} projectId - Project ID
 * @param {string} month - Month string in YYYY-MM format
 * @param {number} fte - Person's FTE value
 * @returns {number} Calculated person-months
 */
export function calculatePM(allocationIndex, personId, projectId, month, fte) {
    const key = `${personId}:${projectId}`;
    const allocations = allocationIndex.get(key);
    
    if (!allocations) {
        return 0;
    }
    
    return allocations.reduce((sum, alloc) => {
        // Check if allocation is active for this month
        if (alloc.startMonth <= month && (!alloc.endMonth || alloc.endMonth >= month)) {
            return sum + (alloc.pct * fte);
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
 * @returns {number} Total person-months
 */
export function calculatePersonTotal(allocationIndex, personId, projects, month, fte) {
    let total = 0;
    
    for (const project of projects) {
        total += calculatePM(allocationIndex, personId, project.id, month, fte);
    }
    
    return total;
}

/**
 * Calculate total person-months for a project across all people for a given month
 * @param {Map} allocationIndex - Pre-built allocation index
 * @param {string} projectId - Project ID
 * @param {Array} people - Array of person objects
 * @param {string} month - Month string in YYYY-MM format
 * @returns {number} Total person-months
 */
export function calculateProjectTotal(allocationIndex, projectId, people, month) {
    let total = 0;
    
    for (const person of people) {
        const fte = person.fte ?? 1;
        total += calculatePM(allocationIndex, person.id, projectId, month, fte);
    }
    
    return total;
}

/**
 * Calculate monthly totals for a person across multiple months
 * @param {Map} allocationIndex - Pre-built allocation index
 * @param {string} personId - Person ID
 * @param {Array} projects - Array of project objects
 * @param {Array} months - Array of month strings in YYYY-MM format
 * @param {number} fte - Person's FTE value
 * @returns {Array} Array of monthly totals
 */
export function calculatePersonMonthlyTotals(allocationIndex, personId, projects, months, fte) {
    return months.map(month => calculatePersonTotal(allocationIndex, personId, projects, month, fte));
}

/**
 * Calculate monthly totals for a project across multiple months
 * @param {Map} allocationIndex - Pre-built allocation index
 * @param {string} projectId - Project ID
 * @param {Array} people - Array of person objects
 * @param {Array} months - Array of month strings in YYYY-MM format
 * @returns {Array} Array of monthly totals
 */
export function calculateProjectMonthlyTotals(allocationIndex, projectId, people, months) {
    return months.map(month => calculateProjectTotal(allocationIndex, projectId, people, month));
}

/**
 * Sum an array of numbers
 * @param {Array<number>} arr - Array of numbers to sum
 * @returns {number} Sum of all numbers in the array
 */
export function sumArray(arr) {
    return arr.reduce((sum, val) => sum + val, 0);
}
