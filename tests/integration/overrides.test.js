import { describe, it, expect, beforeEach } from 'vitest';
import { openDatabase, clearCache, getPeople, getProjects, getAllocations, getFteOverrides, getProjectBudgetOverrides, getAllocationOverrides, addPerson, addProject, addAllocation, addFteOverride, addProjectBudgetOverride, addAllocationOverride } from '../../js/data/database.js';
import { buildAllocationIndex, buildAllocationOverrideIndex, calculatePM, calculatePersonTotal, calculateProjectTotal } from '../../js/helpers/allocationHelper.js';

describe('Override Integration Tests', () => {
    beforeEach(async () => {
        await openDatabase();
        clearCache();
    });

    describe('FTE Overrides', () => {
        it('should use override FTE value when calculating allocations', async () => {
            // Add a person with base FTE of 1.0
            await addPerson({ id: 'p001', name: 'Alice', fte: 1.0, active: true });
            await addProject({ id: 'proj001', name: 'Project A', plannedPM: 10 });
            await addAllocation({ personId: 'p001', projectId: 'proj001', pct: 1.0, startMonth: '2025-01', endMonth: null });
            
            // Add FTE override: Alice goes to 0.5 FTE starting March 2025
            await addFteOverride({ personId: 'p001', fte: 0.5, startMonth: '2025-03', endMonth: null });
            
            const people = await getPeople();
            const projects = await getProjects();
            const allocations = await getAllocations();
            const fteOverrides = await getFteOverrides();
            const allocationIndex = buildAllocationIndex(allocations);
            
            // February: should use base FTE (1.0)
            let fte = 1.0;
            let result = calculatePM(allocationIndex, 'p001', 'proj001', '2025-02', fte, null);
            expect(result).toBe(1.0);
            
            // March: should use override FTE (0.5)
            const applicableOverrides = fteOverrides.filter(o => 
                o.personId === 'p001' && o.startMonth <= '2025-03' && (!o.endMonth || o.endMonth >= '2025-03')
            );
            if (applicableOverrides.length > 0) {
                fte = applicableOverrides[0].fte;
            }
            result = calculatePM(allocationIndex, 'p001', 'proj001', '2025-03', fte, null);
            expect(result).toBe(0.5);
        });
    });

    describe('Project Budget Overrides', () => {
        it('should use override planned PM when comparing against allocations', async () => {
            await addProject({ id: 'proj001', name: 'Project A', plannedPM: 10 });
            
            // Add budget override: Project changes to 5 PM starting April 2025
            await addProjectBudgetOverride({ projectId: 'proj001', plannedPM: 5, startMonth: '2025-04', endMonth: null });
            
            const projects = await getProjects();
            const budgetOverrides = await getProjectBudgetOverrides();
            
            // March: should use base planned PM (10)
            let planned = projects[0].plannedPM;
            expect(planned).toBe(10);
            
            // April: should use override (5)
            const applicableOverrides = budgetOverrides.filter(o => 
                o.projectId === 'proj001' && o.startMonth <= '2025-04' && (!o.endMonth || o.endMonth >= '2025-04')
            );
            if (applicableOverrides.length > 0) {
                planned = applicableOverrides[0].plannedPM;
            }
            expect(planned).toBe(5);
        });
    });

    describe('Allocation Overrides', () => {
        it('should use override percentage for specific month', async () => {
            await addPerson({ id: 'p001', name: 'Alice', fte: 1.0, active: true });
            await addProject({ id: 'proj001', name: 'Project A', plannedPM: 10 });
            
            // Add allocation with 100% (1.0) 
            await addAllocation({ personId: 'p001', projectId: 'proj001', pct: 1.0, startMonth: '2025-01', endMonth: null });
            const allocations = await getAllocations();
            const allocationId = allocations[0].id;
            
            // Add override: In June, allocation is only 50% (0.5)
            await addAllocationOverride({ allocationId, month: '2025-06', pct: 0.5 });
            
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

    describe('Combined Overrides', () => {
        it('should handle FTE and allocation overrides together', async () => {
            await addPerson({ id: 'p001', name: 'Alice', fte: 1.0, active: true });
            await addProject({ id: 'proj001', name: 'Project A', plannedPM: 10 });
            await addAllocation({ personId: 'p001', projectId: 'proj001', pct: 1.0, startMonth: '2025-01', endMonth: null });
            
            const allocations = await getAllocations();
            const allocationId = allocations[0].id;
            
            // FTE override: 0.5 FTE starting March
            await addFteOverride({ personId: 'p001', fte: 0.5, startMonth: '2025-03', endMonth: null });
            
            // Allocation override: 0.8 pct in April only
            await addAllocationOverride({ allocationId, month: '2025-04', pct: 0.8 });
            
            const fteOverrides = await getFteOverrides();
            const allocationOverrides = await getAllocationOverrides();
            const allocationIndex = buildAllocationIndex(allocations);
            const allocationOverrideIndex = buildAllocationOverrideIndex(allocationOverrides);
            
            // February: base FTE (1.0) * base allocation (1.0) = 1.0
            let result = calculatePM(allocationIndex, 'p001', 'proj001', '2025-02', 1.0, allocationOverrideIndex);
            expect(result).toBe(1.0);
            
            // March: override FTE (0.5) * base allocation (1.0) = 0.5
            let fte = 0.5; // FTE override applies
            result = calculatePM(allocationIndex, 'p001', 'proj001', '2025-03', fte, allocationOverrideIndex);
            expect(result).toBe(0.5);
            
            // April: override FTE (0.5) * override allocation (0.8) = 0.4
            result = calculatePM(allocationIndex, 'p001', 'proj001', '2025-04', fte, allocationOverrideIndex);
            expect(result).toBe(0.4);
            
            // May: override FTE (0.5) * base allocation (1.0) = 0.5 (allocation override is month-specific)
            result = calculatePM(allocationIndex, 'p001', 'proj001', '2025-05', fte, allocationOverrideIndex);
            expect(result).toBe(0.5);
        });
    });
});
