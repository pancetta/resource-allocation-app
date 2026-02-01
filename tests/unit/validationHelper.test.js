import { describe, it, expect, beforeEach } from 'vitest';
import { 
    personHasFteValue, 
    projectHasBudgetValue,
    getFteValueCount,
    getBudgetValueCount,
    validateFteValueDeletion,
    validateBudgetValueDeletion
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
});
