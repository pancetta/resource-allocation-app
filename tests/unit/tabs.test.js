import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initTabs } from '../../js/ui/tabs.js';

describe('Tab Management', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div>
        <button class="tab-button" data-tab="people">People</button>
        <button class="tab-button" data-tab="projects">Projects</button>
        <button class="tab-button" data-tab="allocations">Allocations</button>
      </div>
      <div>
        <div id="people" class="tab-content">People Content</div>
        <div id="projects" class="tab-content">Projects Content</div>
        <div id="allocations" class="tab-content">Allocations Content</div>
      </div>
    `;
    
    // Clear localStorage
    localStorage.clear();
  });

  describe('initTabs', () => {
    it('should initialize tabs and activate the first tab by default', () => {
      initTabs();
      
      const firstButton = document.querySelector('.tab-button');
      const firstContent = document.querySelector('.tab-content');
      
      expect(firstButton.classList.contains('active')).toBe(true);
      expect(firstContent.classList.contains('active')).toBe(true);
    });

    it('should restore last active tab from localStorage', () => {
      localStorage.setItem('lastActiveTab', 'projects');
      
      initTabs();
      
      const projectsButton = document.querySelector('.tab-button[data-tab="projects"]');
      const projectsContent = document.getElementById('projects');
      
      expect(projectsButton.classList.contains('active')).toBe(true);
      expect(projectsContent.classList.contains('active')).toBe(true);
    });

    it('should switch tabs when clicking tab buttons', () => {
      initTabs();
      
      const projectsButton = document.querySelector('.tab-button[data-tab="projects"]');
      projectsButton.click();
      
      // Check that projects tab is now active
      expect(projectsButton.classList.contains('active')).toBe(true);
      expect(document.getElementById('projects').classList.contains('active')).toBe(true);
      
      // Check that other tabs are not active
      expect(document.querySelector('.tab-button[data-tab="people"]').classList.contains('active')).toBe(false);
      expect(document.getElementById('people').classList.contains('active')).toBe(false);
    });

    it('should save active tab to localStorage when switching', () => {
      initTabs();
      
      const allocationsButton = document.querySelector('.tab-button[data-tab="allocations"]');
      allocationsButton.click();
      
      expect(localStorage.getItem('lastActiveTab')).toBe('allocations');
    });

    it('should handle missing last active tab gracefully', () => {
      localStorage.setItem('lastActiveTab', 'nonexistent-tab');
      
      initTabs();
      
      // Should activate first tab when saved tab doesn't exist
      const firstButton = document.querySelector('.tab-button');
      const firstContent = document.querySelector('.tab-content');
      
      expect(firstButton.classList.contains('active')).toBe(true);
      expect(firstContent.classList.contains('active')).toBe(true);
    });

    it('should deactivate all other tabs when switching', () => {
      initTabs();
      
      // Activate projects
      document.querySelector('.tab-button[data-tab="projects"]').click();
      
      // Now activate allocations
      document.querySelector('.tab-button[data-tab="allocations"]').click();
      
      // Projects should no longer be active
      expect(document.querySelector('.tab-button[data-tab="projects"]').classList.contains('active')).toBe(false);
      expect(document.getElementById('projects').classList.contains('active')).toBe(false);
      
      // Allocations should be active
      expect(document.querySelector('.tab-button[data-tab="allocations"]').classList.contains('active')).toBe(true);
      expect(document.getElementById('allocations').classList.contains('active')).toBe(true);
    });
  });
});
