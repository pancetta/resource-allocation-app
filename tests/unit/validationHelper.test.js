import { describe, it, expect, beforeEach } from 'vitest';
import { 
    personHasFteValue, 
    projectHasBudgetValue,
    getFteValueCount,
    getBudgetValueCount,
    validateFteValueDeletion,
    validateBudgetValueDeletion,
    validateFteValue,
    validatePlannedPM,
    validateAllocationPercentage,
    validatePersonAllocation,
    validateProjectAllocation
} from '../../js/helpers/validationHelper.js';
import * as db from '../../js/data/database.js';

describe('validationHelper', () => {
    beforeEach(async () => {
        await db.openDatabase();
        db.clearCache();
    });

    describe('personHasFteValue', () => {
        it('should return true when person has FTE value', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: null });
            
            const result = await personHasFteValue('p001');
            expect(result).toBe(true);
        });

        it('should return false when person has no FTE value', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            
            const result = await personHasFteValue('p001');
            expect(result).toBe(false);
        });

        it('should return false for non-existent person', async () => {
            const result = await personHasFteValue('p999');
            expect(result).toBe(false);
        });
    });

    describe('projectHasBudgetValue', () => {
        it('should return true when project has budget value', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: null });
            
            const result = await projectHasBudgetValue('proj001');
            expect(result).toBe(true);
        });

        it('should return false when project has no budget value', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            
            const result = await projectHasBudgetValue('proj001');
            expect(result).toBe(false);
        });
    });

    describe('getFteValueCount', () => {
        it('should return correct count of FTE values', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: '2025-06' });
            await db.addFteValue({ personId: 'p001', fte: 0.5, startMonth: '2025-07', endMonth: null });
            
            const count = await getFteValueCount('p001');
            expect(count).toBe(2);
        });

        it('should return 0 for person with no FTE values', async () => {
            const count = await getFteValueCount('p999');
            expect(count).toBe(0);
        });
    });

    describe('getBudgetValueCount', () => {
        it('should return correct count of budget values', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: '2025-06' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 5, startMonth: '2025-07', endMonth: null });
            
            const count = await getBudgetValueCount('proj001');
            expect(count).toBe(2);
        });

        it('should return 0 for project with no budget values', async () => {
            const count = await getBudgetValueCount('proj999');
            expect(count).toBe(0);
        });
    });

    describe('validateFteValueDeletion', () => {
        it('should allow deletion when person has multiple FTE values', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: '2025-06' });
            await db.addFteValue({ personId: 'p001', fte: 0.5, startMonth: '2025-07', endMonth: null });
            
            const fteValues = await db.getFteValues();
            const firstId = fteValues[0].id;
            
            const result = await validateFteValueDeletion(firstId);
            expect(result.valid).toBe(true);
            expect(result.message).toBe('');
        });

        it('should prevent deletion of last FTE value', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: null });
            
            const fteValues = await db.getFteValues();
            const valueId = fteValues[0].id;
            
            const result = await validateFteValueDeletion(valueId);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('Cannot delete the last FTE value');
        });

        it('should return invalid for non-existent FTE value', async () => {
            const result = await validateFteValueDeletion(99999);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('not found');
        });
    });

    describe('validateBudgetValueDeletion', () => {
        it('should allow deletion when project has multiple budget values', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: '2025-06' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 5, startMonth: '2025-07', endMonth: null });
            
            const budgetValues = await db.getBudgetValues();
            const firstId = budgetValues[0].id;
            
            const result = await validateBudgetValueDeletion(firstId);
            expect(result.valid).toBe(true);
            expect(result.message).toBe('');
        });

        it('should prevent deletion of last budget value', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: null });
            
            const budgetValues = await db.getBudgetValues();
            const valueId = budgetValues[0].id;
            
            const result = await validateBudgetValueDeletion(valueId);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('Cannot delete the last budget value');
        });

        it('should return invalid for non-existent budget value', async () => {
            const result = await validateBudgetValueDeletion(99999);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('not found');
        });
    });

    describe('validateFteValue', () => {
        it('should accept valid FTE values between 0 and 1', () => {
            expect(validateFteValue(0).valid).toBe(true);
            expect(validateFteValue(0.5).valid).toBe(true);
            expect(validateFteValue(1).valid).toBe(true);
            expect(validateFteValue(1.0).valid).toBe(true);
        });

        it('should reject FTE values below 0', () => {
            const result = validateFteValue(-0.1);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('cannot be below 0');
        });

        it('should reject FTE values above 1', () => {
            const result = validateFteValue(1.5);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('cannot be above 1');
        });

        it('should reject non-numeric values', () => {
            const result = validateFteValue('abc');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('valid number');
        });

        it('should handle string numbers correctly', () => {
            expect(validateFteValue('0.5').valid).toBe(true);
            expect(validateFteValue('2').valid).toBe(false);
        });
    });

    describe('validatePlannedPM', () => {
        it('should accept valid non-negative plannedPM values', () => {
            expect(validatePlannedPM(0).valid).toBe(true);
            expect(validatePlannedPM(10).valid).toBe(true);
            expect(validatePlannedPM(100.5).valid).toBe(true);
        });

        it('should reject negative plannedPM values', () => {
            const result = validatePlannedPM(-5);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('cannot be negative');
        });

        it('should reject non-numeric values', () => {
            const result = validatePlannedPM('invalid');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('valid number');
        });

        it('should handle string numbers correctly', () => {
            expect(validatePlannedPM('42.5').valid).toBe(true);
            expect(validatePlannedPM('-10').valid).toBe(false);
        });
    });

    describe('validateAllocationPercentage', () => {
        it('should accept valid percentage values between 0 and 100', () => {
            expect(validateAllocationPercentage(0).valid).toBe(true);
            expect(validateAllocationPercentage(50).valid).toBe(true);
            expect(validateAllocationPercentage(100).valid).toBe(true);
        });

        it('should reject negative percentage values', () => {
            const result = validateAllocationPercentage(-10);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('cannot be negative');
        });

        it('should reject percentage values above 100', () => {
            const result = validateAllocationPercentage(150);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('cannot exceed 100');
        });

        it('should reject non-numeric values', () => {
            const result = validateAllocationPercentage('not a number');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('valid number');
        });

        it('should handle string numbers correctly', () => {
            expect(validateAllocationPercentage('75').valid).toBe(true);
            expect(validateAllocationPercentage('200').valid).toBe(false);
        });

        it('should accept decimal percentages', () => {
            expect(validateAllocationPercentage(33.33).valid).toBe(true);
            expect(validateAllocationPercentage(99.9).valid).toBe(true);
        });
    });

    describe('validatePersonAllocation', () => {
        beforeEach(async () => {
            // Set up test data
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addPerson({ id: 'p002', name: 'Bob', active: true });
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addProject({ id: 'proj002', name: 'Project B' });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: null });
            await db.addFteValue({ personId: 'p002', fte: 0.5, startMonth: '2025-01', endMonth: null });
        });

        it('should allow allocation within FTE limit', async () => {
            const allocations = [];
            const allocationOverrides = [];
            const fteValues = await db.getFteValues();
            
            const result = await validatePersonAllocation(
                'p001', 0.5, '2025-01', '2025-06',
                allocations, allocationOverrides, fteValues
            );
            
            expect(result.valid).toBe(true);
            expect(result.conflicts).toHaveLength(0);
        });

        it('should detect overallocation exceeding FTE', async () => {
            const allocations = [];
            const allocationOverrides = [];
            const fteValues = await db.getFteValues();
            
            const result = await validatePersonAllocation(
                'p001', 1.5, '2025-01', '2025-06',
                allocations, allocationOverrides, fteValues
            );
            
            expect(result.valid).toBe(false);
            expect(result.conflicts.length).toBeGreaterThan(0);
            expect(result.message).toContain('overallocated');
            expect(result.message).toContain('FTE=1.00');
        });

        it('should account for existing allocations', async () => {
            // Add existing allocation of 0.6 PM
            await db.addAllocation({
                personId: 'p001',
                projectId: 'proj001',
                pm: 0.6,
                startMonth: '2025-01',
                endMonth: '2025-12'
            });
            
            const allocations = await db.getAllocations();
            const allocationOverrides = [];
            const fteValues = await db.getFteValues();
            
            // Try to add another 0.5 PM (would total 1.1 PM, exceeding FTE of 1.0)
            const result = await validatePersonAllocation(
                'p001', 0.5, '2025-01', '2025-06',
                allocations, allocationOverrides, fteValues
            );
            
            expect(result.valid).toBe(false);
            expect(result.conflicts.length).toBeGreaterThan(0);
        });

        it('should exclude current allocation when updating', async () => {
            // Add allocation
            await db.addAllocation({
                personId: 'p001',
                projectId: 'proj001',
                pm: 0.8,
                startMonth: '2025-01',
                endMonth: '2025-12'
            });
            
            const allocations = await db.getAllocations();
            const allocationId = allocations[0].id;
            const allocationOverrides = [];
            const fteValues = await db.getFteValues();
            
            // Update same allocation to 0.9 PM (should be valid since we exclude current allocation)
            const result = await validatePersonAllocation(
                'p001', 0.9, '2025-01', '2025-12',
                allocations, allocationOverrides, fteValues, allocationId
            );
            
            expect(result.valid).toBe(true);
        });

        it('should handle allocation overrides', async () => {
            // Add allocation
            await db.addAllocation({
                personId: 'p001',
                projectId: 'proj001',
                pm: 0.5,
                startMonth: '2025-01',
                endMonth: '2025-12'
            });
            
            const allocations = await db.getAllocations();
            const allocationId = allocations[0].id;
            
            // Add override that increases allocation in specific month
            await db.addAllocationOverride({
                allocationId: allocationId,
                month: '2025-03',
                pm: 0.8
            });
            
            const allocationOverrides = await db.getAllocationOverrides();
            const fteValues = await db.getFteValues();
            
            // Try to add another allocation that would cause overallocation with override
            const result = await validatePersonAllocation(
                'p001', 0.3, '2025-03', '2025-03',
                allocations, allocationOverrides, fteValues
            );
            
            // 0.8 (override) + 0.3 (new) = 1.1 > 1.0 FTE
            expect(result.valid).toBe(false);
        });

        it('should respect FTE changes over time', async () => {
            // Add FTE change in March
            await db.addFteValue({
                personId: 'p001',
                fte: 0.5,
                startMonth: '2025-03',
                endMonth: null
            });
            
            const allocations = [];
            const allocationOverrides = [];
            const fteValues = await db.getFteValues();
            
            // Try to allocate 0.8 PM across Jan-Jun
            const result = await validatePersonAllocation(
                'p001', 0.8, '2025-01', '2025-06',
                allocations, allocationOverrides, fteValues
            );
            
            // Should fail for March onwards (FTE = 0.5, allocation = 0.8)
            expect(result.valid).toBe(false);
            expect(result.conflicts.some(c => c.month >= '2025-03')).toBe(true);
        });
    });

    describe('validateProjectAllocation', () => {
        beforeEach(async () => {
            // Set up test data
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: null });
        });

        it('should allow allocation within budget', async () => {
            const allocations = [];
            const allocationOverrides = [];
            const budgetValues = await db.getBudgetValues();
            
            const result = await validateProjectAllocation(
                'proj001', 5, '2025-01', '2025-06',
                allocations, allocationOverrides, budgetValues
            );
            
            expect(result.valid).toBe(true);
            expect(result.conflicts).toHaveLength(0);
        });

        it('should detect overallocation exceeding budget', async () => {
            const allocations = [];
            const allocationOverrides = [];
            const budgetValues = await db.getBudgetValues();
            
            const result = await validateProjectAllocation(
                'proj001', 15, '2025-01', '2025-06',
                allocations, allocationOverrides, budgetValues
            );
            
            expect(result.valid).toBe(false);
            expect(result.conflicts.length).toBeGreaterThan(0);
            expect(result.message).toContain('overallocated');
            expect(result.message).toContain('Planned=10.00');
        });

        it('should account for existing allocations', async () => {
            // Add existing allocation of 7 PM
            await db.addAllocation({
                personId: 'p001',
                projectId: 'proj001',
                pm: 7,
                startMonth: '2025-01',
                endMonth: '2025-12'
            });
            
            const allocations = await db.getAllocations();
            const allocationOverrides = [];
            const budgetValues = await db.getBudgetValues();
            
            // Try to add another 5 PM (would total 12 PM, exceeding budget of 10)
            const result = await validateProjectAllocation(
                'proj001', 5, '2025-01', '2025-06',
                allocations, allocationOverrides, budgetValues
            );
            
            expect(result.valid).toBe(false);
            expect(result.conflicts.length).toBeGreaterThan(0);
        });

        it('should allow overallocation for projects without budget', async () => {
            // Add project without budget
            await db.addProject({ id: 'proj002', name: 'Project B' });
            
            const allocations = [];
            const allocationOverrides = [];
            const budgetValues = await db.getBudgetValues();
            
            // Should allow any allocation for project without budget
            const result = await validateProjectAllocation(
                'proj002', 100, '2025-01', '2025-06',
                allocations, allocationOverrides, budgetValues
            );
            
            expect(result.valid).toBe(true);
        });

        it('should exclude current allocation when updating', async () => {
            // Add allocation
            await db.addAllocation({
                personId: 'p001',
                projectId: 'proj001',
                pm: 8,
                startMonth: '2025-01',
                endMonth: '2025-12'
            });
            
            const allocations = await db.getAllocations();
            const allocationId = allocations[0].id;
            const allocationOverrides = [];
            const budgetValues = await db.getBudgetValues();
            
            // Update same allocation to 9 PM (should be valid since we exclude current allocation)
            const result = await validateProjectAllocation(
                'proj001', 9, '2025-01', '2025-12',
                allocations, allocationOverrides, budgetValues, allocationId
            );
            
            expect(result.valid).toBe(true);
        });

        it('should respect budget changes over time', async () => {
            // Add budget change in March (reduce budget)
            await db.addBudgetValue({
                projectId: 'proj001',
                plannedPM: 5,
                startMonth: '2025-03',
                endMonth: null
            });
            
            const allocations = [];
            const allocationOverrides = [];
            const budgetValues = await db.getBudgetValues();
            
            // Try to allocate 8 PM across Jan-Jun
            const result = await validateProjectAllocation(
                'proj001', 8, '2025-01', '2025-06',
                allocations, allocationOverrides, budgetValues
            );
            
            // Should fail for March onwards (budget = 5, allocation = 8)
            expect(result.valid).toBe(false);
            expect(result.conflicts.some(c => c.month >= '2025-03')).toBe(true);
        });
    });
});
