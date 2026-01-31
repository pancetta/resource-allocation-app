/**********************
* IndexedDB and Data Access Layer
**********************/

const DB_NAME = "resource-planning";
const DB_VERSION = 2;
let db;

// Simple cache to reduce IndexedDB calls
const cache = {
    people: null,
    projects: null,
    defaultAllocations: null
};

// Cache invalidation flags
let cacheValid = {
    people: false,
    projects: false,
    defaultAllocations: false
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
        cache.people = null;
        cache.projects = null;
        cache.defaultAllocations = null;
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
            if (!db.objectStoreNames.contains("people")) {
                db.createObjectStore("people", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("projects")) {
                db.createObjectStore("projects", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("defaultAllocations")) {
                db.createObjectStore("defaultAllocations", { keyPath: "id", autoIncrement: true });
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
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction("people", "readwrite");
            tx.objectStore("people").add(p);
            tx.oncomplete = () => {
                invalidateCache("people");
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Update an existing person in the database
 * @param {Object} p - Person object with updated properties
 * @returns {Promise<void>}
 */
export async function updatePerson(p) {
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction("people", "readwrite");
            tx.objectStore("people").put(p);
            tx.oncomplete = () => {
                invalidateCache("people");
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Delete a person from the database
 * @param {string} id - Person ID
 * @returns {Promise<void>}
 */
export async function deletePerson(id) {
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction("people", "readwrite");
            tx.objectStore("people").delete(id);
            tx.oncomplete = () => {
                invalidateCache("people");
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        } catch (error) {
            reject(error);
        }
    });
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
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction("projects", "readwrite");
            tx.objectStore("projects").add(p);
            tx.oncomplete = () => {
                invalidateCache("projects");
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Update an existing project in the database
 * @param {Object} p - Project object with updated properties
 * @returns {Promise<void>}
 */
export async function updateProject(p) {
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction("projects", "readwrite");
            tx.objectStore("projects").put(p);
            tx.oncomplete = () => {
                invalidateCache("projects");
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Delete a project from the database
 * @param {string} id - Project ID
 * @returns {Promise<void>}
 */
export async function deleteProject(id) {
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction("projects", "readwrite");
            tx.objectStore("projects").delete(id);
            tx.oncomplete = () => {
                invalidateCache("projects");
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        } catch (error) {
            reject(error);
        }
    });
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
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction("defaultAllocations", "readwrite");
            tx.objectStore("defaultAllocations").add(a);
            tx.oncomplete = () => {
                invalidateCache("defaultAllocations");
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Update an existing allocation in the database
 * @param {Object} a - Allocation object with updated properties
 * @returns {Promise<void>}
 */
export async function updateAllocation(a) {
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction("defaultAllocations", "readwrite");
            tx.objectStore("defaultAllocations").put(a);
            tx.oncomplete = () => {
                invalidateCache("defaultAllocations");
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Delete an allocation from the database
 * @param {number} id - Allocation ID
 * @returns {Promise<void>}
 */
export async function deleteAllocation(id) {
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction("defaultAllocations", "readwrite");
            tx.objectStore("defaultAllocations").delete(id);
            tx.oncomplete = () => {
                invalidateCache("defaultAllocations");
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        } catch (error) {
            reject(error);
        }
    });
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
    
    return {
        version: "1.0",
        exportDate: new Date().toISOString(),
        data: {
            people,
            projects,
            allocations
        }
    };
}

// Import all data (clears existing data first)
export async function importAllData(importedData) {
    if (!importedData || !importedData.data) {
        throw new Error("Invalid data format");
    }
    
    const { people, projects, allocations } = importedData.data;
    
    // Clear existing data
    const tx = db.transaction(["people", "projects", "defaultAllocations"], "readwrite");
    await tx.objectStore("people").clear();
    await tx.objectStore("projects").clear();
    await tx.objectStore("defaultAllocations").clear();
    
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
