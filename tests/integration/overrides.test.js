import { describe, it, expect, beforeEach } from 'vitest';
import { openDatabase, clearCache, getPeople, getProjects, getAllocations, getFteValues, getBudgetValues, getAllocationOverrides, addPerson, addProject, addAllocation, addFteValue, addBudgetValue, addAllocationOverride } from '../../js/data/database.js';
import { buildAllocationIndex, buildAllocationOverrideIndex, calculatePM, calculatePersonTotal, calculateProjectTotal } from '../../js/helpers/allocationHelper.js';
import { getEffectiveFte, getEffectiveProjectBudget } from '../../js/helpers/overrideHelper.js';

describe('Value Integration Tests', () => {
    beforeEach(async () => {
        await openDatabase();
        clearCache();
    });

    describe('FTE Values', () => {
        it('should use time-based FTE value when calculating allocations', async () => {
            // Add a person (no default FTE anymore)
            await addPerson({ id: 'p001', name: 'Alice', active: true });
            
            // Add initial FTE value: 1.0 from January to February
            await addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: '2025-02' });
            
            // Add second FTE value: 0.5 starting March
            await addFteValue({ personId: 'p001', fte: 0.5, startMonth: '2025-03', endMonth: null });
            
            await addProject({ id: 'proj001', name: 'Project A' });
            await addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: null });
            await addAllocation({ personId: 'p001', projectId: 'proj001', pm: 1.0, startMonth: '2025-01', endMonth: null });
            
            const people = await getPeople();
            const projects = await getProjects();
            const allocations = await getAllocations();
            const fteValues = await getFteValues();
            const allocationIndex = buildAllocationIndex(allocations);
            
            // February: FTE is 1.0, allocation PM is 1.0
            let fte = getEffectiveFte('p001', '2025-02', fteValues);
            expect(fte).toBe(1.0);
            let result = calculatePM(allocationIndex, 'p001', 'proj001', '2025-02', fte, null);
            expect(result).toBe(1.0); // PM is fixed at 1.0
            
            // March: FTE is 0.5, but allocation PM is still 1.0 (PM doesn't change with FTE)
            fte = getEffectiveFte('p001', '2025-03', fteValues);
            expect(fte).toBe(0.5);
            result = calculatePM(allocationIndex, 'p001', 'proj001', '2025-03', fte, null);
            expect(result).toBe(1.0); // PM remains 1.0 regardless of FTE
        });
    });

    describe('Project Budget Values', () => {
        it('should use time-based budget when comparing against allocations', async () => {
            await addProject({ id: 'proj001', name: 'Project A' });
            
            // Add initial budget: 10 PM from January to March
            await addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: '2025-03' });
            
            // Add second budget: 5 PM starting April
            await addBudgetValue({ projectId: 'proj001', plannedPM: 5, startMonth: '2025-04', endMonth: null });
            
            const projects = await getProjects();
            const budgetValues = await getBudgetValues();
            
            // March: should use first budget (10)
            let planned = getEffectiveProjectBudget('proj001', '2025-03', budgetValues);
            expect(planned).toBe(10);
            
            // April: should use second budget (5)
            planned = getEffectiveProjectBudget('proj001', '2025-04', budgetValues);
            expect(planned).toBe(5);
        });
    });

    describe('Allocation Overrides', () => {
        it('should use override percentage for specific month', async () => {
            await addPerson({ id: 'p001', name: 'Alice', active: true });
            await addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: null });
            await addProject({ id: 'proj001', name: 'Project A' });
            await addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: null });
            
            // Add allocation with 100% (1.0) 
            await addAllocation({ personId: 'p001', projectId: 'proj001', pm: 1.0, startMonth: '2025-01', endMonth: null });
            const allocations = await getAllocations();
            const allocationId = allocations[0].id;
            
            // Add override: In June, allocation is only 50% (0.5)
            await addAllocationOverride({ allocationId, month: '2025-06', pm: 0.5 });
            
            const allocationOverrides = await getAllocationOverrides();
            const allocationIndex = buildAllocationIndex(allocations);
            const allocationOverrideIndex = buildAllocationOverrideIndex(allocationOverrides);
            
            // May: should use base allocation (1.0)
            let result = calculatePM(allocationIndex, 'p001', 'proj001', '2025-05', 1.0, allocationOverrideIndex);
            expect(result).toBe(1.0);
            
            // June: should use override (0.5)
            result = calculatePM(allocationIndex, 'p001', 'proj001', '2025-06', 1.0, allocationOverrideIndex);
            expect(result).toBe(0.5);
            
            // July: should revert to base allocation (1.0)
            result = calculatePM(allocationIndex, 'p001', 'proj001', '2025-07', 1.0, allocationOverrideIndex);
            expect(result).toBe(1.0);
        });
    });

    describe('Combined Values and Overrides', () => {
        it('should handle FTE values and allocation overrides together', async () => {
            await addPerson({ id: 'p001', name: 'Alice', active: true });
            
            // FTE values: 1.0 initially, then 0.5 starting March
            await addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: '2025-02' });
            await addFteValue({ personId: 'p001', fte: 0.5, startMonth: '2025-03', endMonth: null });
            
            await addProject({ id: 'proj001', name: 'Project A' });
            await addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: null });
            await addAllocation({ personId: 'p001', projectId: 'proj001', pm: 1.0, startMonth: '2025-01', endMonth: null });
            
            const allocations = await getAllocations();
            const allocationId = allocations[0].id;
            
            // Allocation override: 0.8 PM in April only
            await addAllocationOverride({ allocationId, month: '2025-04', pm: 0.8 });
            
            const fteValues = await getFteValues();
            const allocationOverrides = await getAllocationOverrides();
            const allocationIndex = buildAllocationIndex(allocations);
            const allocationOverrideIndex = buildAllocationOverrideIndex(allocationOverrides);
            
            // February: base allocation 1.0 PM
            let fte = getEffectiveFte('p001', '2025-02', fteValues);
            let result = calculatePM(allocationIndex, 'p001', 'proj001', '2025-02', fte, allocationOverrideIndex);
            expect(result).toBe(1.0);
            
            // March: base allocation still 1.0 PM (PM doesn't change with FTE)
            fte = getEffectiveFte('p001', '2025-03', fteValues);
            result = calculatePM(allocationIndex, 'p001', 'proj001', '2025-03', fte, allocationOverrideIndex);
            expect(result).toBe(1.0);
            
            // April: allocation override 0.8 PM
            fte = getEffectiveFte('p001', '2025-04', fteValues);
            result = calculatePM(allocationIndex, 'p001', 'proj001', '2025-04', fte, allocationOverrideIndex);
            expect(result).toBe(0.8);
            
            // May: base allocation 1.0 PM (allocation override is month-specific)
            fte = getEffectiveFte('p001', '2025-05', fteValues);
            result = calculatePM(allocationIndex, 'p001', 'proj001', '2025-05', fte, allocationOverrideIndex);
            expect(result).toBe(1.0);
        });
    });
});
