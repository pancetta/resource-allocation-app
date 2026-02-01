import { describe, it, expect } from 'vitest';
import { pctToPMPerMonth, pctToPMPerYear, formatPMWithPct } from '../../js/helpers/allocationHelper.js';

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

    it('should handle fractional FTE and allocation (0.66 FTE at 50%)', () => {
      const result = pctToPMPerMonth(0.66, 0.5);
      expect(result).toBeCloseTo(0.33, 5);
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

    it('should handle fractional FTE and allocation (0.66 FTE at 50%)', () => {
      const result = pctToPMPerYear(0.66, 0.5);
      expect(result).toBeCloseTo(3.96, 5);
    });
  });

  describe('formatPMWithPct', () => {
    it('should format PM with percentage correctly for 100% allocation', () => {
      const result = formatPMWithPct(1.0, 1.0);
      expect(result).toBe('1.00 (100%)');
    });

    it('should format PM with percentage correctly for 50% allocation', () => {
      const result = formatPMWithPct(0.5, 1.0);
      expect(result).toBe('0.50 (50%)');
    });

    it('should format PM with percentage correctly for partial FTE', () => {
      const result = formatPMWithPct(0.25, 0.5);
      expect(result).toBe('0.25 (50%)');
    });

    it('should format PM with percentage correctly for 0.33 PM with 0.66 FTE', () => {
      const result = formatPMWithPct(0.33, 0.66);
      expect(result).toBe('0.33 (50%)');
    });

    it('should handle zero FTE gracefully', () => {
      const result = formatPMWithPct(0, 0);
      expect(result).toBe('0.00 (N/A)');
    });

    it('should handle zero PM with non-zero FTE', () => {
      const result = formatPMWithPct(0, 1.0);
      expect(result).toBe('0.00 (0%)');
    });

    it('should round percentage to nearest integer', () => {
      const result = formatPMWithPct(0.33, 1.0);
      expect(result).toBe('0.33 (33%)');
    });

    it('should handle over-allocation (>100%)', () => {
      const result = formatPMWithPct(1.5, 1.0);
      expect(result).toBe('1.50 (150%)');
    });
  });
});
