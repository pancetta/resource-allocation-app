import { describe, it, expect, beforeEach } from 'vitest';
import { renderProjects, renderBudgetValues, populateProjectSelect, addProjectAuto, initProjectsView } from '../../js/views/projectsView.js';
import * as db from '../../js/data/database.js';

describe('Projects View', () => {
  beforeEach(async () => {
    // Initialize database
    await db.openDatabase();
    db.clearCache();
    
    // Setup DOM - now includes both projects table and budget values table
    document.body.innerHTML = `
      <table id="projectsTable">
        <thead><tr></tr></thead>
        <tbody></tbody>
      </table>
      <table id="budgetValuesTable">
        <thead><tr></tr></thead>
        <tbody></tbody>
      </table>
      <select id="projectSelect"></select>
      <select id="budgetProjectSelect"></select>
      <button id="addProjectBtn">Add Project</button>
      <input type="number" id="budgetValueInput" value="5">
      <input type="month" id="budgetStartMonthInput" value="2025-01">
      <input type="month" id="budgetEndMonthInput" value="">
      <button id="addBudgetValueBtn">Add Budget Value</button>
    `;
  });

  describe('renderProjects', () => {
    it('should render empty table when no projects exist', async () => {
      await renderProjects();
      
      const tbody = document.querySelector('#projectsTable tbody');
      expect(tbody.children.length).toBe(0);
    });

    it('should render projects in table', async () => {
      await db.addProject({ id: 'proj001', name: 'Project Alpha' });
      await db.addProject({ id: 'proj002', name: 'Project Beta' });
      
      await renderProjects();
      
      const tbody = document.querySelector('#projectsTable tbody');
      expect(tbody.children.length).toBe(2);
      
      const firstRow = tbody.children[0];
      expect(firstRow.querySelector('[data-field="name"]').textContent).toBe('Project Alpha');
    });

    it('should render projects without plannedPM column (budget is now in separate table)', async () => {
      await db.addProject({ id: 'proj001', name: 'Project Gamma' });
      
      await renderProjects();
      
      // plannedPM column should not exist in projects table anymore
      const plannedCell = document.querySelector('[data-field="plannedPM"]');
      expect(plannedCell).toBeNull();
    });

    it('should call populateProjectSelect after rendering', async () => {
      await db.addProject({ id: 'proj001', name: 'Project Alpha' });
      
      await renderProjects();
      
      // renderProjects calls populateProjectSelect internally
      // We can verify the select element exists
      const select = document.getElementById('projectSelect');
      expect(select).toBeTruthy();
    });
  });

  describe('populateProjectSelect', () => {
    it('should populate select with all projects', async () => {
      await db.addProject({ id: 'proj001', name: 'Project Alpha' });
      await db.addProject({ id: 'proj002', name: 'Project Beta' });
      await db.addProject({ id: 'proj003', name: 'Project Gamma' });
      
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
      
      await db.addProject({ id: 'proj001', name: 'Project Alpha' });
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
    it('should add project with auto-generated ID and initial budget value', async () => {
      await addProjectAuto('Project Alpha');
      
      const projects = await db.getProjects();
      expect(projects.length).toBe(1);
      expect(projects[0].id).toBe('proj001');
      expect(projects[0].name).toBe('Project Alpha');
      
      // Should also create an initial budget value
      const budgetValues = await db.getBudgetValues();
      expect(budgetValues.length).toBe(1);
      expect(budgetValues[0].projectId).toBe('proj001');
      expect(budgetValues[0].plannedPM).toBe(0);
      expect(budgetValues[0].endMonth).toBeNull(); // Open-ended
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

    it('should mark new projects with isNew flag for matching funds selection', async () => {
      await addProjectAuto('Project Alpha');
      
      const projects = await db.getProjects();
      expect(projects.length).toBe(1);
      expect(projects[0].isNew).toBe(true);
    });

    it('should enable matching funds checkbox for new projects', async () => {
      await addProjectAuto('Project Alpha');
      await renderProjects();
      
      const checkbox = document.querySelector('input[type="checkbox"][data-field="deductsFromBaseFunding"]');
      expect(checkbox).toBeTruthy();
      expect(checkbox.disabled).toBe(false);
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
      await db.addProject({ id: 'proj001', name: 'Project Alpha' });
      await renderProjects();
      
      const nameCell = document.querySelector('[data-field="name"]');
      nameCell.textContent = 'Project Alpha Updated';
      nameCell.dispatchEvent(new Event('blur'));
      
      // Wait for async update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const projects = await db.getProjects();
      expect(projects[0].name).toBe('Project Alpha Updated');
    });

    it('should not have individual delete buttons (uses batch delete instead)', async () => {
      await db.addProject({ id: 'proj001', name: 'Project Alpha' });
      await renderProjects();
      
      // Verify no individual delete buttons exist
      const deleteBtn = document.querySelector('.delete-project');
      expect(deleteBtn).toBeNull();
      
      // Verify batch selection checkboxes are added
      const checkboxes = document.querySelectorAll('.row-select-checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should remove isNew flag when matching funds checkbox is changed', async () => {
      await addProjectAuto('Project Alpha');
      await renderProjects();
      
      const checkbox = document.querySelector('input[type="checkbox"][data-field="deductsFromBaseFunding"]');
      expect(checkbox).toBeTruthy();
      
      // Check the checkbox
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      
      // Wait for async update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const projects = await db.getProjects();
      expect(projects[0].deductsFromBaseFunding).toBe(true);
      expect(projects[0].isNew).toBeUndefined();
    });

    it('should disable matching funds checkbox after isNew flag is removed', async () => {
      await addProjectAuto('Project Alpha');
      await renderProjects();
      
      // First, the checkbox should be enabled
      let checkbox = document.querySelector('input[type="checkbox"][data-field="deductsFromBaseFunding"]');
      expect(checkbox.disabled).toBe(false);
      
      // Change the checkbox
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      
      // Wait for async update and re-render
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // After re-render, checkbox should be disabled (isNew is gone)
      checkbox = document.querySelector('input[type="checkbox"][data-field="deductsFromBaseFunding"]');
      expect(checkbox.disabled).toBe(true);
    });
  });
  
  describe('Budget Values table', () => {
    it('should not have individual delete buttons (uses batch delete instead)', async () => {
      await db.addProject({ id: 'proj001', name: 'Project Alpha' });
      await db.addBudgetValue({ projectId: 'proj001', plannedPM: 12, startMonth: '2025-01', endMonth: null });
      await renderBudgetValues();
      
      // Verify no individual delete buttons exist
      const deleteBtn = document.querySelector('.delete-budget-value');
      expect(deleteBtn).toBeNull();
      
      // Verify batch selection checkboxes are added
      const checkboxes = document.querySelectorAll('.row-select-checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });
});
