import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  openDatabase,
  getProjects,
  addProject,
  deleteProject,
  generateProjectId,
  clearCache,
  isBaseFundingProject,
  getBaseFundingProjects,
  getBaseFundingProjectByType,
  deductsFromBaseFunding,
  initializeBaseFundingProjects
} from '../../js/data/database.js';

describe('Base Funding', () => {
  let dbInstance;
  
  beforeEach(async () => {
    dbInstance = await openDatabase();
    clearCache();
    
    // Clear all projects to start with clean state for each test
    // We need to do this manually to bypass the base funding protection
    const tx = dbInstance.transaction("projects", "readwrite");
    const store = tx.objectStore("projects");
    await store.clear();
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    clearCache();
  });

  describe('Base Funding Project Detection', () => {
    it('should identify base funding projects correctly', async () => {
      const baseFundingProject = {
        id: 'proj001',
        name: 'Base Funding 210',
        isBaseFunding: true,
        baseFundingType: '210'
      };
      const normalProject = {
        id: 'proj002',
        name: 'Normal Project',
        isBaseFunding: false
      };

      await addProject(baseFundingProject);
      await addProject(normalProject);

      const projects = await getProjects();
      const bf = projects.find(p => p.id === 'proj001');
      const normal = projects.find(p => p.id === 'proj002');

      expect(isBaseFundingProject(bf)).toBe(true);
      expect(isBaseFundingProject(normal)).toBe(false);
    });

    it('should get all base funding projects', async () => {
      await addProject({
        id: 'proj001',
        name: 'Base Funding 210',
        isBaseFunding: true,
        baseFundingType: '210'
      });
      await addProject({
        id: 'proj002',
        name: 'Base Funding 220',
        isBaseFunding: true,
        baseFundingType: '220'
      });
      await addProject({
        id: 'proj003',
        name: 'Normal Project',
        isBaseFunding: false
      });

      const baseFundingProjects = await getBaseFundingProjects();
      expect(baseFundingProjects).toHaveLength(2);
      expect(baseFundingProjects.every(p => isBaseFundingProject(p))).toBe(true);
    });

    it('should get base funding project by type', async () => {
      await addProject({
        id: 'proj001',
        name: 'Base Funding 210',
        isBaseFunding: true,
        baseFundingType: '210'
      });
      await addProject({
        id: 'proj002',
        name: 'Base Funding 220',
        isBaseFunding: true,
        baseFundingType: '220'
      });

      const bf210 = await getBaseFundingProjectByType('210');
      const bf220 = await getBaseFundingProjectByType('220');
      const bf230 = await getBaseFundingProjectByType('230');

      expect(bf210).toBeTruthy();
      expect(bf210.id).toBe('proj001');
      expect(bf220).toBeTruthy();
      expect(bf220.id).toBe('proj002');
      expect(bf230).toBeNull();
    });
  });

  describe('Base Funding Deduction Detection', () => {
    it('should identify projects that deduct from base funding', () => {
      const deductingProject = {
        id: 'proj001',
        name: 'Deducting Project',
        deductsFromBaseFunding: true,
        baseFundingTypeId: '210'
      };
      const normalProject = {
        id: 'proj002',
        name: 'Normal Project',
        deductsFromBaseFunding: false
      };

      expect(deductsFromBaseFunding(deductingProject)).toBe(true);
      expect(deductsFromBaseFunding(normalProject)).toBe(false);
    });
  });

  describe('Base Funding Project Protection', () => {
    it('should prevent deletion of base funding projects', async () => {
      await addProject({
        id: 'proj001',
        name: 'Base Funding 210',
        isBaseFunding: true,
        baseFundingType: '210'
      });

      await expect(deleteProject('proj001')).rejects.toThrow('Cannot delete base funding projects');

      const projects = await getProjects();
      expect(projects.some(p => p.id === 'proj001')).toBe(true);
    });

    it('should allow deletion of normal projects', async () => {
      await addProject({
        id: 'proj001',
        name: 'Normal Project',
        isBaseFunding: false
      });

      await deleteProject('proj001');

      const projects = await getProjects();
      expect(projects.some(p => p.id === 'proj001')).toBe(false);
    });
  });

  describe('Base Funding Initialization', () => {
    it('should initialize base funding projects for types 210 and 220', async () => {
      await initializeBaseFundingProjects();

      const baseFundingProjects = await getBaseFundingProjects();
      expect(baseFundingProjects.length).toBeGreaterThanOrEqual(2);

      const bf210 = await getBaseFundingProjectByType('210');
      const bf220 = await getBaseFundingProjectByType('220');

      expect(bf210).toBeTruthy();
      expect(bf210.name).toContain('210');
      expect(bf220).toBeTruthy();
      expect(bf220.name).toContain('220');
    });

    it('should not create duplicate base funding projects', async () => {
      await initializeBaseFundingProjects();
      const countBefore = (await getBaseFundingProjects()).length;

      await initializeBaseFundingProjects();
      const countAfter = (await getBaseFundingProjects()).length;

      expect(countBefore).toBe(countAfter);
    });
  });

  describe('Base Funding Project Structure', () => {
    it('should have correct structure for base funding projects', async () => {
      await initializeBaseFundingProjects();
      
      const bf210 = await getBaseFundingProjectByType('210');
      
      expect(bf210.isBaseFunding).toBe(true);
      expect(bf210.baseFundingType).toBe('210');
      expect(bf210.deductsFromBaseFunding).toBe(false);
      expect(bf210.baseFundingTypeId).toBeNull();
    });

    it('should have correct structure for projects that deduct from base funding', async () => {
      const project = {
        id: 'proj001',
        name: 'Deducting Project',
        isBaseFunding: false,
        deductsFromBaseFunding: true,
        baseFundingTypeId: '210'
      };

      await addProject(project);
      const projects = await getProjects();
      const saved = projects.find(p => p.id === 'proj001');

      expect(saved.isBaseFunding).toBe(false);
      expect(saved.deductsFromBaseFunding).toBe(true);
      expect(saved.baseFundingTypeId).toBe('210');
    });
  });
});
