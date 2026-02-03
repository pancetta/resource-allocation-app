import { describe, it, expect, beforeEach } from 'vitest';
import {
  openDatabase,
  addPerson,
  addProject,
  addAllocation,
  deletePerson,
  exportAllData,
  importAllData,
  createBackup,
  getAllBackups,
  restoreBackup,
  deleteBackup,
  getPeople,
  getProjects,
  getAllocations,
  getBudgetValues
} from '../../js/data/database.js';

describe('Data Export/Import and Backup', () => {
  beforeEach(async () => {
    // Open database and clear localStorage before each test
    await openDatabase();
    localStorage.clear();
  });

  describe('Export/Import', () => {
    it('should export empty data', async () => {
      const exported = await exportAllData();
      
      expect(exported).toHaveProperty('version');
      expect(exported).toHaveProperty('exportDate');
      expect(exported).toHaveProperty('data');
      expect(exported.data.people).toEqual([]);
      expect(exported.data.projects).toEqual([]);
      expect(exported.data.allocations).toEqual([]);
    });

    it('should export all data correctly', async () => {
      // Add test data
      await addPerson({ id: 'p001', name: 'John Doe', fte: 1, active: true });
      await addProject({ id: 'proj001', name: 'Project A', plannedPM: 2.5 });
      await addAllocation({
        personId: 'p001',
        projectId: 'proj001',
        pm: 0.5,
        startMonth: '2025-01',
        endMonth: '2025-12'
      });

      const exported = await exportAllData();
      
      expect(exported.data.people).toHaveLength(1);
      expect(exported.data.people[0].name).toBe('John Doe');
      expect(exported.data.projects).toHaveLength(1);
      expect(exported.data.projects[0].name).toBe('Project A');
      expect(exported.data.allocations).toHaveLength(1);
      expect(exported.data.allocations[0].pm).toBe(0.5);
    });

    it('should import data correctly', async () => {
      // Create test export data
      const testData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        data: {
          people: [{ id: 'p001', name: 'Jane Smith', fte: 0.8, active: true }],
          projects: [{ id: 'proj001', name: 'Project B', plannedPM: 3 }],
          allocations: [{
            personId: 'p001',
            projectId: 'proj001',
            pm: 1,
            startMonth: '2025-02',
            endMonth: ''
          }]
        }
      };

      await importAllData(testData);

      const people = await getPeople();
      const projects = await getProjects();
      const allocations = await getAllocations();

      expect(people).toHaveLength(1);
      expect(people[0].name).toBe('Jane Smith');
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Project B');
      expect(allocations).toHaveLength(1);
      expect(allocations[0].pm).toBe(1);
    });

    it('should replace existing data on import', async () => {
      // Add initial data
      await addPerson({ id: 'p001', name: 'Old Person', fte: 1, active: true });
      
      // Import new data
      const testData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        data: {
          people: [{ id: 'p002', name: 'New Person', fte: 0.5, active: true }],
          projects: [],
          allocations: []
        }
      };

      await importAllData(testData);

      const people = await getPeople();
      expect(people).toHaveLength(1);
      expect(people[0].id).toBe('p002');
      expect(people[0].name).toBe('New Person');
    });

    it('should throw error on invalid import data', async () => {
      await expect(importAllData(null)).rejects.toThrow("Invalid data format");
      await expect(importAllData({})).rejects.toThrow("Invalid data format");
    });
  });

  describe('Backup/Restore', () => {
    it('should create a backup', async () => {
      await addPerson({ id: 'p001', name: 'Test Person', fte: 1, active: true });
      
      const backupKey = await createBackup();
      
      expect(backupKey).toBeTruthy();
      expect(backupKey).toContain('resource-planning-backup-');
      
      const backupData = localStorage.getItem(backupKey);
      expect(backupData).toBeTruthy();
      
      const parsed = JSON.parse(backupData);
      expect(parsed.data.people).toHaveLength(1);
    });

    it('should list all backups', async () => {
      await addPerson({ id: 'p001', name: 'Test', fte: 1, active: true });
      
      await createBackup();
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await createBackup();
      
      const backups = getAllBackups();
      expect(backups.length).toBeGreaterThanOrEqual(2);
      expect(backups[0]).toHaveProperty('key');
      expect(backups[0]).toHaveProperty('timestamp');
      expect(backups[0]).toHaveProperty('date');
      
      // Should be sorted by timestamp descending
      if (backups.length >= 2) {
        expect(backups[0].timestamp).toBeGreaterThan(backups[1].timestamp);
      }
    });

    it('should restore from backup', async () => {
      // Create initial data and backup
      await addPerson({ id: 'p001', name: 'Original', fte: 1, active: true });
      await addPerson({ id: 'p002', name: 'Another', fte: 1, active: true });
      const backupKey = await createBackup();
      
      // Verify we have 2 people initially
      let people = await getPeople();
      expect(people).toHaveLength(2);
      
      // Delete one person to change the data
      await deletePerson('p002');
      
      // Wait for the delete to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify we now have 1 person
      people = await getPeople();
      expect(people).toHaveLength(1);
      expect(people[0].id).toBe('p001');
      
      // Restore from backup
      await restoreBackup(backupKey);
      
      // Wait for IndexedDB to process the restore operation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verify both people are restored
      people = await getPeople();
      expect(people).toHaveLength(2);
      expect(people.find(p => p.id === 'p001')).toBeTruthy();
      expect(people.find(p => p.id === 'p002')).toBeTruthy();
    });

    it('should delete a backup', async () => {
      await addPerson({ id: 'p001', name: 'Test', fte: 1, active: true });
      const backupKey = await createBackup();
      
      let backups = getAllBackups();
      const initialCount = backups.length;
      
      deleteBackup(backupKey);
      
      backups = getAllBackups();
      expect(backups.length).toBe(initialCount - 1);
      expect(localStorage.getItem(backupKey)).toBeNull();
    });

    it('should limit number of backups to MAX_BACKUPS', async () => {
      await addPerson({ id: 'p001', name: 'Test', fte: 1, active: true });
      
      // Create more than MAX_BACKUPS (10) backups
      for (let i = 0; i < 12; i++) {
        await createBackup();
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const backups = getAllBackups();
      expect(backups.length).toBeLessThanOrEqual(10);
    });

    it('should throw error when restoring non-existent backup', async () => {
      await expect(restoreBackup('non-existent-key')).rejects.toThrow("Backup not found");
    });
  });

  describe('Data Integrity', () => {
    it('should preserve all data fields during export/import cycle', async () => {
      // Add complex data
      await addPerson({ id: 'p001', name: 'Person One', fte: 0.75, active: true });
      await addPerson({ id: 'p002', name: 'Person Two', fte: 1, active: false });
      await addProject({ id: 'proj001', name: 'Project Alpha', plannedPM: 5.5 });
      await addAllocation({
        personId: 'p001',
        projectId: 'proj001',
        pm: 0.6,
        startMonth: '2025-03',
        endMonth: '2025-09'
      });
      
      // Export
      const exported = await exportAllData();
      
      // Clear and reimport
      await importAllData({
        version: "1.0",
        exportDate: new Date().toISOString(),
        data: { people: [], projects: [], allocations: [] }
      });
      await importAllData(exported);
      
      // Verify all data
      const people = await getPeople();
      const projects = await getProjects();
      const allocations = await getAllocations();
      const budgetValues = await getBudgetValues();
      
      expect(people).toHaveLength(2);
      expect(people.find(p => p.id === 'p001').fte).toBe(0.75);
      expect(people.find(p => p.id === 'p002').active).toBe(false);
      // plannedPM should be migrated to budgetValues
      expect(projects[0].plannedPM).toBeUndefined();
      expect(budgetValues[0].plannedPM).toBe(5.5);
      expect(budgetValues[0].projectId).toBe('proj001');
      expect(allocations[0].pm).toBe(0.6);
      expect(allocations[0].endMonth).toBe('2025-09');
    });
  });

  describe('Auto-Prepared JSON Backup', () => {
    it('should create auto-prepared JSON backup when creating backup', async () => {
      const { getAutoPreparedBackup } = await import('../../js/data/database.js');
      
      await addPerson({ id: 'p001', name: 'Test Person', fte: 1, active: true });
      await createBackup();
      
      const autoBackup = getAutoPreparedBackup();
      expect(autoBackup).toBeTruthy();
      expect(autoBackup).toHaveProperty('data');
      expect(autoBackup).toHaveProperty('preparedAt');
      expect(autoBackup).toHaveProperty('preparedDate');
      expect(autoBackup.data.data.people).toHaveLength(1);
    });

    it('should update auto-prepared backup on subsequent backups', async () => {
      const { getAutoPreparedBackup } = await import('../../js/data/database.js');
      
      await addPerson({ id: 'p001', name: 'Person 1', fte: 1, active: true });
      await createBackup();
      
      const firstBackup = getAutoPreparedBackup();
      const firstTimestamp = firstBackup.preparedAt;
      
      // Wait a bit and create another backup
      await new Promise(resolve => setTimeout(resolve, 10));
      await addPerson({ id: 'p002', name: 'Person 2', fte: 1, active: true });
      await createBackup();
      
      const secondBackup = getAutoPreparedBackup();
      expect(secondBackup.preparedAt).toBeGreaterThan(firstTimestamp);
      expect(secondBackup.data.data.people).toHaveLength(2);
    });

    it('should return null when no auto-prepared backup exists', async () => {
      const { getAutoPreparedBackup } = await import('../../js/data/database.js');
      
      // Clear localStorage first
      localStorage.clear();
      
      const autoBackup = getAutoPreparedBackup();
      expect(autoBackup).toBeNull();
    });
  });
});
