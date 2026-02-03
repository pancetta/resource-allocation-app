/**
 * Projects View
 * 
 * Manages the projects table and budget values table in the UI.
 * Handles rendering, event listeners, and CRUD operations for projects
 * and their planned person-month budgets over time.
 */

import { getProjects, updateProject, deleteProject, addProject, generateProjectId, getBudgetValues, addBudgetValue, updateBudgetValue, deleteBudgetValue } from '../data/database.js';
import { scheduleAutoBackup } from '../main.js';
import { validateBudgetValueDeletion, validatePlannedPM } from '../helpers/validationHelper.js';
import { projectsSchema, getTableHeaders, getEditableFields } from '../config/entitySchemas.js';
import { showSuccess } from '../ui/toast.js';
import { saveState } from '../helpers/undoManager.js';
import { addQuickAddRow } from '../helpers/quickAdd.js';
import { addBatchSelection, getSelectedRows } from '../helpers/tableHelpers.js';
import { addBatchOperationsToolbar, updateBatchToolbar } from '../helpers/batchOperations.js';
import { createValidatedBatchDeleteHandler, createCascadeBatchDeleteHandler } from '../helpers/batchDeleteHelpers.js';

/**
 * Render projects table (basic project info)
 * Displays all projects with editable name field
 */
export async function renderProjects() {
    if (typeof document === 'undefined') return;
    
    const table = document.querySelector("#projectsTable");
    if (!table) return;
    
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    
    const thead = table.querySelector("thead");
    
    // Render headers from schema if thead exists
    if (thead) {
        const headers = getTableHeaders(projectsSchema);
        thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    }
    
    tbody.innerHTML = "";
    const projects = await getProjects();
    
    projects.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td contenteditable="true" data-id="${p.id}" data-field="name">${p.name}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add batch selection checkbox column after rendering
    // (this is idempotent - won't duplicate if already added)
    addBatchSelection(table, (selectedCount, totalCount) => {
        const toolbar = table.previousElementSibling;
        if (toolbar && toolbar.classList.contains('batch-toolbar')) {
            updateBatchToolbar(toolbar, selectedCount, totalCount);
        }
    });
    
    // Attach event listeners
    attachProjectsEventListeners();
    populateProjectSelect();
}

// Render budget values table (time-based budget entries)
export async function renderBudgetValues() {
    if (typeof document === 'undefined') return;
    
    const table = document.querySelector("#budgetValuesTable");
    if (!table) return;
    
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    
    const thead = table.querySelector("thead");
    
    // Render headers if thead exists
    if (thead) {
        thead.innerHTML = `<tr><th>Project</th><th>Planned PM</th><th>Start Month</th><th>End Month</th></tr>`;
    }
    
    tbody.innerHTML = "";
    const budgetValues = await getBudgetValues();
    const projects = await getProjects();
    
    // Sort by project and start month
    const sortedValues = budgetValues.sort((a, b) => {
        if (a.projectId !== b.projectId) {
            return a.projectId.localeCompare(b.projectId);
        }
        return a.startMonth.localeCompare(b.startMonth);
    });
    
    sortedValues.forEach(value => {
        const project = projects.find(p => p.id === value.projectId);
        const projectName = project ? project.name : value.projectId;
        
        const tr = document.createElement("tr");
        tr.dataset.id = value.id; // Add data-id for batch selection
        tr.innerHTML = `
            <td>${projectName}</td>
            <td contenteditable="true" data-id="${value.id}" data-field="plannedPM">${value.plannedPM}</td>
            <td><input type="month" class="budget-start" value="${value.startMonth}" data-id="${value.id}"></td>
            <td><input type="month" class="budget-end" value="${value.endMonth || ''}" data-id="${value.id}"></td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add batch selection checkbox column after rendering
    addBatchSelection(table, (selectedCount, totalCount) => {
        const toolbar = table.previousElementSibling;
        if (toolbar && toolbar.classList.contains('batch-toolbar')) {
            updateBatchToolbar(toolbar, selectedCount, totalCount);
        }
    });
    
    // Attach event listeners
    attachBudgetValueEventListeners();
    populateBudgetProjectSelect();
}

function attachProjectsEventListeners() {
    // Content editable blur handlers
    document.querySelectorAll("#projectsTable td[contenteditable]").forEach(td => {
        td.addEventListener("blur", async function() {
            const id = this.dataset.id;
            const field = this.dataset.field;
            const value = this.textContent;
            
            const projects = await getProjects();
            const project = projects.find(p => p.id === id);
            if (!project) {
                console.error(`Project with id ${id} not found`);
                return;
            }
            
            if (field === "name") {
                project.name = value;
                populateProjectSelect();
                renderBudgetValues(); // Update budget table in case project name changed
            }
            
            await updateProject(project);
            scheduleAutoBackup();
        });
    });
    

}

function attachBudgetValueEventListeners() {
    if (typeof document === 'undefined') return;
    
    // Content editable blur handlers
    document.querySelectorAll("#budgetValuesTable td[contenteditable]").forEach(td => {
        td.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const field = this.dataset.field;
            const value = this.textContent;
            
            const budgetValues = await getBudgetValues();
            const budgetValue = budgetValues.find(v => v.id === id);
            
            if (field === "plannedPM") {
                const validation = validatePlannedPM(value);
                if (!validation.valid) {
                    alert(validation.message);
                    // Revert to original value
                    this.textContent = budgetValue.plannedPM;
                    return;
                }
                budgetValue.plannedPM = parseFloat(value);
            }
            
            await updateBudgetValue(budgetValue);
            scheduleAutoBackup();
        });
    });
    
    // Start month input blur handlers
    document.querySelectorAll(".budget-start").forEach(input => {
        input.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const budgetValues = await getBudgetValues();
            const budgetValue = budgetValues.find(v => v.id === id);
            budgetValue.startMonth = this.value;
            await updateBudgetValue(budgetValue);
            scheduleAutoBackup();
        });
    });
    
    // End month input blur handlers
    document.querySelectorAll(".budget-end").forEach(input => {
        input.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const budgetValues = await getBudgetValues();
            const budgetValue = budgetValues.find(v => v.id === id);
            budgetValue.endMonth = this.value || null;
            await updateBudgetValue(budgetValue);
            scheduleAutoBackup();
        });
    });
    

}

// Populate project select dropdown
export async function populateProjectSelect() {
    if (typeof document === 'undefined') return;
    
    const select = document.getElementById("projectSelect");
    if (!select) return;
    
    select.innerHTML = "";
    const projects = await getProjects();
    
    projects.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.name;
        select.appendChild(option);
    });
}

// Populate budget project select dropdown
export async function populateBudgetProjectSelect() {
    if (typeof document === 'undefined') return;
    
    const select = document.getElementById("budgetProjectSelect");
    if (!select) return;
    
    select.innerHTML = "";
    const projects = await getProjects();
    
    projects.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.name;
        select.appendChild(option);
    });
}

// Add project with auto-generated ID and initial budget value
export async function addProjectAuto(name) {
    // Save state for undo
    await saveState(`Add project: ${name}`);
    
    const id = await generateProjectId();
    await addProject({ id, name });
    
    // Create initial budget value for the project
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    await addBudgetValue({
        projectId: id,
        plannedPM: 0,
        startMonth: currentMonth,
        endMonth: null // Open-ended
    });
    
    scheduleAutoBackup();
    renderProjects();
    renderBudgetValues();
    showSuccess(`Added project: ${name}`);
}

// Initialize projects view
export function initProjectsView() {
    if (typeof document === 'undefined') return;
    
    const addProjectBtn = document.getElementById("addProjectBtn");
    if (addProjectBtn) {
        addProjectBtn.addEventListener("click", async () => {
            const projectsTable = document.getElementById("projectsTable");
            if (!projectsTable) return;
            
            // Add quick-add row
            addQuickAddRow(
                projectsTable,
                ['Enter project name...'],
                async (values) => {
                    const name = values[0];
                    if (name) {
                        await addProjectAuto(name);
                    }
                }
            );
        });
    }
    
    const addBudgetValueBtn = document.getElementById("addBudgetValueBtn");
    if (addBudgetValueBtn) {
        addBudgetValueBtn.addEventListener("click", async () => {
            const projectId = document.getElementById("budgetProjectSelect").value;
            const plannedPM = parseFloat(document.getElementById("budgetValueInput").value);
            const startMonth = document.getElementById("budgetStartMonthInput").value;
            const endMonth = document.getElementById("budgetEndMonthInput").value || null;
            
            if (!projectId || !startMonth) {
                alert("Please select a project and start month");
                return;
            }
            
            await addBudgetValue({
                projectId,
                plannedPM,
                startMonth,
                endMonth
            });
            scheduleAutoBackup();
            renderBudgetValues();
        });
    }
    
    // Initialize table enhancements
    import('../helpers/tableHelpers.js').then(({ makeTableSortable, addTableFilter }) => {
        const projectsTable = document.getElementById("projectsTable");
        const budgetValuesTable = document.getElementById("budgetValuesTable");
        const projectsSearchInput = document.getElementById("projectsSearchInput");
        const budgetSearchInput = document.getElementById("budgetSearchInput");
        
        if (projectsTable) {
            makeTableSortable(projectsTable);
            
            // Note: addBatchSelection is now called in renderProjects() after rendering
            // to ensure proper header initialization order
            
            // Add batch operations toolbar
            addBatchOperationsToolbar(projectsTable, {
                'Delete Selected': createCascadeBatchDeleteHandler({
                    getChildRecords: getBudgetValues,
                    filterChildRecords: (childRecords, parentId) => childRecords.filter(v => v.projectId === parentId),
                    deleteChildRecord: deleteBudgetValue,
                    deleteParent: deleteProject,
                    renderParent: renderProjects,
                    renderChild: renderBudgetValues,
                    parentName: 'project',
                    parentNamePlural: 'projects',
                    childNamePlural: 'budget values'
                })
            });
        }
        if (budgetValuesTable) {
            makeTableSortable(budgetValuesTable);
            
            // Add batch operations toolbar for budget values
            addBatchOperationsToolbar(budgetValuesTable, {
                'Delete Selected': createValidatedBatchDeleteHandler({
                    validateDeletion: validateBudgetValueDeletion,
                    deleteFunc: deleteBudgetValue,
                    renderFunc: renderBudgetValues,
                    entityName: 'budget value',
                    entityNamePlural: 'budget values'
                })
            });
        }
        if (projectsTable && projectsSearchInput) {
            addTableFilter(projectsTable, projectsSearchInput);
        }
        if (budgetValuesTable && budgetSearchInput) {
            addTableFilter(budgetValuesTable, budgetSearchInput);
        }
    });
}
