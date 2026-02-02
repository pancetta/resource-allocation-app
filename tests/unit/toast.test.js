import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showToast, showSuccess, showError, showWarning, showInfo } from '../../js/ui/toast.js';

describe('Toast Notification System', () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
    // Clear all timers
    vi.clearAllTimers();
  });

  describe('showToast', () => {
    it('should create toast container if it does not exist', () => {
      showToast('Test message');
      
      const container = document.getElementById('toast-container');
      expect(container).not.toBeNull();
      expect(container.className).toBe('toast-container');
    });

    it('should reuse existing toast container', () => {
      showToast('First message');
      showToast('Second message');
      
      const containers = document.querySelectorAll('#toast-container');
      expect(containers.length).toBe(1);
    });

    it('should create toast with correct message', () => {
      showToast('Test message');
      
      const toast = document.querySelector('.toast');
      const message = toast.querySelector('.toast-message');
      expect(message.textContent).toBe('Test message');
    });

    it('should create toast with default info type', () => {
      showToast('Test message');
      
      const toast = document.querySelector('.toast');
      expect(toast.classList.contains('toast-info')).toBe(true);
    });

    it('should create toast with success type', () => {
      showToast('Success message', 'success');
      
      const toast = document.querySelector('.toast');
      expect(toast.classList.contains('toast-success')).toBe(true);
      expect(toast.querySelector('.toast-icon').textContent).toBe('✓');
    });

    it('should create toast with error type', () => {
      showToast('Error message', 'error');
      
      const toast = document.querySelector('.toast');
      expect(toast.classList.contains('toast-error')).toBe(true);
      expect(toast.querySelector('.toast-icon').textContent).toBe('✗');
    });

    it('should create toast with warning type', () => {
      showToast('Warning message', 'warning');
      
      const toast = document.querySelector('.toast');
      expect(toast.classList.contains('toast-warning')).toBe(true);
      expect(toast.querySelector('.toast-icon').textContent).toBe('⚠');
    });

    it('should add close button to toast', () => {
      showToast('Test message');
      
      const closeBtn = document.querySelector('.toast-close');
      expect(closeBtn).not.toBeNull();
      expect(closeBtn.getAttribute('aria-label')).toBe('Close');
    });

    it('should remove toast when close button is clicked', () => {
      vi.useFakeTimers();
      showToast('Test message');
      
      const closeBtn = document.querySelector('.toast-close');
      closeBtn.click();
      
      // Wait for animation
      vi.advanceTimersByTime(300);
      
      const toast = document.querySelector('.toast');
      expect(toast).toBeNull();
      
      vi.useRealTimers();
    });

    it('should add show class after delay', () => {
      vi.useFakeTimers();
      showToast('Test message');
      
      let toast = document.querySelector('.toast');
      expect(toast.classList.contains('toast-show')).toBe(false);
      
      vi.advanceTimersByTime(10);
      
      toast = document.querySelector('.toast');
      expect(toast.classList.contains('toast-show')).toBe(true);
      
      vi.useRealTimers();
    });

    it('should auto-remove toast after duration', () => {
      vi.useFakeTimers();
      showToast('Test message', 'info', 3000);
      
      expect(document.querySelector('.toast')).not.toBeNull();
      
      // Advance past duration + animation time
      vi.advanceTimersByTime(3300);
      
      expect(document.querySelector('.toast')).toBeNull();
      
      vi.useRealTimers();
    });

    it('should handle custom duration', () => {
      vi.useFakeTimers();
      showToast('Test message', 'info', 5000);
      
      // After 3 seconds, toast should still exist
      vi.advanceTimersByTime(3000);
      expect(document.querySelector('.toast')).not.toBeNull();
      
      // After 5 seconds + animation, should be removed
      vi.advanceTimersByTime(2300);
      expect(document.querySelector('.toast')).toBeNull();
      
      vi.useRealTimers();
    });

    it('should support multiple toasts', () => {
      showToast('First message');
      showToast('Second message');
      showToast('Third message');
      
      const toasts = document.querySelectorAll('.toast');
      expect(toasts.length).toBe(3);
    });

    it('should handle undefined document gracefully', () => {
      const originalDocument = global.document;
      global.document = undefined;
      
      // Should not throw
      expect(() => showToast('Test')).not.toThrow();
      
      global.document = originalDocument;
    });
  });

  describe('Convenience methods', () => {
    it('showSuccess should create success toast', () => {
      showSuccess('Success!');
      
      const toast = document.querySelector('.toast');
      expect(toast.classList.contains('toast-success')).toBe(true);
      expect(toast.querySelector('.toast-message').textContent).toBe('Success!');
    });

    it('showError should create error toast', () => {
      showError('Error!');
      
      const toast = document.querySelector('.toast');
      expect(toast.classList.contains('toast-error')).toBe(true);
      expect(toast.querySelector('.toast-message').textContent).toBe('Error!');
    });

    it('showWarning should create warning toast', () => {
      showWarning('Warning!');
      
      const toast = document.querySelector('.toast');
      expect(toast.classList.contains('toast-warning')).toBe(true);
      expect(toast.querySelector('.toast-message').textContent).toBe('Warning!');
    });

    it('showInfo should create info toast', () => {
      showInfo('Info!');
      
      const toast = document.querySelector('.toast');
      expect(toast.classList.contains('toast-info')).toBe(true);
      expect(toast.querySelector('.toast-message').textContent).toBe('Info!');
    });

    it('convenience methods should support custom duration', () => {
      vi.useFakeTimers();
      showSuccess('Test', 1000);
      
      vi.advanceTimersByTime(1300);
      expect(document.querySelector('.toast')).toBeNull();
      
      vi.useRealTimers();
    });
  });
});
