import { describe, it, expect, beforeEach } from 'vitest';
import { 
    findOverlappingFteValues,
    findOverlappingBudgetValues,
    findOpenEndedFteValuesToClose,
    findOpenEndedBudgetValuesToClose
} from '../../js/helpers/validationHelper.js';
import * as db from '../../js/data/database.js';

describe('Overlap Detection', () => {
    beforeEach(async () => {
        await db.openDatabase();
        db.clearCache();
    });

    describe('findOverlappingFteValues', () => {
        it('should detect overlap with open-ended FTE value', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: null });
            
            const overlapping = await findOverlappingFteValues('p001', '2025-06', null);
            expect(overlapping).toHaveLength(1);
            expect(overlapping[0].fte).toBe(1.0);
        });

        it('should detect overlap with two open-ended FTE values', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: null });
            
            const overlapping = await findOverlappingFteValues('p001', '2025-01', null);
            expect(overlapping).toHaveLength(1);
        });

        it('should detect overlap when new entry starts within existing range', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: '2025-12' });
            
            const overlapping = await findOverlappingFteValues('p001', '2025-06', '2025-08');
            expect(overlapping).toHaveLength(1);
        });

        it('should detect overlap when new entry encompasses existing range', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-03', endMonth: '2025-06' });
            
            const overlapping = await findOverlappingFteValues('p001', '2025-01', '2025-12');
            expect(overlapping).toHaveLength(1);
        });

        it('should detect overlap when ranges partially overlap', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: '2025-06' });
            
            const overlapping = await findOverlappingFteValues('p001', '2025-05', '2025-08');
            expect(overlapping).toHaveLength(1);
        });

        it('should not detect overlap when ranges do not overlap', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: '2025-06' });
            
            const overlapping = await findOverlappingFteValues('p001', '2025-07', '2025-12');
            expect(overlapping).toHaveLength(0);
        });

        it('should not detect overlap for different persons', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addPerson({ id: 'p002', name: 'Bob', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: null });
            
            const overlapping = await findOverlappingFteValues('p002', '2025-06', null);
            expect(overlapping).toHaveLength(0);
        });

        it('should exclude specified ID when checking for updates', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: null });
            
            const values = await db.getFteValues();
            const existingId = values[0].id;
            
            const overlapping = await findOverlappingFteValues('p001', '2025-01', null, existingId);
            expect(overlapping).toHaveLength(0);
        });

        it('should detect multiple overlapping entries', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: '2025-06' });
            await db.addFteValue({ personId: 'p001', fte: 0.5, startMonth: '2025-03', endMonth: '2025-08' });
            
            const overlapping = await findOverlappingFteValues('p001', '2025-05', '2025-07');
            expect(overlapping).toHaveLength(2);
        });
    });

    describe('findOpenEndedFteValuesToClose', () => {
        it('should find open-ended FTE values that start before new entry', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: null });
            
            const toClose = await findOpenEndedFteValuesToClose('p001', '2025-06');
            expect(toClose).toHaveLength(1);
            expect(toClose[0].fte).toBe(1.0);
        });

        it('should not find closed FTE values', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: '2025-05' });
            
            const toClose = await findOpenEndedFteValuesToClose('p001', '2025-06');
            expect(toClose).toHaveLength(0);
        });

        it('should not find open-ended values that start after new entry', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-06', endMonth: null });
            
            const toClose = await findOpenEndedFteValuesToClose('p001', '2025-01');
            expect(toClose).toHaveLength(0);
        });

        it('should not find values for different persons', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addPerson({ id: 'p002', name: 'Bob', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: null });
            
            const toClose = await findOpenEndedFteValuesToClose('p002', '2025-06');
            expect(toClose).toHaveLength(0);
        });

        it('should find multiple open-ended values', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: null });
            await db.addFteValue({ personId: 'p001', fte: 0.8, startMonth: '2025-03', endMonth: null });
            
            const toClose = await findOpenEndedFteValuesToClose('p001', '2025-06');
            expect(toClose).toHaveLength(2);
        });
    });

    describe('findOverlappingBudgetValues', () => {
        it('should detect overlap with open-ended budget value', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: null });
            
            const overlapping = await findOverlappingBudgetValues('proj001', '2025-06', null);
            expect(overlapping).toHaveLength(1);
            expect(overlapping[0].plannedPM).toBe(10);
        });

        it('should detect overlap with two open-ended budget values', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: null });
            
            const overlapping = await findOverlappingBudgetValues('proj001', '2025-01', null);
            expect(overlapping).toHaveLength(1);
        });

        it('should not detect overlap when ranges do not overlap', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: '2025-06' });
            
            const overlapping = await findOverlappingBudgetValues('proj001', '2025-07', '2025-12');
            expect(overlapping).toHaveLength(0);
        });

        it('should not detect overlap for different projects', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addProject({ id: 'proj002', name: 'Project B' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: null });
            
            const overlapping = await findOverlappingBudgetValues('proj002', '2025-06', null);
            expect(overlapping).toHaveLength(0);
        });

        it('should exclude specified ID when checking for updates', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: null });
            
            const values = await db.getBudgetValues();
            const existingId = values[0].id;
            
            const overlapping = await findOverlappingBudgetValues('proj001', '2025-01', null, existingId);
            expect(overlapping).toHaveLength(0);
        });
    });

    describe('findOpenEndedBudgetValuesToClose', () => {
        it('should find open-ended budget values that start before new entry', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: null });
            
            const toClose = await findOpenEndedBudgetValuesToClose('proj001', '2025-06');
            expect(toClose).toHaveLength(1);
            expect(toClose[0].plannedPM).toBe(10);
        });

        it('should not find closed budget values', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: '2025-05' });
            
            const toClose = await findOpenEndedBudgetValuesToClose('proj001', '2025-06');
            expect(toClose).toHaveLength(0);
        });

        it('should not find open-ended values that start after new entry', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-06', endMonth: null });
            
            const toClose = await findOpenEndedBudgetValuesToClose('proj001', '2025-01');
            expect(toClose).toHaveLength(0);
        });

        it('should not find values for different projects', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addProject({ id: 'proj002', name: 'Project B' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: null });
            
            const toClose = await findOpenEndedBudgetValuesToClose('proj002', '2025-06');
            expect(toClose).toHaveLength(0);
        });

        it('should not find open-ended values that start at the same month', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: null });
            
            const toClose = await findOpenEndedBudgetValuesToClose('proj001', '2025-01');
            expect(toClose).toHaveLength(0);
        });
    });

    describe('Edge Cases', () => {
        it('should detect overlap when two FTE entries start at the same month', async () => {
            await db.addPerson({ id: 'p001', name: 'Alice', active: true });
            await db.addFteValue({ personId: 'p001', fte: 1.0, startMonth: '2025-01', endMonth: null });
            
            const overlapping = await findOverlappingFteValues('p001', '2025-01', null);
            expect(overlapping).toHaveLength(1);
            expect(overlapping[0].fte).toBe(1.0);
        });

        it('should detect overlap when two budget entries start at the same month', async () => {
            await db.addProject({ id: 'proj001', name: 'Project A' });
            await db.addBudgetValue({ projectId: 'proj001', plannedPM: 10, startMonth: '2025-01', endMonth: null });
            
            const overlapping = await findOverlappingBudgetValues('proj001', '2025-01', null);
            expect(overlapping).toHaveLength(1);
            expect(overlapping[0].plannedPM).toBe(10);
        });
    });
});
