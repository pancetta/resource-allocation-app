import { describe, it, expect } from 'vitest';
import {
    getMonthsInYear,
    isMonthInRange,
    compareMonths,
    getLatestMonth,
    getEarliestMonth,
    getYearFromMonth,
    getMonthNumberFromMonth,
    isSameYear
} from '../../js/helpers/dateHelper.js';

describe('dateHelper', () => {
    describe('getMonthsInYear', () => {
        it('should return 12 months for a given year', () => {
            const months = getMonthsInYear(2025);
            expect(months).toHaveLength(12);
        });

        it('should return months in YYYY-MM format', () => {
            const months = getMonthsInYear(2025);
            expect(months[0]).toBe('2025-01');
            expect(months[11]).toBe('2025-12');
        });

        it('should return consecutive months', () => {
            const months = getMonthsInYear(2025);
            expect(months[1]).toBe('2025-02');
            expect(months[6]).toBe('2025-07');
        });

        it('should work with different years', () => {
            const months2026 = getMonthsInYear(2026);
            expect(months2026[0]).toBe('2026-01');
            expect(months2026[11]).toBe('2026-12');
        });

        it('should accept string year', () => {
            const months = getMonthsInYear('2025');
            expect(months[0]).toBe('2025-01');
        });
    });

    describe('isMonthInRange', () => {
        it('should return true when month is in range (start)', () => {
            const result = isMonthInRange('2025-06', '2025-06', '2025-08');
            expect(result).toBe(true);
        });

        it('should return true when month is in range (middle)', () => {
            const result = isMonthInRange('2025-07', '2025-06', '2025-08');
            expect(result).toBe(true);
        });

        it('should return true when month is in range (end)', () => {
            const result = isMonthInRange('2025-08', '2025-06', '2025-08');
            expect(result).toBe(true);
        });

        it('should return false when month is before range', () => {
            const result = isMonthInRange('2025-05', '2025-06', '2025-08');
            expect(result).toBe(false);
        });

        it('should return false when month is after range', () => {
            const result = isMonthInRange('2025-09', '2025-06', '2025-08');
            expect(result).toBe(false);
        });

        it('should handle null endMonth (open-ended)', () => {
            const result = isMonthInRange('2025-12', '2025-06', null);
            expect(result).toBe(true);
        });

        it('should return false for null endMonth if before startMonth', () => {
            const result = isMonthInRange('2025-05', '2025-06', null);
            expect(result).toBe(false);
        });
    });

    describe('compareMonths', () => {
        it('should return negative when month1 < month2', () => {
            const result = compareMonths('2025-06', '2025-07');
            expect(result).toBeLessThan(0);
        });

        it('should return positive when month1 > month2', () => {
            const result = compareMonths('2025-07', '2025-06');
            expect(result).toBeGreaterThan(0);
        });

        it('should return 0 when months are equal', () => {
            const result = compareMonths('2025-06', '2025-06');
            expect(result).toBe(0);
        });

        it('should compare across years correctly', () => {
            const result = compareMonths('2024-12', '2025-01');
            expect(result).toBeLessThan(0);
        });
    });

    describe('getLatestMonth', () => {
        it('should return latest month from array', () => {
            const months = ['2025-01', '2025-03', '2025-02'];
            const latest = getLatestMonth(months);
            expect(latest).toBe('2025-03');
        });

        it('should handle already sorted array', () => {
            const months = ['2025-01', '2025-02', '2025-03'];
            const latest = getLatestMonth(months);
            expect(latest).toBe('2025-03');
        });

        it('should handle single month', () => {
            const months = ['2025-06'];
            const latest = getLatestMonth(months);
            expect(latest).toBe('2025-06');
        });

        it('should return null for empty array', () => {
            const latest = getLatestMonth([]);
            expect(latest).toBeNull();
        });

        it('should compare across years', () => {
            const months = ['2025-01', '2024-12', '2025-02'];
            const latest = getLatestMonth(months);
            expect(latest).toBe('2025-02');
        });
    });

    describe('getEarliestMonth', () => {
        it('should return earliest month from array', () => {
            const months = ['2025-03', '2025-01', '2025-02'];
            const earliest = getEarliestMonth(months);
            expect(earliest).toBe('2025-01');
        });

        it('should handle already sorted array', () => {
            const months = ['2025-01', '2025-02', '2025-03'];
            const earliest = getEarliestMonth(months);
            expect(earliest).toBe('2025-01');
        });

        it('should handle single month', () => {
            const months = ['2025-06'];
            const earliest = getEarliestMonth(months);
            expect(earliest).toBe('2025-06');
        });

        it('should return null for empty array', () => {
            const earliest = getEarliestMonth([]);
            expect(earliest).toBeNull();
        });

        it('should compare across years', () => {
            const months = ['2025-01', '2024-12', '2025-02'];
            const earliest = getEarliestMonth(months);
            expect(earliest).toBe('2024-12');
        });
    });

    describe('getYearFromMonth', () => {
        it('should extract year from month string', () => {
            const year = getYearFromMonth('2025-06');
            expect(year).toBe('2025');
        });

        it('should work with different years', () => {
            expect(getYearFromMonth('2024-01')).toBe('2024');
            expect(getYearFromMonth('2026-12')).toBe('2026');
        });
    });

    describe('getMonthNumberFromMonth', () => {
        it('should extract month number from month string', () => {
            expect(getMonthNumberFromMonth('2025-01')).toBe(1);
            expect(getMonthNumberFromMonth('2025-06')).toBe(6);
            expect(getMonthNumberFromMonth('2025-12')).toBe(12);
        });

        it('should return numeric month', () => {
            const monthNum = getMonthNumberFromMonth('2025-03');
            expect(typeof monthNum).toBe('number');
        });
    });

    describe('isSameYear', () => {
        it('should return true for months in same year', () => {
            const result = isSameYear('2025-01', '2025-12');
            expect(result).toBe(true);
        });

        it('should return true for same month', () => {
            const result = isSameYear('2025-06', '2025-06');
            expect(result).toBe(true);
        });

        it('should return false for months in different years', () => {
            const result = isSameYear('2024-12', '2025-01');
            expect(result).toBe(false);
        });

        it('should return false across year boundary', () => {
            const result = isSameYear('2024-06', '2025-06');
            expect(result).toBe(false);
        });
    });
});
