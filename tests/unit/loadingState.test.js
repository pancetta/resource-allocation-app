import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showLoading, hideLoading, withLoading } from '../../js/helpers/loadingState.js';

describe('Loading State Manager', () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
  });

  describe('showLoading', () => {
    it('should create loading overlay if it does not exist', () => {
      showLoading();
      
      const overlay = document.getElementById('loading-overlay');
      expect(overlay).not.toBeNull();
      expect(overlay.className).toBe('loading-overlay');
    });

    it('should reuse existing loading overlay', () => {
      showLoading('First message');
      showLoading('Second message');
      
      const overlays = document.querySelectorAll('#loading-overlay');
      expect(overlays.length).toBe(1);
    });

    it('should show overlay with default message', () => {
      showLoading();
      
      const message = document.querySelector('.loading-message');
      expect(message.textContent).toBe('Loading...');
    });

    it('should show overlay with custom message', () => {
      showLoading('Please wait...');
      
      const message = document.querySelector('.loading-message');
      expect(message.textContent).toBe('Please wait...');
    });

    it('should update message on subsequent calls', () => {
      showLoading('First message');
      showLoading('Second message');
      
      const message = document.querySelector('.loading-message');
      expect(message.textContent).toBe('Second message');
    });

    it('should display overlay', () => {
      showLoading();
      
      const overlay = document.getElementById('loading-overlay');
      expect(overlay.style.display).toBe('flex');
    });

    it('should contain spinner element', () => {
      showLoading();
      
      const spinner = document.querySelector('.spinner');
      expect(spinner).not.toBeNull();
    });

    it('should contain loading-spinner wrapper', () => {
      showLoading();
      
      const spinnerWrapper = document.querySelector('.loading-spinner');
      expect(spinnerWrapper).not.toBeNull();
    });

    it('should handle undefined document gracefully', () => {
      const originalDocument = global.document;
      global.document = undefined;
      
      // Should not throw
      expect(() => showLoading()).not.toThrow();
      
      global.document = originalDocument;
    });
  });

  describe('hideLoading', () => {
    it('should hide existing overlay', () => {
      showLoading();
      hideLoading();
      
      const overlay = document.getElementById('loading-overlay');
      expect(overlay.style.display).toBe('none');
    });

    it('should not throw if overlay does not exist', () => {
      expect(() => hideLoading()).not.toThrow();
    });

    it('should handle undefined document gracefully', () => {
      const originalDocument = global.document;
      global.document = undefined;
      
      // Should not throw
      expect(() => hideLoading()).not.toThrow();
      
      global.document = originalDocument;
    });
  });

  describe('withLoading', () => {
    it('should show loading before async function', async () => {
      const asyncFn = vi.fn(async () => {
        // Check that loading is shown during execution
        const overlay = document.getElementById('loading-overlay');
        expect(overlay.style.display).toBe('flex');
        return 'result';
      });
      
      await withLoading(asyncFn);
      
      expect(asyncFn).toHaveBeenCalled();
    });

    it('should hide loading after async function completes', async () => {
      const asyncFn = async () => 'result';
      
      await withLoading(asyncFn);
      
      const overlay = document.getElementById('loading-overlay');
      expect(overlay.style.display).toBe('none');
    });

    it('should return async function result', async () => {
      const asyncFn = async () => 'test result';
      
      const result = await withLoading(asyncFn);
      
      expect(result).toBe('test result');
    });

    it('should use custom message', async () => {
      const asyncFn = async () => {
        const message = document.querySelector('.loading-message');
        expect(message.textContent).toBe('Custom message');
      };
      
      await withLoading(asyncFn, 'Custom message');
    });

    it('should hide loading even if async function throws', async () => {
      const asyncFn = async () => {
        throw new Error('Test error');
      };
      
      try {
        await withLoading(asyncFn);
      } catch (e) {
        // Expected to throw
      }
      
      const overlay = document.getElementById('loading-overlay');
      expect(overlay.style.display).toBe('none');
    });

    it('should propagate errors from async function', async () => {
      const asyncFn = async () => {
        throw new Error('Test error');
      };
      
      await expect(withLoading(asyncFn)).rejects.toThrow('Test error');
    });

    it('should handle async function with delay', async () => {
      vi.useFakeTimers();
      
      const asyncFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return 'delayed result';
      };
      
      const promise = withLoading(asyncFn);
      
      // Loading should be shown immediately
      expect(document.getElementById('loading-overlay').style.display).toBe('flex');
      
      // Advance timers
      vi.advanceTimersByTime(1000);
      
      const result = await promise;
      expect(result).toBe('delayed result');
      
      // Loading should be hidden after completion
      expect(document.getElementById('loading-overlay').style.display).toBe('none');
      
      vi.useRealTimers();
    });
  });
});
