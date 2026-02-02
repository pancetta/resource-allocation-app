import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCurrentMonth, getNextMonth, getCurrentYear, initSmartDefaults, autoFillDate } from '../../js/helpers/smartDefaults.js';

describe('Smart Defaults Helper', () => {
  beforeEach(() => {
    // Clear DOM and localStorage
    document.body.innerHTML = '';
    localStorage.clear();
  });

  describe('getCurrentMonth', () => {
    it('should return current month in YYYY-MM format', () => {
      const result = getCurrentMonth();
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should pad month with zero if needed', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-01-15'));
      
      const result = getCurrentMonth();
      expect(result).toBe('2025-01');
      
      vi.useRealTimers();
    });

    it('should handle different months', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-12-31'));
      
      const result = getCurrentMonth();
      expect(result).toBe('2025-12');
      
      vi.useRealTimers();
    });
  });

  describe('getNextMonth', () => {
    it('should return next month in YYYY-MM format', () => {
      const result = getNextMonth();
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should increment month correctly', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-05-15'));
      
      const result = getNextMonth();
      expect(result).toBe('2025-06');
      
      vi.useRealTimers();
    });

    it('should handle year rollover', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-12-15'));
      
      const result = getNextMonth();
      expect(result).toBe('2026-01');
      
      vi.useRealTimers();
    });
  });

  describe('getCurrentYear', () => {
    it('should return current year as number', () => {
      const result = getCurrentYear();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(2020);
    });

    it('should return exact current year', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-06-15'));
      
      const result = getCurrentYear();
      expect(result).toBe(2025);
      
      vi.useRealTimers();
    });
  });

  describe('initSmartDefaults', () => {
    beforeEach(() => {
      // Setup inputs
      document.body.innerHTML = `
        <input id="fteStartMonthInput" type="month">
        <input id="budgetStartMonthInput" type="month">
        <input id="startMonthInput" type="month">
        <input id="overrideMonthInput" type="month">
        <input id="yearInput" type="number">
        <input id="overviewYearInput" type="number">
        <input id="monthInput" type="month">
        <input id="fteValueInput" type="number">
        <input id="budgetValueInput" type="number">
        <input id="pmInput" type="number">
      `;
    });

    it('should set current month for start month inputs', () => {
      initSmartDefaults();
      
      const currentMonth = getCurrentMonth();
      expect(document.getElementById('fteStartMonthInput').value).toBe(currentMonth);
      expect(document.getElementById('budgetStartMonthInput').value).toBe(currentMonth);
      expect(document.getElementById('startMonthInput').value).toBe(currentMonth);
      expect(document.getElementById('overrideMonthInput').value).toBe(currentMonth);
    });

    it('should not override existing month values', () => {
      document.getElementById('fteStartMonthInput').value = '2024-01';
      
      initSmartDefaults();
      
      expect(document.getElementById('fteStartMonthInput').value).toBe('2024-01');
    });

    it('should set current year for year inputs', () => {
      initSmartDefaults();
      
      const currentYear = getCurrentYear();
      expect(document.getElementById('yearInput').value).toBe(String(currentYear));
      expect(document.getElementById('overviewYearInput').value).toBe(String(currentYear));
    });

    it('should not override existing year values', () => {
      document.getElementById('yearInput').value = '2024';
      
      initSmartDefaults();
      
      expect(document.getElementById('yearInput').value).toBe('2024');
    });

    it('should set current month for monthly report input', () => {
      initSmartDefaults();
      
      const currentMonth = getCurrentMonth();
      expect(document.getElementById('monthInput').value).toBe(currentMonth);
    });

    it('should load saved values from localStorage', () => {
      localStorage.setItem('lastFTE', '0.8');
      localStorage.setItem('lastBudget', '10');
      localStorage.setItem('lastPM', '2');
      
      initSmartDefaults();
      
      expect(document.getElementById('fteValueInput').value).toBe('0.8');
      expect(document.getElementById('budgetValueInput').value).toBe('10');
      expect(document.getElementById('pmInput').value).toBe('2');
    });

    it('should save values to localStorage on change', () => {
      initSmartDefaults();
      
      const fteInput = document.getElementById('fteValueInput');
      fteInput.value = '0.5';
      fteInput.dispatchEvent(new Event('change'));
      
      expect(localStorage.getItem('lastFTE')).toBe('0.5');
    });

    it('should handle missing inputs gracefully', () => {
      document.body.innerHTML = '<div></div>';
      
      expect(() => initSmartDefaults()).not.toThrow();
    });

    it('should handle undefined document gracefully', () => {
      const originalDocument = global.document;
      global.document = undefined;
      
      expect(() => initSmartDefaults()).not.toThrow();
      
      global.document = originalDocument;
    });
  });

  describe('autoFillDate', () => {
    it('should fill date input if empty', () => {
      document.body.innerHTML = '<input id="testInput" type="month">';
      
      autoFillDate('testInput');
      
      const currentMonth = getCurrentMonth();
      expect(document.getElementById('testInput').value).toBe(currentMonth);
    });

    it('should not override existing value', () => {
      document.body.innerHTML = '<input id="testInput" type="month" value="2024-01">';
      
      autoFillDate('testInput');
      
      expect(document.getElementById('testInput').value).toBe('2024-01');
    });

    it('should handle missing input gracefully', () => {
      expect(() => autoFillDate('nonexistent')).not.toThrow();
    });

    it('should handle undefined document gracefully', () => {
      const originalDocument = global.document;
      global.document = undefined;
      
      expect(() => autoFillDate('testInput')).not.toThrow();
      
      global.document = originalDocument;
    });
  });
});
