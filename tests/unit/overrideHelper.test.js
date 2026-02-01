import { describe, it, expect } from 'vitest';
import { 
    getEffectiveFte, 
    getEffectiveProjectBudget, 
    getTotalEffectiveFte, 
    getTotalEffectiveProjectBudget 
} from '../../js/helpers/overrideHelper.js';

describe('overrideHelper', () => {
    describe('getEffectiveFte', () => {
        it('should return default FTE of 1 when no FTE values apply', () => {
            const result = getEffectiveFte('p001', '2025-06', []);
            expect(result).toBe(1);
        });

        it('should return default FTE when FTE value is outside date range', () => {
            const fteValues = [
                { personId: 'p001', fte: 0.5, startMonth: '2025-03', endMonth: '2025-05' }
            ];
            const result = getEffectiveFte('p001', '2025-06', fteValues);
            expect(result).toBe(1);
        });

        it('should return FTE value when in date range', () => {
            const fteValues = [
                { personId: 'p001', fte: 0.5, startMonth: '2025-06', endMonth: '2025-08' }
            ];
            const result = getEffectiveFte('p001', '2025-06', fteValues);
            expect(result).toBe(0.5);
        });

        it('should use most recent FTE value when multiple apply', () => {
            const fteValues = [
                { personId: 'p001', fte: 0.5, startMonth: '2025-01', endMonth: '2025-12' },
                { personId: 'p001', fte: 0.75, startMonth: '2025-06', endMonth: '2025-12' }
            ];
            const result = getEffectiveFte('p001', '2025-06', fteValues);
            expect(result).toBe(0.75);
        });

        it('should handle open-ended FTE values (no endMonth)', () => {
            const fteValues = [
                { personId: 'p001', fte: 0.5, startMonth: '2025-06', endMonth: null }
            ];
            const result = getEffectiveFte('p001', '2025-12', fteValues);
            expect(result).toBe(0.5);
        });

        it('should ignore FTE values for different persons', () => {
            const fteValues = [
                { personId: 'p002', fte: 0.5, startMonth: '2025-06', endMonth: '2025-08' }
            ];
            const result = getEffectiveFte('p001', '2025-06', fteValues);
            expect(result).toBe(1);
        });
    });

    describe('getEffectiveProjectBudget', () => {
        it('should return default budget of 0 when no budget values apply', () => {
            const result = getEffectiveProjectBudget('proj001', '2025-06', []);
            expect(result).toBe(0);
        });

        it('should return default budget when budget value is outside date range', () => {
            const budgetValues = [
                { projectId: 'proj001', plannedPM: 150, startMonth: '2025-03', endMonth: '2025-05' }
            ];
            const result = getEffectiveProjectBudget('proj001', '2025-06', budgetValues);
            expect(result).toBe(0);
        });

        it('should return budget value when in date range', () => {
            const budgetValues = [
                { projectId: 'proj001', plannedPM: 150, startMonth: '2025-06', endMonth: '2025-08' }
            ];
            const result = getEffectiveProjectBudget('proj001', '2025-06', budgetValues);
            expect(result).toBe(150);
        });

        it('should use most recent budget value when multiple apply', () => {
            const budgetValues = [
                { projectId: 'proj001', plannedPM: 100, startMonth: '2025-01', endMonth: '2025-12' },
                { projectId: 'proj001', plannedPM: 150, startMonth: '2025-06', endMonth: '2025-12' }
            ];
            const result = getEffectiveProjectBudget('proj001', '2025-06', budgetValues);
            expect(result).toBe(150);
        });

        it('should handle open-ended budget values (no endMonth)', () => {
            const budgetValues = [
                { projectId: 'proj001', plannedPM: 150, startMonth: '2025-06', endMonth: null }
            ];
            const result = getEffectiveProjectBudget('proj001', '2025-12', budgetValues);
            expect(result).toBe(150);
        });

        it('should ignore budget values for different projects', () => {
            const budgetValues = [
                { projectId: 'proj002', plannedPM: 150, startMonth: '2025-06', endMonth: '2025-08' }
            ];
            const result = getEffectiveProjectBudget('proj001', '2025-06', budgetValues);
            expect(result).toBe(0);
        });
    });

    describe('getTotalEffectiveFte', () => {
        it('should sum default FTE across all months when no FTE values', () => {
            const months = ['2025-01', '2025-02', '2025-03'];
            const result = getTotalEffectiveFte('p001', months, []);
            expect(result).toBe(3);  // 1 + 1 + 1
        });

        it('should sum effective FTE considering values', () => {
            const months = ['2025-01', '2025-02', '2025-03'];
            const fteValues = [
                { personId: 'p001', fte: 0.5, startMonth: '2025-02', endMonth: null }
            ];
            const result = getTotalEffectiveFte('p001', months, fteValues);
            expect(result).toBe(2);  // 1 + 0.5 + 0.5
        });

        it('should handle multiple FTE value periods', () => {
            const months = ['2025-01', '2025-02', '2025-03', '2025-04'];
            const fteValues = [
                { personId: 'p001', fte: 0.5, startMonth: '2025-02', endMonth: '2025-02' },
                { personId: 'p001', fte: 0.75, startMonth: '2025-03', endMonth: null }
            ];
            const result = getTotalEffectiveFte('p001', months, fteValues);
            expect(result).toBe(3);  // 1 + 0.5 + 0.75 + 0.75
        });
    });

    describe('getTotalEffectiveProjectBudget', () => {
        it('should sum default budget across all months when no budget values', () => {
            const months = ['2025-01', '2025-02', '2025-03'];
            const result = getTotalEffectiveProjectBudget('proj001', months, []);
            expect(result).toBe(0);  // 0 + 0 + 0
        });

        it('should sum effective budget considering values', () => {
            const months = ['2025-01', '2025-02', '2025-03'];
            const budgetValues = [
                { projectId: 'proj001', plannedPM: 5, startMonth: '2025-02', endMonth: null }
            ];
            const result = getTotalEffectiveProjectBudget('proj001', months, budgetValues);
            expect(result).toBe(10);  // 0 + 5 + 5
        });

        it('should handle multiple budget value periods', () => {
            const months = ['2025-01', '2025-02', '2025-03', '2025-04'];
            const budgetValues = [
                { projectId: 'proj001', plannedPM: 5, startMonth: '2025-02', endMonth: '2025-02' },
                { projectId: 'proj001', plannedPM: 7.5, startMonth: '2025-03', endMonth: null }
            ];
            const result = getTotalEffectiveProjectBudget('proj001', months, budgetValues);
            expect(result).toBe(20);  // 0 + 5 + 7.5 + 7.5
        });
    });
});
