import { describe, it, expect, beforeEach } from 'vitest';
import {
  openDatabase,
  getPeople,
  addPerson,
  updatePerson,
  deletePerson,
  getProjects,
  addProject,
  updateProject,
  deleteProject,
  getAllocations,
  addAllocation,
  updateAllocation,
  deleteAllocation,
  generatePersonId,
  generateProjectId,
  clearCache
} from '../../js/data/database.js';

describe('Database Module', () => {
  beforeEach(async () => {
    // Open database before each test
    await openDatabase();
    // Clear cache to ensure tests are isolated
    clearCache();
  });

  describe('People CRUD', () => {
    it('should add a person', async () => {
      const person = { id: 'p001', name: 'John Doe', fte: 1, active: true };
      await addPerson(person);
      
      const people = await getPeople();
      expect(people).toHaveLength(1);
      expect(people[0]).toEqual(person);
    });

    it('should get all people', async () => {
      await addPerson({ id: 'p001', name: 'John', fte: 1, active: true });
      await addPerson({ id: 'p002', name: 'Jane', fte: 0.8, active: true });
      
      const people = await getPeople();
      expect(people).toHaveLength(2);
      expect(people[0].name).toBe('John');
      expect(people[1].name).toBe('Jane');
    });

    it('should update a person', async () => {
      await addPerson({ id: 'p001', name: 'John', fte: 1, active: true });
      
      await updatePerson({ id: 'p001', name: 'John Updated', fte: 0.5, active: false });
      
      const people = await getPeople();
      expect(people[0].name).toBe('John Updated');
      expect(people[0].fte).toBe(0.5);
      expect(people[0].active).toBe(false);
    });

    it('should delete a person', async () => {
      await addPerson({ id: 'p001', name: 'John', fte: 1, active: true });
      await addPerson({ id: 'p002', name: 'Jane', fte: 1, active: true });
      
      await deletePerson('p001');
      
      const people = await getPeople();
      expect(people).toHaveLength(1);
      expect(people[0].id).toBe('p002');
    });
  });

  describe('Projects CRUD', () => {
    it('should add a project', async () => {
      const project = { id: 'proj001', name: 'Project A', plannedPM: 2.5 };
      await addProject(project);
      
      const projects = await getProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0]).toEqual(project);
    });

    it('should get all projects', async () => {
      await addProject({ id: 'proj001', name: 'Project A', plannedPM: 2 });
      await addProject({ id: 'proj002', name: 'Project B', plannedPM: 3 });
      
      const projects = await getProjects();
      expect(projects).toHaveLength(2);
      expect(projects[0].name).toBe('Project A');
      expect(projects[1].name).toBe('Project B');
    });

    it('should update a project', async () => {
      await addProject({ id: 'proj001', name: 'Project A', plannedPM: 2 });
      
      await updateProject({ id: 'proj001', name: 'Project A Updated', plannedPM: 3.5 });
      
      const projects = await getProjects();
      expect(projects[0].name).toBe('Project A Updated');
      expect(projects[0].plannedPM).toBe(3.5);
    });

    it('should delete a project', async () => {
      await addProject({ id: 'proj001', name: 'Project A', plannedPM: 2 });
      await addProject({ id: 'proj002', name: 'Project B', plannedPM: 3 });
      
      await deleteProject('proj001');
      
      const projects = await getProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe('proj002');
    });
  });

  describe('Allocations CRUD', () => {
    it('should add an allocation', async () => {
      const allocation = {
        personId: 'p001',
        projectId: 'proj001',
        pm: 0.5,
        startMonth: '2025-01',
        endMonth: '2025-12'
      };
      await addAllocation(allocation);
      
      const allocations = await getAllocations();
      expect(allocations).toHaveLength(1);
      expect(allocations[0].personId).toBe('p001');
      expect(allocations[0].pm).toBe(0.5);
    });

    it('should get all allocations', async () => {
      await addAllocation({ personId: 'p001', projectId: 'proj001', pm: 0.5, startMonth: '2025-01', endMonth: '' });
      await addAllocation({ personId: 'p002', projectId: 'proj002', pm: 1, startMonth: '2025-02', endMonth: '2025-06' });
      
      const allocations = await getAllocations();
      expect(allocations).toHaveLength(2);
    });

    it('should update an allocation', async () => {
      await addAllocation({ personId: 'p001', projectId: 'proj001', pm: 0.5, startMonth: '2025-01', endMonth: '' });
      
      const allocations = await getAllocations();
      const alloc = allocations[0];
      
      await updateAllocation({ ...alloc, pm: 0.8 });
      
      const updated = await getAllocations();
      expect(updated[0].pm).toBe(0.8);
    });

    it('should delete an allocation', async () => {
      await addAllocation({ personId: 'p001', projectId: 'proj001', pm: 0.5, startMonth: '2025-01', endMonth: '' });
      await addAllocation({ personId: 'p002', projectId: 'proj002', pm: 1, startMonth: '2025-02', endMonth: '' });
      
      const allocations = await getAllocations();
      await deleteAllocation(allocations[0].id);
      
      const remaining = await getAllocations();
      expect(remaining).toHaveLength(1);
    });
  });

  describe('ID Generation', () => {
    it('should generate first person ID as p001', async () => {
      const id = await generatePersonId();
      expect(id).toBe('p001');
    });

    it('should generate sequential person IDs', async () => {
      await addPerson({ id: 'p001', name: 'Person 1', fte: 1, active: true });
      await addPerson({ id: 'p002', name: 'Person 2', fte: 1, active: true });
      
      const id = await generatePersonId();
      expect(id).toBe('p003');
    });

    it('should generate first project ID as proj001', async () => {
      const id = await generateProjectId();
      expect(id).toBe('proj001');
    });

    it('should generate sequential project IDs', async () => {
      await addProject({ id: 'proj001', name: 'Project 1', plannedPM: 1 });
      await addProject({ id: 'proj005', name: 'Project 5', plannedPM: 1 });
      
      const id = await generateProjectId();
      expect(id).toBe('proj006');
    });
  });
});
