import { describe, it, expect } from 'vitest';
import { pmPerMonthToYear, formatPM, pmToPercentage, formatPercentage } from '../../js/helpers/allocationHelper.js';

describe('Allocation Helper - PM Functions', () => {
  describe('pmPerMonthToYear', () => {
    it('should convert 1 PM/month to 12 PM/year', () => {
      const result = pmPerMonthToYear(1.0);
      expect(result).toBe(12.0);
    });

    it('should convert 0.5 PM/month to 6 PM/year', () => {
      const result = pmPerMonthToYear(0.5);
      expect(result).toBe(6.0);
    });

    it('should convert 0.25 PM/month to 3 PM/year', () => {
      const result = pmPerMonthToYear(0.25);
      expect(result).toBe(3.0);
    });

    it('should return 0 for 0 PM/month', () => {
      const result = pmPerMonthToYear(0);
      expect(result).toBe(0);
    });

    it('should handle fractional PM values', () => {
      const result = pmPerMonthToYear(0.33);
      expect(result).toBeCloseTo(3.96, 5);
    });
  });

  describe('formatPM', () => {
    it('should format PM to 2 decimal places', () => {
      const result = formatPM(1.0);
      expect(result).toBe('1.00');
    });

    it('should format fractional PM correctly', () => {
      const result = formatPM(0.5);
      expect(result).toBe('0.50');
    });

    it('should format zero PM', () => {
      const result = formatPM(0);
      expect(result).toBe('0.00');
    });

    it('should round to 2 decimal places', () => {
      const result = formatPM(0.333);
      expect(result).toBe('0.33');
    });

    it('should handle values over 1.0', () => {
      const result = formatPM(1.5);
      expect(result).toBe('1.50');
    });
  });

  describe('pmToPercentage', () => {
    it('should convert 0.5 PM with 1.0 FTE to 50%', () => {
      const result = pmToPercentage(0.5, 1.0);
      expect(result).toBe(50);
    });

    it('should convert 1.0 PM with 1.0 FTE to 100%', () => {
      const result = pmToPercentage(1.0, 1.0);
      expect(result).toBe(100);
    });

    it('should convert 0.25 PM with 0.5 FTE to 50%', () => {
      const result = pmToPercentage(0.25, 0.5);
      expect(result).toBe(50);
    });

    it('should return 0 for 0 PM', () => {
      const result = pmToPercentage(0, 1.0);
      expect(result).toBe(0);
    });

    it('should return 0 when FTE is 0', () => {
      const result = pmToPercentage(0.5, 0);
      expect(result).toBe(0);
    });

    it('should handle over-allocation (>100%)', () => {
      const result = pmToPercentage(1.5, 1.0);
      expect(result).toBe(150);
    });

    it('should handle fractional FTE values', () => {
      const result = pmToPercentage(0.3, 0.6);
      expect(result).toBe(50);
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with 1 decimal place', () => {
      const result = formatPercentage(50);
      expect(result).toBe('50.0%');
    });

    it('should format fractional percentage', () => {
      const result = formatPercentage(33.333);
      expect(result).toBe('33.3%');
    });

    it('should format zero percentage', () => {
      const result = formatPercentage(0);
      expect(result).toBe('0.0%');
    });

    it('should format 100%', () => {
      const result = formatPercentage(100);
      expect(result).toBe('100.0%');
    });

    it('should handle over-allocation percentages', () => {
      const result = formatPercentage(150);
      expect(result).toBe('150.0%');
    });
  });
});
