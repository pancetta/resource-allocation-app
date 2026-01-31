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
