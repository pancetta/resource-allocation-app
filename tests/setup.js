// Test setup file
import 'fake-indexeddb/auto';

// Mock localStorage for testing
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = String(value);
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  },
  key(index) {
    const keys = Object.keys(this.data);
    return keys[index] || null;
  },
  get length() {
    return Object.keys(this.data).length;
  }
};

// Reset IndexedDB and localStorage before each test
beforeEach(() => {
  // Clear all databases
  indexedDB = new IDBFactory();
  
  // Clear localStorage
  localStorage.clear();
});
