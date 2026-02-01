/**
 * CRUD Helper - Centralized database transaction logic
 * Eliminates duplication for add, update, delete operations across all stores
 */

/**
 * Execute a generic CRUD operation on an IndexedDB object store
 * @param {IDBDatabase} db - The database instance
 * @param {string} storeName - The object store name
 * @param {string} operation - The operation type: 'add', 'put', or 'delete'
 * @param {*} data - The data to add/put, or the key to delete
 * @param {Function} invalidateCache - Callback to invalidate cache for this store
 * @returns {Promise<void>}
 */
export function performTransaction(db, storeName, operation, data, invalidateCache) {
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);

            // Execute the appropriate operation
            if (operation === 'add') {
                store.add(data);
            } else if (operation === 'put') {
                store.put(data);
            } else if (operation === 'delete') {
                store.delete(data);
            } else {
                throw new Error(`Unknown operation: ${operation}`);
            }

            // Handle transaction completion
            tx.oncomplete = () => {
                invalidateCache();
                resolve();
            };

            // Handle transaction errors
            tx.onerror = () => reject(tx.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Add a new record to a store
 * @param {IDBDatabase} db - The database instance
 * @param {string} storeName - The object store name
 * @param {Object} data - The object to add
 * @param {Function} invalidateCache - Callback to invalidate cache for this store
 * @returns {Promise<void>}
 */
export function addRecord(db, storeName, data, invalidateCache) {
    return performTransaction(db, storeName, 'add', data, invalidateCache);
}

/**
 * Update an existing record in a store
 * @param {IDBDatabase} db - The database instance
 * @param {string} storeName - The object store name
 * @param {Object} data - The object to update (must have id/key)
 * @param {Function} invalidateCache - Callback to invalidate cache for this store
 * @returns {Promise<void>}
 */
export function updateRecord(db, storeName, data, invalidateCache) {
    return performTransaction(db, storeName, 'put', data, invalidateCache);
}

/**
 * Delete a record from a store
 * @param {IDBDatabase} db - The database instance
 * @param {string} storeName - The object store name
 * @param {*} id - The key/id of the record to delete
 * @param {Function} invalidateCache - Callback to invalidate cache for this store
 * @returns {Promise<void>}
 */
export function deleteRecord(db, storeName, id, invalidateCache) {
    return performTransaction(db, storeName, 'delete', id, invalidateCache);
}
