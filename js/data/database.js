/**********************
* IndexedDB and Data Access Layer
**********************/

import { addRecord, updateRecord, deleteRecord } from './crudHelper.js';
import { DEFAULT_START_MONTH } from '../config/constants.js';

const DB_NAME = "resource-planning";
const DB_VERSION = 5;
let db;

// Simple cache to reduce IndexedDB calls
const cache = {
    people: null,
    projects: null,
    defaultAllocations: null,
    fteValues: null,
    budgetValues: null,
    allocationOverrides: null
};

// Cache invalidation flags
let cacheValid = {
    people: false,
    projects: false,
    defaultAllocations: false,
    fteValues: false,
    budgetValues: false,
    allocationOverrides: false
};

/**
 * Clear cache for a specific store or all stores
 * @param {string} [storeName] - Name of the store to invalidate, or undefined for all
 */
function invalidateCache(storeName) {
    if (storeName) {
        cacheValid[storeName] = false;
        cache[storeName] = null;
    } else {
        cacheValid.people = false;
        cacheValid.projects = false;
        cacheValid.defaultAllocations = false;
        cacheValid.fteValues = false;
        cacheValid.budgetValues = false;
        cacheValid.allocationOverrides = false;
        cache.people = null;
        cache.projects = null;
        cache.defaultAllocations = null;
        cache.fteValues = null;
        cache.budgetValues = null;
        cache.allocationOverrides = null;
    }
}

/**
 * Clear all caches - useful for testing
 * @public
 */
export function clearCache() {
    invalidateCache();
}

/**
 * Open and initialize the IndexedDB database
 * @param {boolean} [initBaseFunding] - Whether to initialize base funding projects. Defaults to true in production, false in tests.
 * @returns {Promise<IDBDatabase>} The database instance
 */
export async function openDatabase(initBaseFunding) {
    // Default to true in production, false in test environment
    if (initBaseFunding === undefined) {
        // Check if we're in a test environment by looking for vitest-specific globals
        // In tests, vitest injects these globals. In production/browser, they won't exist.
        const isTestEnv = typeof globalThis.describe !== 'undefined' && 
                         typeof globalThis.it !== 'undefined' &&
                         typeof globalThis.expect !== 'undefined';
        initBaseFunding = !isTestEnv;
    }
    
    const database = await new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            const oldVersion = e.oldVersion;
            const transaction = e.target.transaction;
            
            // Create required object stores
            if (!db.objectStoreNames.contains("people")) {
                db.createObjectStore("people", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("projects")) {
                db.createObjectStore("projects", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("defaultAllocations")) {
                db.createObjectStore("defaultAllocations", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("fteValues")) {
                db.createObjectStore("fteValues", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("budgetValues")) {
                db.createObjectStore("budgetValues", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("allocationOverrides")) {
                db.createObjectStore("allocationOverrides", { keyPath: "id", autoIncrement: true });
            }
        };
        
        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };
        
        request.onerror = (e) => reject(e.target.error);
    });
    
    // Initialize base funding projects after database is opened
    // Skip this in tests (when initBaseFunding is false)
    if (initBaseFunding) {
        try {
            await initializeBaseFundingProjects();
        } catch (error) {
            console.warn('Failed to initialize base funding projects:', error);
        }
    }
    
    return database;
}

/**
 * Generic getAll function with caching support
 * @param {string} storeName - Name of the object store
 * @param {boolean} [useCache=true] - Whether to use cache
 * @returns {Promise<Array>} Array of all records from the store
 */
function getAll(storeName, useCache = true) {
    // Return cached data if available and valid
    if (useCache && cacheValid[storeName] && cache[storeName]) {
        return Promise.resolve([...cache[storeName]]); // Return a copy
    }

    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            
            req.onsuccess = () => {
                const result = req.result;
                // Update cache
                if (useCache) {
                    cache[storeName] = result;
                    cacheValid[storeName] = true;
                }
                resolve(result);
            };
            req.onerror = () => reject(req.error);
        } catch (error) {
            reject(error);
        }
    });
}

// People CRUD
/**
 * Get all people from the database
 * @returns {Promise<Array>} Array of person objects
 */
export async function getPeople() {
    return getAll("people");
}

/**
 * Add a new person to the database
 * @param {Object} p - Person object with id, name, fte, active properties
 * @returns {Promise<void>}
 */
export async function addPerson(p) {
    return addRecord(db, "people", p, () => invalidateCache("people"));
}

/**
 * Update an existing person in the database
 * @param {Object} p - Person object with updated properties
 * @returns {Promise<void>}
 */
export async function updatePerson(p) {
    return updateRecord(db, "people", p, () => invalidateCache("people"));
}

/**
 * Delete a person from the database
 * @param {string} id - Person ID
 * @returns {Promise<void>}
 */
export async function deletePerson(id) {
    return deleteRecord(db, "people", id, () => invalidateCache("people"));
}

// Projects CRUD
/**
 * Get all projects from the database
 * @returns {Promise<Array>} Array of project objects
 */
export async function getProjects() {
    return getAll("projects");
}

/**
 * Migrate legacy plannedPM field from project to budgetValues
 * @param {string} projectId - The project ID
 * @param {number} plannedPM - The planned PM value to migrate
 * @returns {Promise<void>}
 * @private
 */
async function migrateProjectPlannedPM(projectId, plannedPM) {
    const existingBudgetValues = await getBudgetValues();
    const existingBudget = existingBudgetValues.find(bv => bv.projectId === projectId);
    
    if (existingBudget) {
        // Update existing budget value
        existingBudget.plannedPM = plannedPM;
        await updateBudgetValue(existingBudget);
    } else {
        // Create new budget value with DEFAULT_START_MONTH as the start date
        // This ensures legacy data gets a sensible default date range
        await addBudgetValue({
            projectId: projectId,
            plannedPM: plannedPM,
            startMonth: DEFAULT_START_MONTH,
            endMonth: null // Open-ended
        });
    }
}

/**
 * Add a new project to the database
 * Automatically migrates legacy plannedPM field to budgetValues if present
 * @param {Object} p - Project object with id, name properties
 * @returns {Promise<void>}
 */
export async function addProject(p) {
    // Handle legacy plannedPM field - migrate to budgetValues
    if (p.plannedPM !== undefined && p.plannedPM !== null) {
        const plannedPM = p.plannedPM;
        const projectId = p.id;
        
        // Remove plannedPM from project object before storing
        const cleanProject = { ...p };
        delete cleanProject.plannedPM;
        
        // Add the project without plannedPM
        await addRecord(db, "projects", cleanProject, () => invalidateCache("projects"));
        
        // Migrate plannedPM to budgetValues
        await migrateProjectPlannedPM(projectId, plannedPM);
    } else {
        // No plannedPM to migrate, just add the project
        return addRecord(db, "projects", p, () => invalidateCache("projects"));
    }
}

/**
 * Update an existing project in the database
 * Automatically migrates legacy plannedPM field to budgetValues if present
 * @param {Object} p - Project object with updated properties
 * @returns {Promise<void>}
 */
export async function updateProject(p) {
    // Handle legacy plannedPM field - migrate to budgetValues
    if (p.plannedPM !== undefined && p.plannedPM !== null) {
        const plannedPM = p.plannedPM;
        const projectId = p.id;
        
        // Remove plannedPM from project object before storing
        const cleanProject = { ...p };
        delete cleanProject.plannedPM;
        
        // Update the project without plannedPM
        await updateRecord(db, "projects", cleanProject, () => invalidateCache("projects"));
        
        // Migrate plannedPM to budgetValues
        await migrateProjectPlannedPM(projectId, plannedPM);
    } else {
        // No plannedPM to migrate, just update the project
        return updateRecord(db, "projects", p, () => invalidateCache("projects"));
    }
}

/**
 * Delete a project from the database
 * Prevents deletion of base funding projects
 * @param {string} id - Project ID
 * @returns {Promise<void>}
 * @throws {Error} If attempting to delete a base funding project
 */
export async function deleteProject(id) {
    // Check if this is a base funding project
    const projects = await getProjects();
    const project = projects.find(p => p.id === id);
    
    if (project && isBaseFundingProject(project)) {
        throw new Error('Cannot delete base funding projects');
    }
    
    return deleteRecord(db, "projects", id, () => invalidateCache("projects"));
}

// Allocations CRUD
/**
 * Get all allocations from the database
 * @returns {Promise<Array>} Array of allocation objects
 */
export async function getAllocations() {
    return getAll("defaultAllocations");
}

/**
 * Add a new allocation to the database
 * @param {Object} a - Allocation object with personId, projectId, pm, startMonth, endMonth
 * @returns {Promise<void>}
 */
export async function addAllocation(a) {
    return addRecord(db, "defaultAllocations", a, () => invalidateCache("defaultAllocations"));
}

/**
 * Update an existing allocation in the database
 * @param {Object} a - Allocation object with updated properties
 * @returns {Promise<void>}
 */
export async function updateAllocation(a) {
    return updateRecord(db, "defaultAllocations", a, () => invalidateCache("defaultAllocations"));
}

/**
 * Delete an allocation from the database
 * @param {number} id - Allocation ID
 * @returns {Promise<void>}
 */
export async function deleteAllocation(id) {
    return deleteRecord(db, "defaultAllocations", id, () => invalidateCache("defaultAllocations"));
}

// Auto-generate IDs
/**
 * Generate next available person ID
 * @returns {Promise<string>} Person ID in format p###
 */
export async function generatePersonId() {
    const people = await getPeople();
    if (people.length === 0) {
        return 'p001';
    }
    const maxNum = people.reduce((max, p) => {
        const m = p.id.match(/^p(\d+)$/);
        return Math.max(max, m ? parseInt(m[1], 10) : 0);
    }, 0);
    return `p${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * Generate next available project ID
 * @returns {Promise<string>} Project ID in format proj###
 */
export async function generateProjectId() {
    const projects = await getProjects();
    if (projects.length === 0) {
        return 'proj001';
    }
    const maxNum = projects.reduce((max, p) => {
        const m = p.id.match(/^proj(\d+)$/);
        return Math.max(max, m ? parseInt(m[1], 10) : 0);
    }, 0);
    return `proj${String(maxNum + 1).padStart(3, '0')}`;
}

// Export all data
export async function exportAllData() {
    const people = await getPeople();
    const projects = await getProjects();
    const allocations = await getAllocations();
    const fteValues = await getFteValues();
    const budgetValues = await getBudgetValues();
    const allocationOverrides = await getAllocationOverrides();
    
    return {
        version: "3.0",
        exportDate: new Date().toISOString(),
        data: {
            people,
            projects,
            allocations,
            fteValues,
            budgetValues,
            allocationOverrides
        }
    };
}

// Import all data (clears existing data first)
export async function importAllData(importedData) {
    if (!importedData || !importedData.data) {
        throw new Error("Invalid data format");
    }
    
    const { 
        people, 
        projects, 
        allocations,
        fteValues = [],
        budgetValues = [],
        allocationOverrides = []
    } = importedData.data;
    
    // Clear existing data
    const tx = db.transaction([
        "people", 
        "projects", 
        "defaultAllocations",
        "fteValues",
        "budgetValues",
        "allocationOverrides"
    ], "readwrite");
    await tx.objectStore("people").clear();
    await tx.objectStore("projects").clear();
    await tx.objectStore("defaultAllocations").clear();
    await tx.objectStore("fteValues").clear();
    await tx.objectStore("budgetValues").clear();
    await tx.objectStore("allocationOverrides").clear();
    
    // Import people
    if (people && Array.isArray(people)) {
        for (const person of people) {
            await addPerson(person);
        }
    }
    
    // Import projects
    if (projects && Array.isArray(projects)) {
        for (const project of projects) {
            await addProject(project);
        }
    }
    
    // Import FTE values first (needed for allocation conversion)
    if (fteValues && Array.isArray(fteValues)) {
        for (const value of fteValues) {
            await addFteValue(value);
        }
    }
    
    // Import budget values
    if (budgetValues && Array.isArray(budgetValues)) {
        for (const value of budgetValues) {
            await addBudgetValue(value);
        }
    }
    
    // Import allocations
    if (allocations && Array.isArray(allocations)) {
        for (const allocation of allocations) {
            await addAllocation(allocation);
        }
    }
    
    // Import allocation overrides
    if (allocationOverrides && Array.isArray(allocationOverrides)) {
        for (const override of allocationOverrides) {
            await addAllocationOverride(override);
        }
    }
}

// Automatic backup to localStorage
const BACKUP_KEY_PREFIX = "resource-planning-backup-";
const MAX_BACKUPS = 10;
const AUTO_JSON_BACKUP_KEY = "resource-planning-auto-json-backup";

export async function createBackup() {
    const data = await exportAllData();
    const timestamp = Date.now();
    const backupKey = `${BACKUP_KEY_PREFIX}${timestamp}`;
    
    try {
        localStorage.setItem(backupKey, JSON.stringify(data));
        
        // Also create/update the auto-prepared JSON backup for instant download
        localStorage.setItem(AUTO_JSON_BACKUP_KEY, JSON.stringify({
            data,
            preparedAt: timestamp,
            preparedDate: new Date(timestamp).toISOString()
        }));
        
        // Clean up old backups, keeping only MAX_BACKUPS most recent
        const allBackups = getAllBackups();
        if (allBackups.length > MAX_BACKUPS) {
            const toDelete = allBackups.slice(MAX_BACKUPS);
            toDelete.forEach(backup => {
                localStorage.removeItem(backup.key);
            });
        }
        
        return backupKey;
    } catch (e) {
        console.error("Failed to create backup:", e);
        throw e;
    }
}

export function getAllBackups() {
    const backups = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(BACKUP_KEY_PREFIX)) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                const timestamp = parseInt(key.replace(BACKUP_KEY_PREFIX, ""));
                backups.push({
                    key,
                    timestamp,
                    date: new Date(timestamp),
                    exportDate: data.exportDate
                });
            } catch (e) {
                console.error("Error reading backup:", key, e);
            }
        }
    }
    
    // Sort by timestamp descending (newest first)
    return backups.sort((a, b) => b.timestamp - a.timestamp);
}

export async function restoreBackup(backupKey) {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
        throw new Error("Backup not found");
    }
    
    const data = JSON.parse(backupData);
    await importAllData(data);
}

export function deleteBackup(backupKey) {
    localStorage.removeItem(backupKey);
}

// Get auto-prepared JSON backup
export function getAutoPreparedBackup() {
    const backupData = localStorage.getItem(AUTO_JSON_BACKUP_KEY);
    if (!backupData) return null;
    
    try {
        return JSON.parse(backupData);
    } catch (e) {
        console.error("Error reading auto-prepared backup:", e);
        return null;
    }
}

/**********************
 * FTE Values CRUD
 **********************/

/**
 * Get all FTE values from the database
 * @returns {Promise<Array>} Array of FTE value objects
 */
export async function getFteValues() {
    return getAll("fteValues");
}

/**
 * Add a new FTE value to the database
 * @param {Object} value - FTE value object with personId, fte, startMonth, endMonth
 * @returns {Promise<void>}
 */
export async function addFteValue(value) {
    return addRecord(db, "fteValues", value, () => invalidateCache("fteValues"));
}

/**
 * Update an existing FTE value in the database
 * @param {Object} value - FTE value object with updated properties
 * @returns {Promise<void>}
 */
export async function updateFteValue(value) {
    return updateRecord(db, "fteValues", value, () => invalidateCache("fteValues"));
}

/**
 * Delete an FTE value from the database
 * @param {number} id - FTE value ID
 * @returns {Promise<void>}
 */
export async function deleteFteValue(id) {
    return deleteRecord(db, "fteValues", id, () => invalidateCache("fteValues"));
}

/**********************
 * Budget Values CRUD
 **********************/

/**
 * Get all budget values from the database
 * @returns {Promise<Array>} Array of budget value objects
 */
export async function getBudgetValues() {
    return getAll("budgetValues");
}

/**
 * Add a new budget value to the database
 * @param {Object} value - Budget value object with projectId, plannedPM, startMonth, endMonth
 * @returns {Promise<void>}
 */
export async function addBudgetValue(value) {
    return addRecord(db, "budgetValues", value, () => invalidateCache("budgetValues"));
}

/**
 * Update an existing budget value in the database
 * @param {Object} value - Budget value object with updated properties
 * @returns {Promise<void>}
 */
export async function updateBudgetValue(value) {
    return updateRecord(db, "budgetValues", value, () => invalidateCache("budgetValues"));
}

/**
 * Delete a budget value from the database
 * @param {number} id - Budget value ID
 * @returns {Promise<void>}
 */
export async function deleteBudgetValue(id) {
    return deleteRecord(db, "budgetValues", id, () => invalidateCache("budgetValues"));
}

/**********************
 * Allocation Overrides CRUD
 **********************/

/**
 * Get all allocation overrides from the database
 * @returns {Promise<Array>} Array of allocation override objects
 */
export async function getAllocationOverrides() {
    return getAll("allocationOverrides");
}

/**
 * Add a new allocation override to the database
 * @param {Object} override - Allocation override object with allocationId, pm, month
 * @returns {Promise<void>}
 */
export async function addAllocationOverride(override) {
    return addRecord(db, "allocationOverrides", override, () => invalidateCache("allocationOverrides"));
}

/**
 * Update an existing allocation override in the database
 * @param {Object} override - Allocation override object with updated properties
 * @returns {Promise<void>}
 */
export async function updateAllocationOverride(override) {
    return updateRecord(db, "allocationOverrides", override, () => invalidateCache("allocationOverrides"));
}

/**
 * Delete an allocation override from the database
 * @param {number} id - Allocation override ID
 * @returns {Promise<void>}
 */
export async function deleteAllocationOverride(id) {
    return deleteRecord(db, "allocationOverrides", id, () => invalidateCache("allocationOverrides"));
}

/**********************
 * Value Resolution Helpers
 **********************/

/**
 * Get the effective FTE for a person in a specific month
 * @param {string} personId - Person ID
 * @param {string} month - Month in YYYY-MM format
 * @param {Array} fteValues - Array of FTE value objects
 * @returns {number} Effective FTE value
 */
export function getEffectiveFte(personId, month, fteValues) {
    // Find applicable FTE value (most recent one that covers this month)
    const applicableValues = fteValues.filter(value => 
        value.personId === personId &&
        value.startMonth <= month &&
        (!value.endMonth || value.endMonth >= month)
    );
    
    if (applicableValues.length > 0) {
        // If multiple values match (shouldn't happen but handle gracefully), use the most recent
        const sortedValues = applicableValues.sort((a, b) => 
            b.startMonth.localeCompare(a.startMonth)
        );
        return sortedValues[0].fte;
    }
    
    // Default to 1.0 if no FTE value is found
    return 1;
}

/**
 * Get the effective planned PM for a project in a specific month
 * @param {string} projectId - Project ID
 * @param {string} month - Month in YYYY-MM format
 * @param {Array} budgetValues - Array of budget value objects
 * @returns {number} Effective planned PM value
 */
export function getEffectivePlannedPM(projectId, month, budgetValues) {
    // Find applicable budget value (most recent one that covers this month)
    const applicableValues = budgetValues.filter(value => 
        value.projectId === projectId &&
        value.startMonth <= month &&
        (!value.endMonth || value.endMonth >= month)
    );
    
    if (applicableValues.length > 0) {
        // If multiple values match (shouldn't happen but handle gracefully), use the most recent
        const sortedValues = applicableValues.sort((a, b) => 
            b.startMonth.localeCompare(a.startMonth)
        );
        return sortedValues[0].plannedPM;
    }
    
    // Default to 0 if no budget value is found
    return 0;
}

/**
 * Get the effective allocation percentage, considering overrides
 * @param {number} allocationId - Allocation ID
 * @param {string} month - Month in YYYY-MM format
 * @param {Array} allocations - Array of allocation objects
 * @param {Array} allocationOverrides - Array of allocation override objects
 * @returns {number} Effective allocation percentage
 */
export function getEffectiveAllocationPM(allocationId, month, allocations, allocationOverrides) {
    // Find month-specific override
    const override = allocationOverrides.find(o => 
        o.allocationId === allocationId && o.month === month
    );
    
    if (override) {
        return override.pm;
    }
    
    // Fall back to base allocation PM
    const allocation = allocations.find(a => a.id === allocationId);
    return allocation ? allocation.pm : 0;
}

/**
 * Export data for undo/redo functionality
 * @returns {Promise<Object>} The exported data
 */
export async function exportData() {
    return await exportAllData();
}

/**
 * Import data for undo/redo functionality
 * @param {Object} data - The data to import
 * @param {boolean} reload - Whether to reload the page after import (default: true)
 * @returns {Promise<void>}
 */
export async function importData(data, reload = true) {
    await importAllData(data);
    
    // Invalidate cache after import
    invalidateCache();
    
    // Reload page if requested
    if (reload && typeof window !== 'undefined') {
        window.location.reload();
    } else if (!reload) {
        // Re-render views after data import without reload
        // This will be handled by the undo/redo manager
        const event = new CustomEvent('dataImported');
        if (typeof document !== 'undefined') {
            document.dispatchEvent(event);
        }
    }
}

/**********************
 * Base Funding Helper Functions
 **********************/

/**
 * Check if a project is a base funding project
 * @param {Object} project - Project object
 * @returns {boolean} True if project is base funding
 */
export function isBaseFundingProject(project) {
    return project && project.isBaseFunding === true;
}

/**
 * Get all base funding projects
 * @returns {Promise<Array>} Array of base funding projects
 */
export async function getBaseFundingProjects() {
    const projects = await getProjects();
    return projects.filter(p => isBaseFundingProject(p));
}

/**
 * Get base funding project for a specific type
 * @param {string} type - Base funding type (e.g., '210', '220')
 * @returns {Promise<Object|null>} Base funding project or null if not found
 */
export async function getBaseFundingProjectByType(type) {
    const projects = await getProjects();
    return projects.find(p => isBaseFundingProject(p) && p.baseFundingType === type) || null;
}

/**
 * Check if a project deducts from base funding
 * @param {Object} project - Project object
 * @returns {boolean} True if project deducts from base funding
 */
export function deductsFromBaseFunding(project) {
    return project && project.deductsFromBaseFunding === true;
}

/**
 * Initialize base funding projects if they don't exist
 * Creates base funding projects for types 210 and 220
 * @returns {Promise<void>}
 */
export async function initializeBaseFundingProjects() {
    const projects = await getProjects();
    const baseFundingTypes = ['210', '220'];
    
    for (const type of baseFundingTypes) {
        const exists = projects.find(p => isBaseFundingProject(p) && p.baseFundingType === type);
        if (!exists) {
            const projectId = await generateProjectId();
            await addProject({
                id: projectId,
                name: `Base Funding ${type}`,
                isBaseFunding: true,
                baseFundingType: type,
                deductsFromBaseFunding: false,
                baseFundingTypeId: null
            });
        }
    }
}
