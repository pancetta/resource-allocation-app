/**********************
* IndexedDB and Data Access Layer
**********************/

import { addRecord, updateRecord, deleteRecord } from './crudHelper.js';

const DB_NAME = "resource-planning";
const DB_VERSION = 3;
let db;

// Simple cache to reduce IndexedDB calls
const cache = {
    people: null,
    projects: null,
    defaultAllocations: null,
    fteOverrides: null,
    projectBudgetOverrides: null,
    allocationOverrides: null
};

// Cache invalidation flags
let cacheValid = {
    people: false,
    projects: false,
    defaultAllocations: false,
    fteOverrides: false,
    projectBudgetOverrides: false,
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
        cacheValid.fteOverrides = false;
        cacheValid.projectBudgetOverrides = false;
        cacheValid.allocationOverrides = false;
        cache.people = null;
        cache.projects = null;
        cache.defaultAllocations = null;
        cache.fteOverrides = null;
        cache.projectBudgetOverrides = null;
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
 * @returns {Promise<IDBDatabase>} The database instance
 */
export async function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            const oldVersion = e.oldVersion;
            
            // Version 1 stores
            if (!db.objectStoreNames.contains("people")) {
                db.createObjectStore("people", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("projects")) {
                db.createObjectStore("projects", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("defaultAllocations")) {
                db.createObjectStore("defaultAllocations", { keyPath: "id", autoIncrement: true });
            }
            
            // Version 3 stores - override tables
            if (oldVersion < 3) {
                if (!db.objectStoreNames.contains("fteOverrides")) {
                    db.createObjectStore("fteOverrides", { keyPath: "id", autoIncrement: true });
                }
                if (!db.objectStoreNames.contains("projectBudgetOverrides")) {
                    db.createObjectStore("projectBudgetOverrides", { keyPath: "id", autoIncrement: true });
                }
                if (!db.objectStoreNames.contains("allocationOverrides")) {
                    db.createObjectStore("allocationOverrides", { keyPath: "id", autoIncrement: true });
                }
            }
        };
        
        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };
        
        request.onerror = (e) => reject(e.target.error);
    });
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
 * Add a new project to the database
 * @param {Object} p - Project object with id, name, plannedPM properties
 * @returns {Promise<void>}
 */
export async function addProject(p) {
    return addRecord(db, "projects", p, () => invalidateCache("projects"));
}

/**
 * Update an existing project in the database
 * @param {Object} p - Project object with updated properties
 * @returns {Promise<void>}
 */
export async function updateProject(p) {
    return updateRecord(db, "projects", p, () => invalidateCache("projects"));
}

/**
 * Delete a project from the database
 * @param {string} id - Project ID
 * @returns {Promise<void>}
 */
export async function deleteProject(id) {
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
 * @param {Object} a - Allocation object with personId, projectId, pct, startMonth, endMonth
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
    const fteOverrides = await getFteOverrides();
    const projectBudgetOverrides = await getProjectBudgetOverrides();
    const allocationOverrides = await getAllocationOverrides();
    
    return {
        version: "2.0",
        exportDate: new Date().toISOString(),
        data: {
            people,
            projects,
            allocations,
            fteOverrides,
            projectBudgetOverrides,
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
        fteOverrides = [],
        projectBudgetOverrides = [],
        allocationOverrides = []
    } = importedData.data;
    
    // Clear existing data
    const tx = db.transaction([
        "people", 
        "projects", 
        "defaultAllocations",
        "fteOverrides",
        "projectBudgetOverrides",
        "allocationOverrides"
    ], "readwrite");
    await tx.objectStore("people").clear();
    await tx.objectStore("projects").clear();
    await tx.objectStore("defaultAllocations").clear();
    await tx.objectStore("fteOverrides").clear();
    await tx.objectStore("projectBudgetOverrides").clear();
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
    
    // Import allocations
    if (allocations && Array.isArray(allocations)) {
        for (const allocation of allocations) {
            await addAllocation(allocation);
        }
    }
    
    // Import FTE overrides
    if (fteOverrides && Array.isArray(fteOverrides)) {
        for (const override of fteOverrides) {
            await addFteOverride(override);
        }
    }
    
    // Import project budget overrides
    if (projectBudgetOverrides && Array.isArray(projectBudgetOverrides)) {
        for (const override of projectBudgetOverrides) {
            await addProjectBudgetOverride(override);
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
 * FTE Overrides CRUD
 **********************/

/**
 * Get all FTE overrides from the database
 * @returns {Promise<Array>} Array of FTE override objects
 */
export async function getFteOverrides() {
    return getAll("fteOverrides");
}

/**
 * Add a new FTE override to the database
 * @param {Object} override - FTE override object with personId, fte, startMonth, endMonth
 * @returns {Promise<void>}
 */
export async function addFteOverride(override) {
    return addRecord(db, "fteOverrides", override, () => invalidateCache("fteOverrides"));
}

/**
 * Update an existing FTE override in the database
 * @param {Object} override - FTE override object with updated properties
 * @returns {Promise<void>}
 */
export async function updateFteOverride(override) {
    return updateRecord(db, "fteOverrides", override, () => invalidateCache("fteOverrides"));
}

/**
 * Delete an FTE override from the database
 * @param {number} id - FTE override ID
 * @returns {Promise<void>}
 */
export async function deleteFteOverride(id) {
    return deleteRecord(db, "fteOverrides", id, () => invalidateCache("fteOverrides"));
}

/**********************
 * Project Budget Overrides CRUD
 **********************/

/**
 * Get all project budget overrides from the database
 * @returns {Promise<Array>} Array of project budget override objects
 */
export async function getProjectBudgetOverrides() {
    return getAll("projectBudgetOverrides");
}

/**
 * Add a new project budget override to the database
 * @param {Object} override - Project budget override object with projectId, plannedPM, startMonth, endMonth
 * @returns {Promise<void>}
 */
export async function addProjectBudgetOverride(override) {
    return addRecord(db, "projectBudgetOverrides", override, () => invalidateCache("projectBudgetOverrides"));
}

/**
 * Update an existing project budget override in the database
 * @param {Object} override - Project budget override object with updated properties
 * @returns {Promise<void>}
 */
export async function updateProjectBudgetOverride(override) {
    return updateRecord(db, "projectBudgetOverrides", override, () => invalidateCache("projectBudgetOverrides"));
}

/**
 * Delete a project budget override from the database
 * @param {number} id - Project budget override ID
 * @returns {Promise<void>}
 */
export async function deleteProjectBudgetOverride(id) {
    return deleteRecord(db, "projectBudgetOverrides", id, () => invalidateCache("projectBudgetOverrides"));
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
 * @param {Object} override - Allocation override object with allocationId, pct, month
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
 * Override Resolution Helpers
 **********************/

/**
 * Get the effective FTE for a person in a specific month, considering overrides
 * @param {string} personId - Person ID
 * @param {string} month - Month in YYYY-MM format
 * @param {Array} people - Array of person objects
 * @param {Array} fteOverrides - Array of FTE override objects
 * @returns {number} Effective FTE value
 */
export function getEffectiveFte(personId, month, people, fteOverrides) {
    // Find applicable override (most recent one that covers this month)
    const applicableOverrides = fteOverrides.filter(override => 
        override.personId === personId &&
        override.startMonth <= month &&
        (!override.endMonth || override.endMonth >= month)
    );
    
    if (applicableOverrides.length > 0) {
        // If multiple overrides match (shouldn't happen but handle gracefully), use the most recent
        const sortedOverrides = applicableOverrides.sort((a, b) => 
            b.startMonth.localeCompare(a.startMonth)
        );
        return sortedOverrides[0].fte;
    }
    
    // Fall back to base FTE
    const person = people.find(p => p.id === personId);
    return person ? (person.fte ?? 1) : 1;
}

/**
 * Get the effective planned PM for a project in a specific month, considering overrides
 * @param {string} projectId - Project ID
 * @param {string} month - Month in YYYY-MM format
 * @param {Array} projects - Array of project objects
 * @param {Array} projectBudgetOverrides - Array of project budget override objects
 * @returns {number} Effective planned PM value
 */
export function getEffectivePlannedPM(projectId, month, projects, projectBudgetOverrides) {
    // Find applicable override (most recent one that covers this month)
    const applicableOverrides = projectBudgetOverrides.filter(override => 
        override.projectId === projectId &&
        override.startMonth <= month &&
        (!override.endMonth || override.endMonth >= month)
    );
    
    if (applicableOverrides.length > 0) {
        // If multiple overrides match (shouldn't happen but handle gracefully), use the most recent
        const sortedOverrides = applicableOverrides.sort((a, b) => 
            b.startMonth.localeCompare(a.startMonth)
        );
        return sortedOverrides[0].plannedPM;
    }
    
    // Fall back to base planned PM
    const project = projects.find(p => p.id === projectId);
    return project ? (project.plannedPM ?? 0) : 0;
}

/**
 * Get the effective allocation percentage, considering overrides
 * @param {number} allocationId - Allocation ID
 * @param {string} month - Month in YYYY-MM format
 * @param {Array} allocations - Array of allocation objects
 * @param {Array} allocationOverrides - Array of allocation override objects
 * @returns {number} Effective allocation percentage
 */
export function getEffectiveAllocationPct(allocationId, month, allocations, allocationOverrides) {
    // Find month-specific override
    const override = allocationOverrides.find(o => 
        o.allocationId === allocationId && o.month === month
    );
    
    if (override) {
        return override.pct;
    }
    
    // Fall back to base allocation percentage
    const allocation = allocations.find(a => a.id === allocationId);
    return allocation ? allocation.pct : 0;
}
