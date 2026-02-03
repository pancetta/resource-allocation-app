/**********************
* IndexedDB and Data Access Layer
**********************/

import { addRecord, updateRecord, deleteRecord } from './crudHelper.js';
import { peopleSchema } from '../config/entitySchemas.js';
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
 * @returns {Promise<IDBDatabase>} The database instance
 */
export async function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            const oldVersion = e.oldVersion;
            const transaction = e.target.transaction;
            
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
            
            // Version 3 stores - override tables (created if upgrading from v1 or v2)
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
            
            // Version 4 migration - rename override tables and migrate default values
            if (oldVersion < 4 && oldVersion >= 3) {
                // Rename fteOverrides to fteValues
                if (db.objectStoreNames.contains("fteOverrides")) {
                    // Create new store
                    const fteValuesStore = db.createObjectStore("fteValues", { keyPath: "id", autoIncrement: true });
                    
                    // Copy data from old store
                    const oldFteStore = transaction.objectStore("fteOverrides");
                    const fteRequest = oldFteStore.getAll();
                    
                    fteRequest.onsuccess = () => {
                        const records = fteRequest.result;
                        records.forEach(record => {
                            fteValuesStore.add(record);
                        });
                    };
                }
                
                // Rename projectBudgetOverrides to budgetValues
                if (db.objectStoreNames.contains("projectBudgetOverrides")) {
                    // Create new store
                    const budgetValuesStore = db.createObjectStore("budgetValues", { keyPath: "id", autoIncrement: true });
                    
                    // Copy data from old store
                    const oldBudgetStore = transaction.objectStore("projectBudgetOverrides");
                    const budgetRequest = oldBudgetStore.getAll();
                    
                    budgetRequest.onsuccess = () => {
                        const records = budgetRequest.result;
                        records.forEach(record => {
                            budgetValuesStore.add(record);
                        });
                    };
                }
                
                // Migrate default FTE values from people table to fteValues
                const peopleStore = transaction.objectStore("people");
                const peopleRequest = peopleStore.getAll();
                
                peopleRequest.onsuccess = () => {
                    const people = peopleRequest.result;
                    const fteValuesStore = transaction.objectStore("fteValues");
                    
                    people.forEach(person => {
                        if (person.fte !== undefined && person.fte !== null) {
                            // Create an initial FTE value entry
                            fteValuesStore.add({
                                personId: person.id,
                                fte: person.fte,
                                startMonth: DEFAULT_START_MONTH, // Use a reasonable start date
                                endMonth: null // Open-ended
                            });
                            
                            // Remove fte field from person
                            delete person.fte;
                            peopleStore.put(person);
                        }
                    });
                };
                
                // Migrate default plannedPM values from projects table to budgetValues
                const projectsStore = transaction.objectStore("projects");
                const projectsRequest = projectsStore.getAll();
                
                projectsRequest.onsuccess = () => {
                    const projects = projectsRequest.result;
                    const budgetValuesStore = transaction.objectStore("budgetValues");
                    
                    projects.forEach(project => {
                        if (project.plannedPM !== undefined && project.plannedPM !== null) {
                            // Create an initial budget value entry
                            budgetValuesStore.add({
                                projectId: project.id,
                                plannedPM: project.plannedPM,
                                startMonth: DEFAULT_START_MONTH, // Use a reasonable start date
                                endMonth: null // Open-ended
                            });
                            
                            // Remove plannedPM field from project
                            delete project.plannedPM;
                            projectsStore.put(project);
                        }
                    });
                };
            } else if (oldVersion < 4 && oldVersion < 3) {
                // Direct upgrade from v1/v2 to v4 - create new stores directly
                if (!db.objectStoreNames.contains("fteValues")) {
                    db.createObjectStore("fteValues", { keyPath: "id", autoIncrement: true });
                }
                if (!db.objectStoreNames.contains("budgetValues")) {
                    db.createObjectStore("budgetValues", { keyPath: "id", autoIncrement: true });
                }
                if (!db.objectStoreNames.contains("allocationOverrides")) {
                    db.createObjectStore("allocationOverrides", { keyPath: "id", autoIncrement: true });
                }
                
                // Migrate default values even when upgrading from v1/v2
                const peopleStore = transaction.objectStore("people");
                const peopleRequest = peopleStore.getAll();
                
                peopleRequest.onsuccess = () => {
                    const people = peopleRequest.result;
                    const fteValuesStore = transaction.objectStore("fteValues");
                    
                    people.forEach(person => {
                        if (person.fte !== undefined && person.fte !== null) {
                            fteValuesStore.add({
                                personId: person.id,
                                fte: person.fte,
                                startMonth: DEFAULT_START_MONTH,
                                endMonth: null
                            });
                            delete person.fte;
                            peopleStore.put(person);
                        }
                    });
                };
                
                const projectsStore = transaction.objectStore("projects");
                const projectsRequest = projectsStore.getAll();
                
                projectsRequest.onsuccess = () => {
                    const projects = projectsRequest.result;
                    const budgetValuesStore = transaction.objectStore("budgetValues");
                    
                    projects.forEach(project => {
                        if (project.plannedPM !== undefined && project.plannedPM !== null) {
                            budgetValuesStore.add({
                                projectId: project.id,
                                plannedPM: project.plannedPM,
                                startMonth: DEFAULT_START_MONTH,
                                endMonth: null
                            });
                            delete project.plannedPM;
                            projectsStore.put(project);
                        }
                    });
                };
            }
            
            // Version 5 migration - add type field to people AND convert allocations from pct to pm
            if (oldVersion < 5) {
                const peopleStore = transaction.objectStore("people");
                const peopleRequest = peopleStore.getAll();
                
                peopleRequest.onsuccess = () => {
                    const people = peopleRequest.result;
                    const defaults = peopleSchema.getDefaults();
                    
                    people.forEach(person => {
                        // Add type field if it doesn't exist
                        if (!person.type) {
                            person.type = defaults.type;
                            peopleStore.put(person);
                        }
                    });
                };
                
                // Also convert allocations from pct to pm
                const allocationsStore = transaction.objectStore("defaultAllocations");
                const fteValuesStore = transaction.objectStore("fteValues");
                
                // Get all data needed for conversion
                const allocationsRequest = allocationsStore.getAll();
                const fteValuesRequest = fteValuesStore.getAll();
                
                allocationsRequest.onsuccess = () => {
                    fteValuesRequest.onsuccess = () => {
                        const allocations = allocationsRequest.result;
                        const fteValues = fteValuesRequest.result;
                        
                        allocations.forEach(allocation => {
                            if (allocation.pct !== undefined && allocation.pct !== null) {
                                // Find effective FTE for this person at allocation start
                                let fte = 1; // default
                                const applicableFteValues = fteValues.filter(fv => 
                                    fv.personId === allocation.personId &&
                                    fv.startMonth <= allocation.startMonth &&
                                    (fv.endMonth === null || fv.endMonth >= allocation.startMonth)
                                );
                                
                                if (applicableFteValues.length > 0) {
                                    // Use the most recent one
                                    applicableFteValues.sort((a, b) => b.startMonth.localeCompare(a.startMonth));
                                    fte = applicableFteValues[0].fte;
                                }
                                
                                // Convert pct to pm: pm = pct * fte
                                allocation.pm = allocation.pct * fte;
                                delete allocation.pct;
                                
                                allocationsStore.put(allocation);
                            }
                        });
                        
                        // Also convert allocation overrides
                        if (db.objectStoreNames.contains("allocationOverrides")) {
                            const overridesStore = transaction.objectStore("allocationOverrides");
                            const overridesRequest = overridesStore.getAll();
                            
                            overridesRequest.onsuccess = () => {
                                const overrides = overridesRequest.result;
                                
                                overrides.forEach(override => {
                                    if (override.pct !== undefined && override.pct !== null) {
                                        // For overrides, find the allocation to get the person
                                        const allocationId = override.allocationId;
                                        const allocRequest = allocationsStore.get(allocationId);
                                        
                                        allocRequest.onsuccess = () => {
                                            const allocation = allocRequest.result;
                                            if (allocation) {
                                                // Find effective FTE for this person at override month
                                                let fte = 1;
                                                const applicableFteValues = fteValues.filter(fv => 
                                                    fv.personId === allocation.personId &&
                                                    fv.startMonth <= override.month &&
                                                    (fv.endMonth === null || fv.endMonth >= override.month)
                                                );
                                                
                                                if (applicableFteValues.length > 0) {
                                                    applicableFteValues.sort((a, b) => b.startMonth.localeCompare(a.startMonth));
                                                    fte = applicableFteValues[0].fte;
                                                }
                                                
                                                // Convert pct to pm
                                                override.pm = override.pct * fte;
                                                delete override.pct;
                                                
                                                overridesStore.put(override);
                                            }
                                        };
                                    }
                                });
                            };
                        }
                    };
                };
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

/**
 * Convert allocation from old pct format to new pm format
 * @param {Object} allocation - Allocation object (may have pct or pm)
 * @param {Array} fteValues - Array of FTE value objects for conversion
 * @returns {Object} - Allocation with pm field
 */
function convertAllocationToPm(allocation, fteValues) {
    // If already has pm, return as-is
    if (allocation.pm !== undefined && allocation.pm !== null) {
        return allocation;
    }
    
    // If has pct, convert to pm
    if (allocation.pct !== undefined && allocation.pct !== null) {
        // Find effective FTE for this person at allocation start
        let fte = 1; // default
        const applicableFteValues = fteValues.filter(fv => 
            fv.personId === allocation.personId &&
            fv.startMonth <= allocation.startMonth &&
            (fv.endMonth === null || fv.endMonth >= allocation.startMonth)
        );
        
        if (applicableFteValues.length > 0) {
            // Use the most recent one
            applicableFteValues.sort((a, b) => b.startMonth.localeCompare(a.startMonth));
            fte = applicableFteValues[0].fte;
        }
        
        // Convert pct to pm: pm = pct * fte
        const converted = { ...allocation };
        converted.pm = allocation.pct * fte;
        delete converted.pct;
        return converted;
    }
    
    // Neither pct nor pm - set pm to 0 to avoid NaN
    return { ...allocation, pm: 0 };
}

/**
 * Convert allocation override from old pct format to new pm format
 * @param {Object} override - Override object (may have pct or pm)
 * @param {Array} fteValues - Array of FTE value objects for conversion
 * @param {Array} allocations - Array of allocation objects to find person
 * @returns {Object} - Override with pm field
 */
function convertOverrideToPm(override, fteValues, allocations) {
    // If already has pm, return as-is
    if (override.pm !== undefined && override.pm !== null) {
        return override;
    }
    
    // If has pct, convert to pm
    if (override.pct !== undefined && override.pct !== null) {
        // Find the allocation to get the person
        const allocation = allocations.find(a => a.id === override.allocationId);
        if (allocation) {
            // Find effective FTE for this person at override month
            let fte = 1; // default
            const applicableFteValues = fteValues.filter(fv => 
                fv.personId === allocation.personId &&
                fv.startMonth <= override.month &&
                (fv.endMonth === null || fv.endMonth >= override.month)
            );
            
            if (applicableFteValues.length > 0) {
                applicableFteValues.sort((a, b) => b.startMonth.localeCompare(a.startMonth));
                fte = applicableFteValues[0].fte;
            }
            
            // Convert pct to pm
            const converted = { ...override };
            converted.pm = override.pct * fte;
            delete converted.pct;
            return converted;
        }
    }
    
    // Neither pct nor pm - set pm to 0 to avoid NaN
    return { ...override, pm: 0 };
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
        allocationOverrides = [],
        // Support old format for backward compatibility
        fteOverrides = [],
        projectBudgetOverrides = []
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
    // Support both new and old format
    const fteData = fteValues.length > 0 ? fteValues : fteOverrides;
    if (fteData && Array.isArray(fteData)) {
        for (const value of fteData) {
            await addFteValue(value);
        }
    }
    
    // Import budget values (support both new and old format)
    const budgetData = budgetValues.length > 0 ? budgetValues : projectBudgetOverrides;
    if (budgetData && Array.isArray(budgetData)) {
        for (const value of budgetData) {
            await addBudgetValue(value);
        }
    }
    
    // Import allocations (convert from pct to pm if needed)
    if (allocations && Array.isArray(allocations)) {
        // Get FTE values for conversion
        const currentFteValues = await getFteValues();
        
        for (const allocation of allocations) {
            // Convert old pct format to new pm format
            const converted = convertAllocationToPm(allocation, currentFteValues);
            await addAllocation(converted);
        }
    }
    
    // Import allocation overrides (convert from pct to pm if needed)
    if (allocationOverrides && Array.isArray(allocationOverrides)) {
        // Get current data for conversion
        const currentFteValues = await getFteValues();
        const currentAllocations = await getAllocations();
        
        for (const override of allocationOverrides) {
            // Convert old pct format to new pm format
            const converted = convertOverrideToPm(override, currentFteValues, currentAllocations);
            await addAllocationOverride(converted);
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
