/**********************
* IndexedDB and Data Access Layer
**********************/

const DB_NAME = "resource-planning";
const DB_VERSION = 2;
let db;

// Open/initialize database
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

// Generic getAll function
function getAll(storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// People CRUD
export async function getPeople() {
    return getAll("people");
}

export async function addPerson(p) {
    const tx = db.transaction("people", "readwrite");
    tx.objectStore("people").add(p);
    return tx.complete;
}

export async function updatePerson(p) {
    const tx = db.transaction("people", "readwrite");
    tx.objectStore("people").put(p);
    return tx.complete;
}

export async function deletePerson(id) {
    return db.transaction("people", "readwrite").objectStore("people").delete(id);
}

// Projects CRUD
export async function getProjects() {
    return getAll("projects");
}

export async function addProject(p) {
    const tx = db.transaction("projects", "readwrite");
    tx.objectStore("projects").add(p);
    return tx.complete;
}

export async function updateProject(p) {
    const tx = db.transaction("projects", "readwrite");
    tx.objectStore("projects").put(p);
    return tx.complete;
}

export async function deleteProject(id) {
    return db.transaction("projects", "readwrite").objectStore("projects").delete(id);
}

// Allocations CRUD
export async function getAllocations() {
    return getAll("defaultAllocations");
}

export async function addAllocation(a) {
    const tx = db.transaction("defaultAllocations", "readwrite").objectStore("defaultAllocations").add(a);
    return tx.complete;
}

export async function updateAllocation(a) {
    const tx = db.transaction("defaultAllocations", "readwrite").objectStore("defaultAllocations").put(a);
    return tx.complete;
}

export async function deleteAllocation(id) {
    return db.transaction("defaultAllocations", "readwrite").objectStore("defaultAllocations").delete(id);
}

// Auto-generate IDs
export async function generatePersonId() {
    const people = await getPeople();
    const maxNum = people.reduce((max, p) => {
        const m = p.id.match(/^p(\d+)$/);
        return m ? Math.max(max, parseInt(m[1])) : max;
    }, 0);
    return `p${String(maxNum + 1).padStart(3, '0')}`;
}

export async function generateProjectId() {
    const projects = await getProjects();
    const maxNum = projects.reduce((max, p) => {
        const m = p.id.match(/^proj(\d+)$/);
        return m ? Math.max(max, parseInt(m[1])) : max;
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

export async function createBackup() {
    const data = await exportAllData();
    const timestamp = Date.now();
    const backupKey = `${BACKUP_KEY_PREFIX}${timestamp}`;
    
    try {
        localStorage.setItem(backupKey, JSON.stringify(data));
        
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
