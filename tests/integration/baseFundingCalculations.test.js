import { describe, it, expect, beforeEach } from 'vitest';
import {
  openDatabase,
  getPeople,
  addPerson,
  getProjects,
  addProject,
  getAllocations,
  addAllocation,
  getFteValues,
  addFteValue,
  getBudgetValues,
  addBudgetValue,
  clearCache
} from '../../js/data/database.js';
import {
  buildAllocationIndex,
  buildAllocationOverrideIndex,
  calculateBaseFundingDeductions,
  calculateNetBaseFunding
} from '../../js/helpers/allocationHelper.js';

describe('Base Funding Calculations', () => {
  beforeEach(async () => {
    await openDatabase();
    clearCache();
    
    // Clear database
    const db = await openDatabase();
    const tx = db.transaction(["people", "projects", "defaultAllocations", "fteValues", "budgetValues"], "readwrite");
    await tx.objectStore("people").clear();
    await tx.objectStore("projects").clear();
    await tx.objectStore("defaultAllocations").clear();
    await tx.objectStore("fteValues").clear();
    await tx.objectStore("budgetValues").clear();
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    clearCache();
  });

  describe('calculateBaseFundingDeductions', () => {
    it('should calculate deductions for type 210 correctly', async () => {
      // Setup: Create base funding project for type 210
      await addProject({
        id: 'bf210',
        name: 'Base Funding 210',
        isBaseFunding: true,
        baseFundingType: '210'
      });
      
      // Create a project that deducts from base funding
      await addProject({
        id: 'proj001',
        name: 'Project A',
        deductsFromBaseFunding: true,
        baseFundingTypeId: '210'
      });
      
      // Create a person of type 210
      await addPerson({
        id: 'p001',
        name: 'Alice',
        type: '210',
        active: true
      });
      
      // Add FTE value
      await addFteValue({
        personId: 'p001',
        fte: 1.0,
        startMonth: '2024-01',
        endMonth: null
      });
      
      // Add allocation: 0.5 PM to Project A
      await addAllocation({
        personId: 'p001',
        projectId: 'proj001',
        pm: 0.5,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      // Calculate deductions
      const people = await getPeople();
      const projects = await getProjects();
      const allocations = await getAllocations();
      const fteValues = await getFteValues();
      
      const allocationIndex = buildAllocationIndex(allocations);
      const deductions = calculateBaseFundingDeductions(
        allocationIndex,
        people,
        projects,
        '2024-06',
        fteValues
      );
      
      expect(deductions['210']).toBe(0.5);
    });

    it('should not deduct from base funding for non-matching person types', async () => {
      // Setup: Create base funding project for type 210
      await addProject({
        id: 'bf210',
        name: 'Base Funding 210',
        isBaseFunding: true,
        baseFundingType: '210'
      });
      
      // Create a project that deducts from base funding type 210
      await addProject({
        id: 'proj001',
        name: 'Project A',
        deductsFromBaseFunding: true,
        baseFundingTypeId: '210'
      });
      
      // Create a person of type 220 (different type)
      await addPerson({
        id: 'p001',
        name: 'Bob',
        type: '220',
        active: true
      });
      
      // Add FTE value
      await addFteValue({
        personId: 'p001',
        fte: 1.0,
        startMonth: '2024-01',
        endMonth: null
      });
      
      // Add allocation: 0.5 PM to Project A
      await addAllocation({
        personId: 'p001',
        projectId: 'proj001',
        pm: 0.5,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      // Calculate deductions
      const people = await getPeople();
      const projects = await getProjects();
      const allocations = await getAllocations();
      const fteValues = await getFteValues();
      
      const allocationIndex = buildAllocationIndex(allocations);
      const deductions = calculateBaseFundingDeductions(
        allocationIndex,
        people,
        projects,
        '2024-06',
        fteValues
      );
      
      // Should be 0 or undefined because person type 220 doesn't match base funding type 210
      expect(deductions['210'] || 0).toBe(0);
    });

    it('should sum deductions from multiple people of same type', async () => {
      // Setup: Create base funding project for type 210
      await addProject({
        id: 'bf210',
        name: 'Base Funding 210',
        isBaseFunding: true,
        baseFundingType: '210'
      });
      
      // Create a project that deducts from base funding
      await addProject({
        id: 'proj001',
        name: 'Project A',
        deductsFromBaseFunding: true,
        baseFundingTypeId: '210'
      });
      
      // Create two people of type 210
      await addPerson({ id: 'p001', name: 'Alice', type: '210', active: true });
      await addPerson({ id: 'p002', name: 'Bob', type: '210', active: true });
      
      // Add FTE values
      await addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2024-01', endMonth: null });
      await addFteValue({ personId: 'p002', fte: 1.0, startMonth: '2024-01', endMonth: null });
      
      // Add allocations
      await addAllocation({ personId: 'p001', projectId: 'proj001', pm: 0.3, startMonth: '2024-01', endMonth: '2024-12' });
      await addAllocation({ personId: 'p002', projectId: 'proj001', pm: 0.4, startMonth: '2024-01', endMonth: '2024-12' });
      
      // Calculate deductions
      const people = await getPeople();
      const projects = await getProjects();
      const allocations = await getAllocations();
      const fteValues = await getFteValues();
      
      const allocationIndex = buildAllocationIndex(allocations);
      const deductions = calculateBaseFundingDeductions(
        allocationIndex,
        people,
        projects,
        '2024-06',
        fteValues
      );
      
      expect(deductions['210']).toBeCloseTo(0.7, 2);
    });
  });

  describe('calculateNetBaseFunding', () => {
    it('should calculate net base funding correctly', async () => {
      // Setup: Create base funding project
      await addProject({
        id: 'bf210',
        name: 'Base Funding 210',
        isBaseFunding: true,
        baseFundingType: '210'
      });
      
      // Add budget for base funding
      await addBudgetValue({
        projectId: 'bf210',
        plannedPM: 10.0,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      const baseFundingProjects = [
        { id: 'bf210', baseFundingType: '210', name: 'Base Funding 210', isBaseFunding: true }
      ];
      
      const deductions = { '210': 3.5 };
      const budgetValues = await getBudgetValues();
      
      const netValues = calculateNetBaseFunding(
        baseFundingProjects,
        deductions,
        budgetValues,
        '2024-06'
      );
      
      expect(netValues['bf210'].planned).toBe(10.0);
      expect(netValues['bf210'].deductions).toBe(3.5);
      expect(netValues['bf210'].net).toBeCloseTo(6.5, 2);
    });

    it('should handle zero deductions', async () => {
      await addProject({
        id: 'bf210',
        name: 'Base Funding 210',
        isBaseFunding: true,
        baseFundingType: '210'
      });
      
      await addBudgetValue({
        projectId: 'bf210',
        plannedPM: 10.0,
        startMonth: '2024-01',
        endMonth: '2024-12'
      });
      
      const baseFundingProjects = [
        { id: 'bf210', baseFundingType: '210', name: 'Base Funding 210', isBaseFunding: true }
      ];
      
      const deductions = {}; // No deductions
      const budgetValues = await getBudgetValues();
      
      const netValues = calculateNetBaseFunding(
        baseFundingProjects,
        deductions,
        budgetValues,
        '2024-06'
      );
      
      expect(netValues['bf210'].planned).toBe(10.0);
      expect(netValues['bf210'].deductions).toBe(0);
      expect(netValues['bf210'].net).toBe(10.0);
    });
  });
});
