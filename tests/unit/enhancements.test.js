import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initUndoRedoButtons, initHelpPanel, initAutoSaveIndicator, initUIEnhancements } from '../../js/ui/enhancements.js';

// Mock dependencies
vi.mock('../../js/helpers/undoManager.js', () => ({
  undo: vi.fn(async () => true),
  redo: vi.fn(async () => true),
  updateUndoRedoButtons: vi.fn()
}));

vi.mock('../../js/ui/toast.js', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn()
}));

describe('UI Enhancements', () => {
  describe('initUndoRedoButtons', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <button id="undoBtn"></button>
        <button id="redoBtn"></button>
      `;
    });

    it('should attach click handlers to undo button', async () => {
      initUndoRedoButtons();
      
      const undoBtn = document.getElementById('undoBtn');
      const clickEvent = new Event('click');
      
      await undoBtn.dispatchEvent(clickEvent);
      
      const { undo } = await import('../../js/helpers/undoManager.js');
      expect(undo).toHaveBeenCalled();
    });

    it('should attach click handlers to redo button', async () => {
      initUndoRedoButtons();
      
      const redoBtn = document.getElementById('redoBtn');
      const clickEvent = new Event('click');
      
      await redoBtn.dispatchEvent(clickEvent);
      
      const { redo } = await import('../../js/helpers/undoManager.js');
      expect(redo).toHaveBeenCalled();
    });

    it('should call updateUndoRedoButtons on init', async () => {
      initUndoRedoButtons();
      
      const { updateUndoRedoButtons } = await import('../../js/helpers/undoManager.js');
      expect(updateUndoRedoButtons).toHaveBeenCalled();
    });

    it('should handle missing buttons gracefully', () => {
      document.body.innerHTML = '';
      
      expect(() => initUndoRedoButtons()).not.toThrow();
    });

    it('should handle undefined document gracefully', () => {
      const originalDocument = global.document;
      global.document = undefined;
      
      expect(() => initUndoRedoButtons()).not.toThrow();
      
      global.document = originalDocument;
    });
  });

  describe('initHelpPanel', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <button id="helpBtn"></button>
        <button id="closeHelpBtn"></button>
        <div id="helpPanel"></div>
        <div id="helpPanelContent"></div>
      `;
    });

    it('should open help panel when help button is clicked', () => {
      initHelpPanel();
      
      const helpBtn = document.getElementById('helpBtn');
      const helpPanel = document.getElementById('helpPanel');
      
      helpBtn.click();
      
      expect(helpPanel.classList.contains('open')).toBe(true);
    });

    it('should close help panel when close button is clicked', () => {
      initHelpPanel();
      
      const helpBtn = document.getElementById('helpBtn');
      const closeHelpBtn = document.getElementById('closeHelpBtn');
      const helpPanel = document.getElementById('helpPanel');
      
      helpBtn.click();
      expect(helpPanel.classList.contains('open')).toBe(true);
      
      closeHelpBtn.click();
      expect(helpPanel.classList.contains('open')).toBe(false);
    });

    it('should close help panel on Escape key', () => {
      initHelpPanel();
      
      const helpBtn = document.getElementById('helpBtn');
      const helpPanel = document.getElementById('helpPanel');
      
      helpBtn.click();
      expect(helpPanel.classList.contains('open')).toBe(true);
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      
      expect(helpPanel.classList.contains('open')).toBe(false);
    });

    it('should not close on other keys', () => {
      initHelpPanel();
      
      const helpBtn = document.getElementById('helpBtn');
      const helpPanel = document.getElementById('helpPanel');
      
      helpBtn.click();
      expect(helpPanel.classList.contains('open')).toBe(true);
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(keyEvent);
      
      expect(helpPanel.classList.contains('open')).toBe(true);
    });

    it('should update help content on tab click', () => {
      document.body.innerHTML = `
        <button class="tab-button" data-tab="people">People</button>
        <div id="helpPanel"></div>
        <div id="helpPanelContent"></div>
      `;
      
      initHelpPanel();
      
      const tabButton = document.querySelector('.tab-button');
      const helpContent = document.getElementById('helpPanelContent');
      
      tabButton.click();
      
      expect(helpContent.innerHTML).toContain('People');
    });

    it('should handle missing elements gracefully', () => {
      document.body.innerHTML = '';
      
      expect(() => initHelpPanel()).not.toThrow();
    });

    it('should handle undefined document gracefully', () => {
      const originalDocument = global.document;
      global.document = undefined;
      
      expect(() => initHelpPanel()).not.toThrow();
      
      global.document = originalDocument;
    });
  });

  describe('initAutoSaveIndicator', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="autoSaveIndicator" style="display: none;">
          <span id="autoSaveText">All changes saved</span>
        </div>
      `;
    });

    it('should show auto-save indicator', () => {
      initAutoSaveIndicator();
      
      const indicator = document.getElementById('autoSaveIndicator');
      expect(indicator.style.display).toBe('flex');
    });

    it('should handle dataChanged events', () => {
      vi.useFakeTimers();
      
      initAutoSaveIndicator();
      
      const indicator = document.getElementById('autoSaveIndicator');
      const text = document.getElementById('autoSaveText');
      
      // Trigger dataChanged event
      document.dispatchEvent(new Event('dataChanged'));
      
      // Should show "Saving..."
      expect(text.textContent).toBe('Saving...');
      expect(indicator.classList.contains('saving')).toBe(true);
      
      // After timeout, should show "Saved"
      vi.advanceTimersByTime(1000);
      
      expect(text.textContent).toBe('All changes saved');
      expect(indicator.classList.contains('saved')).toBe(true);
      
      vi.useRealTimers();
    });

    it('should handle missing elements gracefully', () => {
      document.body.innerHTML = '';
      
      expect(() => initAutoSaveIndicator()).not.toThrow();
    });

    it('should handle undefined document gracefully', () => {
      const originalDocument = global.document;
      global.document = undefined;
      
      expect(() => initAutoSaveIndicator()).not.toThrow();
      
      global.document = originalDocument;
    });
  });

  describe('initUIEnhancements', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <button id="undoBtn"></button>
        <button id="redoBtn"></button>
        <button id="helpBtn"></button>
        <div id="helpPanel"></div>
        <div id="autoSaveIndicator">
          <span id="autoSaveText"></span>
        </div>
      `;
    });

    it('should initialize all UI enhancements', () => {
      expect(() => initUIEnhancements()).not.toThrow();
    });

    it('should handle undefined document gracefully', () => {
      const originalDocument = global.document;
      global.document = undefined;
      
      expect(() => initUIEnhancements()).not.toThrow();
      
      global.document = originalDocument;
    });
  });
});
