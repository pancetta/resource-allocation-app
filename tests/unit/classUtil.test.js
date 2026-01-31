import { describe, it, expect } from 'vitest';
import { cellClass } from '../../js/helpers/classUtil.js';

describe('Class Utilities', () => {
  describe('cellClass', () => {
    it('should return "correct" when actual equals expected', () => {
      expect(cellClass(5, 5)).toBe('correct');
      expect(cellClass(0, 0)).toBe('correct');
      expect(cellClass(1.5, 1.5)).toBe('correct');
    });

    it('should return "warning" when actual does not equal expected', () => {
      expect(cellClass(5, 3)).toBe('warning');
      expect(cellClass(0, 1)).toBe('warning');
      expect(cellClass(1.5, 2.0)).toBe('warning');
    });

    it('should handle negative numbers', () => {
      expect(cellClass(-1, -1)).toBe('correct');
      expect(cellClass(-1, 1)).toBe('warning');
    });
  });
});
