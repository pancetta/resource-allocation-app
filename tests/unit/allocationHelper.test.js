import { describe, it, expect } from 'vitest';
import { pctToPMPerMonth, pctToPMPerYear } from '../../js/helpers/allocationHelper.js';

describe('Allocation Helper - PM Conversion Functions', () => {
  describe('pctToPMPerMonth', () => {
    it('should calculate PM/month for full-time person at 100% allocation', () => {
      const result = pctToPMPerMonth(1.0, 1.0);
      expect(result).toBe(1.0);
    });

    it('should calculate PM/month for full-time person at 50% allocation', () => {
      const result = pctToPMPerMonth(1.0, 0.5);
      expect(result).toBe(0.5);
    });

    it('should calculate PM/month for half-time person at 100% allocation', () => {
      const result = pctToPMPerMonth(0.5, 1.0);
      expect(result).toBe(0.5);
    });

    it('should calculate PM/month for half-time person at 50% allocation', () => {
      const result = pctToPMPerMonth(0.5, 0.5);
      expect(result).toBe(0.25);
    });

    it('should handle 0.6 FTE at 50% allocation', () => {
      const result = pctToPMPerMonth(0.6, 0.5);
      expect(result).toBeCloseTo(0.3, 5);
    });

    it('should return 0 for 0 FTE', () => {
      const result = pctToPMPerMonth(0, 1.0);
      expect(result).toBe(0);
    });

    it('should return 0 for 0% allocation', () => {
      const result = pctToPMPerMonth(1.0, 0);
      expect(result).toBe(0);
    });
  });

  describe('pctToPMPerYear', () => {
    it('should calculate PM/year for full-time person at 100% allocation', () => {
      const result = pctToPMPerYear(1.0, 1.0);
      expect(result).toBe(12.0);
    });

    it('should calculate PM/year for full-time person at 50% allocation', () => {
      const result = pctToPMPerYear(1.0, 0.5);
      expect(result).toBe(6.0);
    });

    it('should calculate PM/year for half-time person at 100% allocation', () => {
      const result = pctToPMPerYear(0.5, 1.0);
      expect(result).toBe(6.0);
    });

    it('should calculate PM/year for half-time person at 50% allocation', () => {
      const result = pctToPMPerYear(0.5, 0.5);
      expect(result).toBe(3.0);
    });

    it('should handle 0.6 FTE at 50% allocation', () => {
      const result = pctToPMPerYear(0.6, 0.5);
      expect(result).toBeCloseTo(3.6, 5);
    });

    it('should return 0 for 0 FTE', () => {
      const result = pctToPMPerYear(0, 1.0);
      expect(result).toBe(0);
    });

    it('should return 0 for 0% allocation', () => {
      const result = pctToPMPerYear(1.0, 0);
      expect(result).toBe(0);
    });
  });
});
