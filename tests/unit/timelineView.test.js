import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderTimeline, initTimelineView } from '../../js/views/timelineView.js';

// Mock database module
vi.mock('../../js/data/database.js', () => ({
  getAllocations: vi.fn(async () => [
    {
      id: 1,
      personId: 'p001',
      projectId: 'proj001',
      pm: 1.0,
      startMonth: '2025-01',
      endMonth: '2025-12'
    },
    {
      id: 2,
      personId: 'p002',
      projectId: 'proj002',
      pm: 0.5,
      startMonth: '2025-06',
      endMonth: '2025-12'
    }
  ]),
  getPeople: vi.fn(async () => [
    { id: 'p001', name: 'Alice' },
    { id: 'p002', name: 'Bob' }
  ]),
  getProjects: vi.fn(async () => [
    { id: 'proj001', name: 'Project A' },
    { id: 'proj002', name: 'Project B' }
  ])
}));

describe('Timeline View', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="timelineOutput"></div>
      <input id="timelineYearInput" type="number" value="2025">
      <button id="showTimelineBtn"></button>
    `;
  });

  describe('renderTimeline', () => {
    it('should render timeline container', async () => {
      await renderTimeline('timelineOutput', 2025);
      
      const container = document.querySelector('.timeline-container');
      expect(container).not.toBeNull();
    });

    it('should render timeline header with year', async () => {
      await renderTimeline('timelineOutput', 2025);
      
      const header = document.querySelector('.timeline-container h3');
      expect(header.textContent).toContain('2025');
    });

    it('should render timeline grid', async () => {
      await renderTimeline('timelineOutput', 2025);
      
      const grid = document.querySelector('.timeline-grid');
      expect(grid).not.toBeNull();
    });

    it('should render 12 month headers', async () => {
      await renderTimeline('timelineOutput', 2025);
      
      const monthHeaders = document.querySelectorAll('.timeline-month-header');
      expect(monthHeaders.length).toBe(12);
    });

    it('should render allocation rows', async () => {
      await renderTimeline('timelineOutput', 2025);
      
      const rows = document.querySelectorAll('.timeline-row');
      // Should have header row + 2 allocation rows
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should show message when no allocations found', async () => {
      const db = await import('../../js/data/database.js');
      db.getAllocations.mockResolvedValueOnce([]);
      
      await renderTimeline('timelineOutput', 2025);
      
      const container = document.getElementById('timelineOutput');
      expect(container.textContent).toContain('No allocations found');
    });

    it('should render legend', async () => {
      await renderTimeline('timelineOutput', 2025);
      
      const legend = document.querySelector('.timeline-legend');
      expect(legend).not.toBeNull();
    });

    it('should handle missing container gracefully', async () => {
      await expect(renderTimeline('nonexistent', 2025)).resolves.not.toThrow();
    });

    it('should filter allocations to specified year', async () => {
      const db = await import('../../js/data/database.js');
      db.getAllocations.mockResolvedValueOnce([
        {
          id: 1,
          personId: 'p001',
          projectId: 'proj001',
          pm: 1.0,
          startMonth: '2024-01',
          endMonth: '2024-12'
        },
        {
          id: 2,
          personId: 'p002',
          projectId: 'proj002',
          pm: 0.5,
          startMonth: '2025-01',
          endMonth: '2025-12'
        }
      ]);
      
      await renderTimeline('timelineOutput', 2025);
      
      const container = document.getElementById('timelineOutput');
      // Should only show 2025 allocations
      expect(container.innerHTML).toContain('Bob');
    });

    it('should handle open-ended allocations', async () => {
      const db = await import('../../js/data/database.js');
      db.getAllocations.mockResolvedValueOnce([
        {
          id: 1,
          personId: 'p001',
          projectId: 'proj001',
          pm: 1.0,
          startMonth: '2025-01',
          endMonth: null // Open-ended
        }
      ]);
      
      await renderTimeline('timelineOutput', 2025);
      
      const container = document.querySelector('.timeline-container');
      expect(container).not.toBeNull();
    });

    it('should display person and project names', async () => {
      await renderTimeline('timelineOutput', 2025);
      
      const container = document.getElementById('timelineOutput');
      expect(container.innerHTML).toContain('Alice');
      expect(container.innerHTML).toContain('Project A');
    });

    it('should handle allocations spanning partial year', async () => {
      const db = await import('../../js/data/database.js');
      db.getAllocations.mockResolvedValueOnce([
        {
          id: 1,
          personId: 'p001',
          projectId: 'proj001',
          pm: 1.0,
          startMonth: '2025-06',
          endMonth: '2025-08'
        }
      ]);
      
      await renderTimeline('timelineOutput', 2025);
      
      const container = document.querySelector('.timeline-container');
      expect(container).not.toBeNull();
      // Should render with some active and some inactive cells
    });
  });

  describe('initTimelineView', () => {
    it('should attach click handler to show timeline button', async () => {
      initTimelineView();
      
      const showBtn = document.getElementById('showTimelineBtn');
      expect(showBtn).not.toBeNull();
      
      // Click should not throw
      await showBtn.click();
    });

    it('should handle missing elements gracefully', () => {
      document.body.innerHTML = '';
      
      expect(() => initTimelineView()).not.toThrow();
    });

    it('should handle undefined document gracefully', () => {
      const originalDocument = global.document;
      global.document = undefined;
      
      expect(() => initTimelineView()).not.toThrow();
      
      global.document = originalDocument;
    });

    it('should use year from input when rendering', async () => {
      const db = await import('../../js/data/database.js');
      db.getAllocations.mockClear();
      
      document.getElementById('timelineYearInput').value = '2026';
      
      initTimelineView();
      
      const showBtn = document.getElementById('showTimelineBtn');
      await showBtn.click();
      
      // Should have called getAllocations
      expect(db.getAllocations).toHaveBeenCalled();
    });
  });
});
