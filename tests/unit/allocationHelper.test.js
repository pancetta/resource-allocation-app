import { describe, it, expect } from 'vitest';
import { pmPerMonthToYear, formatPM } from '../../js/helpers/allocationHelper.js';

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
});
