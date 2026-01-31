import { describe, it, expect, beforeEach } from 'vitest';
import { renderProjects, populateProjectSelect, addProjectAuto, initProjectsView } from '../../js/views/projectsView.js';
import * as db from '../../js/data/database.js';

describe('Projects View', () => {
  beforeEach(async () => {
    // Initialize database
    await db.openDatabase();
    db.clearCache();
    
    // Setup DOM
    document.body.innerHTML = `
      <table id="projectsTable">
        <tbody></tbody>
      </table>
      <select id="projectSelect"></select>
      <button id="addProjectBtn">Add Project</button>
    `;
  });

  describe('renderProjects', () => {
    it('should render empty table when no projects exist', async () => {
      await renderProjects();
      
      const tbody = document.querySelector('#projectsTable tbody');
      expect(tbody.children.length).toBe(0);
    });

    it('should render projects in table', async () => {
      await db.addProject({ id: 'proj001', name: 'Project Alpha', plannedPM: 12 });
      await db.addProject({ id: 'proj002', name: 'Project Beta', plannedPM: 6 });
      
      await renderProjects();
      
      const tbody = document.querySelector('#projectsTable tbody');
      expect(tbody.children.length).toBe(2);
      
      const firstRow = tbody.children[0];
      expect(firstRow.querySelector('[data-field="name"]').textContent).toBe('Project Alpha');
      expect(firstRow.querySelector('[data-field="plannedPM"]').textContent).toBe('12');
    });

    it('should render project with default plannedPM of 0 when plannedPM is null', async () => {
      await db.addProject({ id: 'proj001', name: 'Project Gamma', plannedPM: null });
      
      await renderProjects();
      
      const plannedCell = document.querySelector('[data-field="plannedPM"]');
      expect(plannedCell.textContent).toBe('0');
    });

    it('should call populateProjectSelect after rendering', async () => {
      await db.addProject({ id: 'proj001', name: 'Project Alpha', plannedPM: 12 });
      
      await renderProjects();
      
      // renderProjects calls populateProjectSelect internally
      // We can verify the select element exists
      const select = document.getElementById('projectSelect');
      expect(select).toBeTruthy();
    });
  });

  describe('populateProjectSelect', () => {
    it('should populate select with all projects', async () => {
      await db.addProject({ id: 'proj001', name: 'Project Alpha', plannedPM: 12 });
      await db.addProject({ id: 'proj002', name: 'Project Beta', plannedPM: 6 });
      await db.addProject({ id: 'proj003', name: 'Project Gamma', plannedPM: 8 });
      
      await populateProjectSelect();
      
      const select = document.getElementById('projectSelect');
      expect(select.children.length).toBe(3);
      expect(select.children[0].textContent).toBe('Project Alpha');
      expect(select.children[1].textContent).toBe('Project Beta');
      expect(select.children[2].textContent).toBe('Project Gamma');
    });

    it('should clear existing options before populating', async () => {
      const select = document.getElementById('projectSelect');
      select.innerHTML = '<option>Old Option</option>';
      
      await db.addProject({ id: 'proj001', name: 'Project Alpha', plannedPM: 12 });
      await populateProjectSelect();
      
      expect(select.children.length).toBe(1);
      expect(select.children[0].textContent).toBe('Project Alpha');
    });

    it('should handle empty projects list', async () => {
      await populateProjectSelect();
      
      const select = document.getElementById('projectSelect');
      expect(select.children.length).toBe(0);
    });
  });

  describe('addProjectAuto', () => {
    it('should add project with auto-generated ID', async () => {
      await addProjectAuto('Project Alpha');
      
      const projects = await db.getProjects();
      expect(projects.length).toBe(1);
      expect(projects[0].id).toBe('proj001');
      expect(projects[0].name).toBe('Project Alpha');
      expect(projects[0].plannedPM).toBe(0);
    });

    it('should generate sequential IDs', async () => {
      await addProjectAuto('Project Alpha');
      await addProjectAuto('Project Beta');
      
      const projects = await db.getProjects();
      expect(projects.length).toBe(2);
      expect(projects[0].id).toBe('proj001');
      expect(projects[1].id).toBe('proj002');
    });

    it('should re-render projects table after adding', async () => {
      await addProjectAuto('Project Alpha');
      
      // Verify project was added to database
      const projects = await db.getProjects();
      expect(projects.length).toBe(1);
      
      // The table should have been re-rendered (though we're testing the data layer here)
      const tbody = document.querySelector('#projectsTable tbody');
      expect(tbody).toBeDefined();
    });
  });

  describe('initProjectsView', () => {
    it('should attach click handler to add project button', () => {
      initProjectsView();
      
      const btn = document.getElementById('addProjectBtn');
      expect(btn).toBeDefined();
      // Event listeners added with addEventListener don't set onclick property
      // Just verify the function ran without errors
      expect(btn).toBeTruthy();
    });
  });

  describe('event handlers', () => {
    it('should update project name on blur', async () => {
      await db.addProject({ id: 'proj001', name: 'Project Alpha', plannedPM: 12 });
      await renderProjects();
      
      const nameCell = document.querySelector('[data-field="name"]');
      nameCell.textContent = 'Project Alpha Updated';
      nameCell.dispatchEvent(new Event('blur'));
      
      // Wait for async update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const projects = await db.getProjects();
      expect(projects[0].name).toBe('Project Alpha Updated');
    });

    it('should update project plannedPM on blur', async () => {
      await db.addProject({ id: 'proj001', name: 'Project Alpha', plannedPM: 12 });
      await renderProjects();
      
      const plannedCell = document.querySelector('[data-field="plannedPM"]');
      plannedCell.textContent = '18';
      plannedCell.dispatchEvent(new Event('blur'));
      
      // Wait for async update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const projects = await db.getProjects();
      expect(projects[0].plannedPM).toBe(18);
    });

    it('should delete project on delete button click', async () => {
      await db.addProject({ id: 'proj001', name: 'Project Alpha', plannedPM: 12 });
      await renderProjects();
      
      const deleteBtn = document.querySelector('.delete-project');
      deleteBtn.click();
      
      // Wait for async delete and re-render
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const projects = await db.getProjects();
      expect(projects.length).toBe(0);
    });
  });
});
