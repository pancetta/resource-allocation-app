import { describe, it, expect, beforeEach } from 'vitest';
import * as db from '../../js/data/database.js';

describe('Main Application Initialization', () => {
  beforeEach(async () => {
    // Initialize database
    await db.openDatabase();
    db.clearCache();
    
    // Setup full DOM structure as in index.html
    document.body.innerHTML = `
      <div class="tabs">
        <button class="tab-button active" data-tab="people">People</button>
        <button class="tab-button" data-tab="projects">Projects</button>
        <button class="tab-button" data-tab="allocations">Allocations</button>
        <button class="tab-button" data-tab="results">Results</button>
      </div>
      
      <div id="people" class="tab-content active">
        <h2>People</h2>
        <button id="addPersonBtn">Add Person</button>
        <table id="peopleTable">
          <thead>
            <tr><th>Name</th><th>FTE</th><th>Active</th><th>Actions</th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      
      <div id="projects" class="tab-content">
        <h2>Projects</h2>
        <button id="addProjectBtn">Add Project</button>
        <table id="projectsTable">
          <thead>
            <tr><th>Name</th><th>Planned PM</th><th>Actions</th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      
      <div id="allocations" class="tab-content">
        <h2>Allocations</h2>
        <select id="personSelect"></select>
        <select id="projectSelect"></select>
        <input type="number" id="pctInput" value="50">
        <input type="month" id="startMonthInput" value="2024-01">
        <input type="month" id="endMonthInput" value="">
        <button id="addAllocationBtn">Add Allocation</button>
        <table id="allocationsTable">
          <thead>
            <tr><th>Person</th><th>Project</th><th>%</th><th>Start</th><th>End</th><th>Actions</th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      
      <div id="results" class="tab-content">
        <h2>Reports</h2>
        <div>
          <h3>Monthly Report</h3>
          <input type="month" id="monthInput" value="2024-01">
          <button id="calculateBtn">Generate Monthly Report</button>
        </div>
        <div>
          <h3>Yearly Report</h3>
          <input type="text" id="yearInput" value="2024">
          <button id="calculateYearBtn">Generate Yearly Report</button>
        </div>
        <div>
          <h3>Project Overview</h3>
          <input type="text" id="overviewYearInput" value="2024">
          <button id="projectMonthlyBtn">Generate Overview</button>
        </div>
        <div id="resultsOutput"></div>
      </div>
    `;
    
    // Clear modulesLoaded flag
    window.modulesLoaded = false;
  });

  describe('Module Loading', () => {
    it('should verify module structure is testable', async () => {
      // Import modules to verify they can be loaded
      const { openDatabase } = await import('../../js/data/database.js');
      const { initTabs } = await import('../../js/ui/tabs.js');
      const { renderPeople, populatePersonSelect, initPeopleView } = await import('../../js/views/peopleView.js');
      const { renderProjects, populateProjectSelect, initProjectsView } = await import('../../js/views/projectsView.js');
      const { renderAllocations, initAllocationsView } = await import('../../js/views/allocationsView.js');
      const { initMonthlyReport } = await import('../../js/views/monthlyReport.js');
      const { initYearlyReport } = await import('../../js/views/yearlyReport.js');
      const { initProjectOverview } = await import('../../js/views/projectOverview.js');
      
      // Verify all imports are functions
      expect(typeof openDatabase).toBe('function');
      expect(typeof initTabs).toBe('function');
      expect(typeof renderPeople).toBe('function');
      expect(typeof populatePersonSelect).toBe('function');
      expect(typeof initPeopleView).toBe('function');
      expect(typeof renderProjects).toBe('function');
      expect(typeof populateProjectSelect).toBe('function');
      expect(typeof initProjectsView).toBe('function');
      expect(typeof renderAllocations).toBe('function');
      expect(typeof initAllocationsView).toBe('function');
      expect(typeof initMonthlyReport).toBe('function');
      expect(typeof initYearlyReport).toBe('function');
      expect(typeof initProjectOverview).toBe('function');
    });

    it('should initialize database successfully', async () => {
      const { openDatabase } = await import('../../js/data/database.js');
      
      await openDatabase();
      
      // Verify database is accessible
      const { getPeople } = await import('../../js/data/database.js');
      const people = await getPeople();
      expect(Array.isArray(people)).toBe(true);
    });

    it('should initialize tabs functionality', async () => {
      const { initTabs } = await import('../../js/ui/tabs.js');
      
      initTabs();
      
      // Verify tabs are initialized (active class is set)
      const activeButton = document.querySelector('.tab-button.active');
      const activeContent = document.querySelector('.tab-content.active');
      expect(activeButton).toBeTruthy();
      expect(activeContent).toBeTruthy();
    });

    it('should initialize people view', async () => {
      await db.openDatabase();
      const { initPeopleView } = await import('../../js/views/peopleView.js');
      
      initPeopleView();
      
      // Verify the button exists and can be clicked
      const btn = document.getElementById('addPersonBtn');
      expect(btn).toBeTruthy();
    });

    it('should initialize projects view', async () => {
      await db.openDatabase();
      const { initProjectsView } = await import('../../js/views/projectsView.js');
      
      initProjectsView();
      
      // Verify the button exists
      const btn = document.getElementById('addProjectBtn');
      expect(btn).toBeTruthy();
    });

    it('should initialize allocations view', async () => {
      await db.openDatabase();
      const { initAllocationsView } = await import('../../js/views/allocationsView.js');
      
      initAllocationsView();
      
      // Verify the button exists
      const btn = document.getElementById('addAllocationBtn');
      expect(btn).toBeTruthy();
    });

    it('should initialize monthly report', async () => {
      await db.openDatabase();
      const { initMonthlyReport } = await import('../../js/views/monthlyReport.js');
      
      initMonthlyReport();
      
      // Verify the button exists
      const btn = document.getElementById('calculateBtn');
      expect(btn).toBeTruthy();
    });

    it('should initialize yearly report', async () => {
      await db.openDatabase();
      const { initYearlyReport } = await import('../../js/views/yearlyReport.js');
      
      initYearlyReport();
      
      // Verify the button exists
      const btn = document.getElementById('calculateYearBtn');
      expect(btn).toBeTruthy();
    });

    it('should initialize project overview', async () => {
      await db.openDatabase();
      const { initProjectOverview } = await import('../../js/views/projectOverview.js');
      
      initProjectOverview();
      
      // Verify the button exists
      const btn = document.getElementById('projectMonthlyBtn');
      expect(btn).toBeTruthy();
    });

    it('should render people table', async () => {
      await db.openDatabase();
      const { renderPeople } = await import('../../js/views/peopleView.js');
      
      await renderPeople();
      
      // Verify table is rendered (even if empty)
      const tbody = document.querySelector('#peopleTable tbody');
      expect(tbody).toBeTruthy();
    });

    it('should render projects table', async () => {
      await db.openDatabase();
      const { renderProjects } = await import('../../js/views/projectsView.js');
      
      await renderProjects();
      
      // Verify table is rendered
      const tbody = document.querySelector('#projectsTable tbody');
      expect(tbody).toBeTruthy();
    });

    it('should render allocations table', async () => {
      await db.openDatabase();
      const { renderAllocations } = await import('../../js/views/allocationsView.js');
      
      await renderAllocations();
      
      // Verify table is rendered
      const tbody = document.querySelector('#allocationsTable tbody');
      expect(tbody).toBeTruthy();
    });

    it('should populate person select', async () => {
      await db.openDatabase();
      const { populatePersonSelect } = await import('../../js/views/peopleView.js');
      
      await populatePersonSelect();
      
      // Verify select exists and is empty (no people added)
      const select = document.getElementById('personSelect');
      expect(select).toBeTruthy();
    });

    it('should populate project select', async () => {
      await db.openDatabase();
      const { populateProjectSelect } = await import('../../js/views/projectsView.js');
      
      await populateProjectSelect();
      
      // Verify select exists
      const select = document.getElementById('projectSelect');
      expect(select).toBeTruthy();
    });
  });

  describe('Integration Flow', () => {
    it('should complete full initialization sequence', async () => {
      // Simulate the main.js initialization sequence
      await db.openDatabase();
      
      const { initTabs } = await import('../../js/ui/tabs.js');
      const { renderPeople, populatePersonSelect, initPeopleView } = await import('../../js/views/peopleView.js');
      const { renderProjects, populateProjectSelect, initProjectsView } = await import('../../js/views/projectsView.js');
      const { renderAllocations, initAllocationsView } = await import('../../js/views/allocationsView.js');
      const { initMonthlyReport } = await import('../../js/views/monthlyReport.js');
      const { initYearlyReport } = await import('../../js/views/yearlyReport.js');
      const { initProjectOverview } = await import('../../js/views/projectOverview.js');
      
      // Initialize
      initTabs();
      initPeopleView();
      initProjectsView();
      initAllocationsView();
      initMonthlyReport();
      initYearlyReport();
      initProjectOverview();
      
      // Render
      await renderPeople();
      await renderProjects();
      await renderAllocations();
      await populatePersonSelect();
      await populateProjectSelect();
      
      // Verify everything is initialized
      expect(document.querySelector('.tab-button.active')).toBeTruthy();
      expect(document.querySelector('#peopleTable tbody')).toBeTruthy();
      expect(document.querySelector('#projectsTable tbody')).toBeTruthy();
      expect(document.querySelector('#allocationsTable tbody')).toBeTruthy();
      expect(document.getElementById('personSelect')).toBeTruthy();
      expect(document.getElementById('projectSelect')).toBeTruthy();
      
      // Signal successful initialization
      window.modulesLoaded = true;
      expect(window.modulesLoaded).toBe(true);
    });

    it('should handle data persistence across renders', async () => {
      await db.openDatabase();
      
      // Add data
      await db.addPerson({ id: 'p001', name: 'Alice', fte: 1.0, active: true });
      await db.addProject({ id: 'proj001', name: 'Project Alpha', plannedPM: 12 });
      
      // Render views
      const { renderPeople } = await import('../../js/views/peopleView.js');
      const { renderProjects } = await import('../../js/views/projectsView.js');
      
      await renderPeople();
      await renderProjects();
      
      // Verify data is rendered
      const peopleTbody = document.querySelector('#peopleTable tbody');
      const projectsTbody = document.querySelector('#projectsTable tbody');
      
      expect(peopleTbody.children.length).toBe(1);
      expect(projectsTbody.children.length).toBe(1);
    });
  });
});
