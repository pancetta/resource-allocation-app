// Test setup file
import 'fake-indexeddb/auto';

// Reset IndexedDB before each test
beforeEach(() => {
  // Clear all databases
  indexedDB = new IDBFactory();
});
