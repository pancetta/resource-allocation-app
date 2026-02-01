import { describe, it, expect } from 'vitest';
import { 
    getEffectiveFte, 
    getEffectiveProjectBudget, 
    getTotalEffectiveFte, 
    getTotalEffectiveProjectBudget 
} from '../../js/helpers/overrideHelper.js';

describe('overrideHelper', () => {
    describe('getEffectiveFte', () => {
        it('should return default FTE when no overrides apply', () => {
            const result = getEffectiveFte('p001', '2025-06', 1, []);
            expect(result).toBe(1);
        });

        it('should return default FTE when override is outside date range', () => {
            const overrides = [
                { personId: 'p001', fte: 0.5, startMonth: '2025-03', endMonth: '2025-05' }
            ];
            const result = getEffectiveFte('p001', '2025-06', 1, overrides);
            expect(result).toBe(1);
        });

        it('should return override FTE when in date range', () => {
            const overrides = [
                { personId: 'p001', fte: 0.5, startMonth: '2025-06', endMonth: '2025-08' }
            ];
            const result = getEffectiveFte('p001', '2025-06', 1, overrides);
            expect(result).toBe(0.5);
        });

        it('should use most recent override when multiple apply', () => {
            const overrides = [
                { personId: 'p001', fte: 0.5, startMonth: '2025-01', endMonth: '2025-12' },
                { personId: 'p001', fte: 0.75, startMonth: '2025-06', endMonth: '2025-12' }
            ];
            const result = getEffectiveFte('p001', '2025-06', 1, overrides);
            expect(result).toBe(0.75);
        });

        it('should handle open-ended overrides (no endMonth)', () => {
            const overrides = [
                { personId: 'p001', fte: 0.5, startMonth: '2025-06', endMonth: null }
            ];
            const result = getEffectiveFte('p001', '2025-12', 1, overrides);
            expect(result).toBe(0.5);
        });

        it('should ignore overrides for different persons', () => {
            const overrides = [
                { personId: 'p002', fte: 0.5, startMonth: '2025-06', endMonth: '2025-08' }
            ];
            const result = getEffectiveFte('p001', '2025-06', 1, overrides);
            expect(result).toBe(1);
        });
    });

    describe('getEffectiveProjectBudget', () => {
        it('should return default budget when no overrides apply', () => {
            const result = getEffectiveProjectBudget('proj001', '2025-06', 100, []);
            expect(result).toBe(100);
        });

        it('should return default budget when override is outside date range', () => {
            const overrides = [
                { projectId: 'proj001', plannedPM: 150, startMonth: '2025-03', endMonth: '2025-05' }
            ];
            const result = getEffectiveProjectBudget('proj001', '2025-06', 100, overrides);
            expect(result).toBe(100);
        });

        it('should return override budget when in date range', () => {
            const overrides = [
                { projectId: 'proj001', plannedPM: 150, startMonth: '2025-06', endMonth: '2025-08' }
            ];
            const result = getEffectiveProjectBudget('proj001', '2025-06', 100, overrides);
            expect(result).toBe(150);
        });

        it('should use most recent override when multiple apply', () => {
            const overrides = [
                { projectId: 'proj001', plannedPM: 150, startMonth: '2025-01', endMonth: '2025-12' },
                { projectId: 'proj001', plannedPM: 200, startMonth: '2025-06', endMonth: '2025-12' }
            ];
            const result = getEffectiveProjectBudget('proj001', '2025-06', 100, overrides);
            expect(result).toBe(200);
        });

        it('should handle open-ended overrides (no endMonth)', () => {
            const overrides = [
                { projectId: 'proj001', plannedPM: 150, startMonth: '2025-06', endMonth: null }
            ];
            const result = getEffectiveProjectBudget('proj001', '2025-12', 100, overrides);
            expect(result).toBe(150);
        });

        it('should ignore overrides for different projects', () => {
            const overrides = [
                { projectId: 'proj002', plannedPM: 150, startMonth: '2025-06', endMonth: '2025-08' }
            ];
            const result = getEffectiveProjectBudget('proj001', '2025-06', 100, overrides);
            expect(result).toBe(100);
        });
    });

    describe('getTotalEffectiveFte', () => {
        it('should sum default FTE across all months when no overrides', () => {
            const months = ['2025-01', '2025-02', '2025-03'];
            const result = getTotalEffectiveFte('p001', 1, months, []);
            expect(result).toBe(3);
        });

        it('should sum effective FTE considering overrides', () => {
            const months = ['2025-01', '2025-02', '2025-03'];
            const overrides = [
                { personId: 'p001', fte: 0.5, startMonth: '2025-02', endMonth: '2025-03' }
            ];
            const result = getTotalEffectiveFte('p001', 1, months, overrides);
            // Jan: 1, Feb: 0.5, Mar: 0.5 = 2
            expect(result).toBe(2);
        });

        it('should handle multiple override periods', () => {
            const months = ['2025-01', '2025-02', '2025-03', '2025-04'];
            const overrides = [
                { personId: 'p001', fte: 0.5, startMonth: '2025-02', endMonth: '2025-02' },
                { personId: 'p001', fte: 0.75, startMonth: '2025-03', endMonth: '2025-04' }
            ];
            const result = getTotalEffectiveFte('p001', 1, months, overrides);
            // Jan: 1, Feb: 0.5, Mar: 0.75, Apr: 0.75 = 3
            expect(result).toBe(3);
        });
    });

    describe('getTotalEffectiveProjectBudget', () => {
        it('should sum default budget across all months when no overrides', () => {
            const months = ['2025-01', '2025-02', '2025-03'];
            const result = getTotalEffectiveProjectBudget('proj001', 100, months, []);
            expect(result).toBe(300);
        });

        it('should sum effective budget considering overrides', () => {
            const months = ['2025-01', '2025-02', '2025-03'];
            const overrides = [
                { projectId: 'proj001', plannedPM: 150, startMonth: '2025-02', endMonth: '2025-03' }
            ];
            const result = getTotalEffectiveProjectBudget('proj001', 100, months, overrides);
            // Jan: 100, Feb: 150, Mar: 150 = 400
            expect(result).toBe(400);
        });

        it('should handle multiple override periods', () => {
            const months = ['2025-01', '2025-02', '2025-03', '2025-04'];
            const overrides = [
                { projectId: 'proj001', plannedPM: 150, startMonth: '2025-02', endMonth: '2025-02' },
                { projectId: 'proj001', plannedPM: 200, startMonth: '2025-03', endMonth: '2025-04' }
            ];
            const result = getTotalEffectiveProjectBudget('proj001', 100, months, overrides);
            // Jan: 100, Feb: 150, Mar: 200, Apr: 200 = 650
            expect(result).toBe(650);
        });
    });
});
