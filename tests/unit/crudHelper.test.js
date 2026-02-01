import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { performTransaction, addRecord, updateRecord, deleteRecord } from '../../js/data/crudHelper.js';

describe('crudHelper', () => {
    let mockDb;
    let mockStore;

    beforeEach(() => {
        // Create mock store
        mockStore = {
            add: vi.fn(),
            put: vi.fn(),
            delete: vi.fn()
        };

        // Create mock database with transaction support
        mockDb = {
            transaction: vi.fn((storeName, mode) => {
                // Return a new transaction object for each call
                return {
                    objectStore: vi.fn().mockReturnValue(mockStore),
                    oncomplete: null,
                    onerror: null
                };
            })
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('performTransaction', () => {
        it('should call add operation on the store', async () => {
            const invalidateCache = vi.fn();
            const testData = { id: '1', name: 'Test' };

            const promise = performTransaction(mockDb, 'testStore', 'add', testData, invalidateCache);

            // The transaction's oncomplete should be set now, trigger it immediately
            const txs = mockDb.transaction.mock.results;
            const lastTx = txs[txs.length - 1].value;
            expect(lastTx.oncomplete).not.toBeNull();
            lastTx.oncomplete();

            await promise;

            expect(mockStore.add).toHaveBeenCalledWith(testData);
            expect(invalidateCache).toHaveBeenCalled();
        });

        it('should call put operation on the store', async () => {
            const invalidateCache = vi.fn();
            const testData = { id: '1', name: 'Updated' };

            const promise = performTransaction(mockDb, 'testStore', 'put', testData, invalidateCache);

            const txs = mockDb.transaction.mock.results;
            const lastTx = txs[txs.length - 1].value;
            lastTx.oncomplete();

            await promise;

            expect(mockStore.put).toHaveBeenCalledWith(testData);
            expect(invalidateCache).toHaveBeenCalled();
        });

        it('should call delete operation on the store', async () => {
            const invalidateCache = vi.fn();
            const testId = '1';

            const promise = performTransaction(mockDb, 'testStore', 'delete', testId, invalidateCache);

            const txs = mockDb.transaction.mock.results;
            const lastTx = txs[txs.length - 1].value;
            lastTx.oncomplete();

            await promise;

            expect(mockStore.delete).toHaveBeenCalledWith(testId);
            expect(invalidateCache).toHaveBeenCalled();
        });

        it('should create transaction with correct store name and mode', async () => {
            const invalidateCache = vi.fn();

            const promise = performTransaction(mockDb, 'myStore', 'add', {}, invalidateCache);

            const txs = mockDb.transaction.mock.results;
            const lastTx = txs[txs.length - 1].value;
            lastTx.oncomplete();

            await promise;

            expect(mockDb.transaction).toHaveBeenCalledWith('myStore', 'readwrite');
        });

        it('should reject on unknown operation', async () => {
            const invalidateCache = vi.fn();

            const promise = performTransaction(mockDb, 'testStore', 'unknown', {}, invalidateCache);

            await expect(promise).rejects.toThrow('Unknown operation');
        });

        it('should handle transaction errors', async () => {
            const invalidateCache = vi.fn();

            const promise = performTransaction(mockDb, 'testStore', 'add', {}, invalidateCache);

            const txs = mockDb.transaction.mock.results;
            const lastTx = txs[txs.length - 1].value;
            lastTx.error = new Error('Transaction failed');
            lastTx.onerror();

            await expect(promise).rejects.toThrow('Transaction failed');
        });

        it('should handle try-catch errors', async () => {
            mockDb.transaction.mockImplementation(() => {
                throw new Error('Transaction setup failed');
            });

            const invalidateCache = vi.fn();

            await expect(
                performTransaction(mockDb, 'testStore', 'add', {}, invalidateCache)
            ).rejects.toThrow('Transaction setup failed');
        });
    });

    describe('addRecord', () => {
        it('should call performTransaction with add operation', async () => {
            const invalidateCache = vi.fn();
            const testData = { id: '1' };

            const promise = addRecord(mockDb, 'people', testData, invalidateCache);

            const txs = mockDb.transaction.mock.results;
            const lastTx = txs[txs.length - 1].value;
            lastTx.oncomplete();

            await promise;

            expect(mockStore.add).toHaveBeenCalledWith(testData);
            expect(invalidateCache).toHaveBeenCalled();
        });

        it('should work with different store names', async () => {
            const invalidateCache = vi.fn();
            const testData = { id: 'proj001' };

            const promise = addRecord(mockDb, 'projects', testData, invalidateCache);

            const txs = mockDb.transaction.mock.results;
            const lastTx = txs[txs.length - 1].value;
            lastTx.oncomplete();

            await promise;

            expect(mockDb.transaction).toHaveBeenCalledWith('projects', 'readwrite');
        });
    });

    describe('updateRecord', () => {
        it('should call performTransaction with put operation', async () => {
            const invalidateCache = vi.fn();
            const testData = { id: '1', name: 'Updated' };

            const promise = updateRecord(mockDb, 'people', testData, invalidateCache);

            const txs = mockDb.transaction.mock.results;
            const lastTx = txs[txs.length - 1].value;
            lastTx.oncomplete();

            await promise;

            expect(mockStore.put).toHaveBeenCalledWith(testData);
            expect(invalidateCache).toHaveBeenCalled();
        });

        it('should work with multiple updates in sequence', async () => {
            const invalidateCache = vi.fn();
            const data1 = { id: '1', name: 'First' };
            const data2 = { id: '2', name: 'Second' };

            const promise1 = updateRecord(mockDb, 'people', data1, invalidateCache);
            const promise2 = updateRecord(mockDb, 'people', data2, invalidateCache);

            // Trigger completion for both transactions
            const txs = mockDb.transaction.mock.results;
            txs[txs.length - 2].value.oncomplete(); // First transaction
            txs[txs.length - 1].value.oncomplete(); // Second transaction

            await Promise.all([promise1, promise2]);

            expect(mockStore.put).toHaveBeenCalledWith(data1);
            expect(mockStore.put).toHaveBeenCalledWith(data2);
        });
    });

    describe('deleteRecord', () => {
        it('should call performTransaction with delete operation', async () => {
            const invalidateCache = vi.fn();
            const testId = '1';

            const promise = deleteRecord(mockDb, 'people', testId, invalidateCache);

            const txs = mockDb.transaction.mock.results;
            const lastTx = txs[txs.length - 1].value;
            lastTx.oncomplete();

            await promise;

            expect(mockStore.delete).toHaveBeenCalledWith(testId);
        });

        it('should work with numeric IDs', async () => {
            const invalidateCache = vi.fn();
            const testId = 42;

            const promise = deleteRecord(mockDb, 'defaultAllocations', testId, invalidateCache);

            const txs = mockDb.transaction.mock.results;
            const lastTx = txs[txs.length - 1].value;
            lastTx.oncomplete();

            await promise;

            expect(mockStore.delete).toHaveBeenCalledWith(42);
        });

        it('should work with string IDs', async () => {
            const invalidateCache = vi.fn();
            const testId = 'person-123';

            const promise = deleteRecord(mockDb, 'people', testId, invalidateCache);

            const txs = mockDb.transaction.mock.results;
            const lastTx = txs[txs.length - 1].value;
            lastTx.oncomplete();

            await promise;

            expect(mockStore.delete).toHaveBeenCalledWith('person-123');
        });
    });

    describe('cache invalidation', () => {
        it('should call invalidateCache callback on successful add', async () => {
            const invalidateCache = vi.fn();

            const promise = addRecord(mockDb, 'people', {}, invalidateCache);

            const txs = mockDb.transaction.mock.results;
            const lastTx = txs[txs.length - 1].value;
            lastTx.oncomplete();

            await promise;

            expect(invalidateCache).toHaveBeenCalledTimes(1);
        });

        it('should call invalidateCache callback on successful update', async () => {
            const invalidateCache = vi.fn();

            const promise = updateRecord(mockDb, 'projects', {}, invalidateCache);

            const txs = mockDb.transaction.mock.results;
            const lastTx = txs[txs.length - 1].value;
            lastTx.oncomplete();

            await promise;

            expect(invalidateCache).toHaveBeenCalledTimes(1);
        });

        it('should call invalidateCache callback on successful delete', async () => {
            const invalidateCache = vi.fn();

            const promise = deleteRecord(mockDb, 'defaultAllocations', '1', invalidateCache);

            const txs = mockDb.transaction.mock.results;
            const lastTx = txs[txs.length - 1].value;
            lastTx.oncomplete();

            await promise;

            expect(invalidateCache).toHaveBeenCalledTimes(1);
        });

        it('should not call invalidateCache on transaction error', async () => {
            const invalidateCache = vi.fn();

            const promise = addRecord(mockDb, 'people', {}, invalidateCache);

            const txs = mockDb.transaction.mock.results;
            const lastTx = txs[txs.length - 1].value;
            lastTx.error = new Error('Failed');
            lastTx.onerror();

            try {
                await promise;
            } catch (e) {
                // Expected to fail
            }

            expect(invalidateCache).not.toHaveBeenCalled();
        });
    });
});
