import { getProjects, updateProject, deleteProject, addProject, generateProjectId, getBudgetValues, addBudgetValue, updateBudgetValue, deleteBudgetValue } from '../data/database.js';
import { scheduleAutoBackup } from '../main.js';
import { validateBudgetValueDeletion, validatePlannedPM } from '../helpers/validationHelper.js';

// Render projects table (basic project info)
export async function renderProjects() {
    if (typeof document === 'undefined') return;
    
    const tbody = document.querySelector("#projectsTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    const projects = await getProjects();
    
    projects.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td contenteditable="true" data-id="${p.id}" data-field="name">${p.name}</td>
            <td><button class="delete-project" data-id="${p.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    // Attach event listeners
    attachProjectsEventListeners();
    populateProjectSelect();
}

// Render budget values table (time-based budget entries)
export async function renderBudgetValues() {
    if (typeof document === 'undefined') return;
    
    const tbody = document.querySelector("#budgetValuesTable tbody");
    if (!tbody) return;
    
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
        tr.innerHTML = `
            <td>${projectName}</td>
            <td contenteditable="true" data-id="${value.id}" data-field="plannedPM">${value.plannedPM}</td>
            <td><input type="month" class="budget-start" value="${value.startMonth}" data-id="${value.id}"></td>
            <td><input type="month" class="budget-end" value="${value.endMonth || ''}" data-id="${value.id}"></td>
            <td><button class="delete-budget-value" data-id="${value.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
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
            
            if (field === "name") {
                project.name = value;
                populateProjectSelect();
                renderBudgetValues(); // Update budget table in case project name changed
            }
            
            await updateProject(project);
            scheduleAutoBackup();
        });
    });
    
    // Delete button handlers
    document.querySelectorAll(".delete-project").forEach(btn => {
        btn.addEventListener("click", async function() {
            const id = this.dataset.id;
            // Delete project's budget values first
            const budgetValues = await getBudgetValues();
            const projectBudgetValues = budgetValues.filter(v => v.projectId === id);
            for (const value of projectBudgetValues) {
                await deleteBudgetValue(value.id);
            }
            
            // Then delete the project
            await deleteProject(id);
            scheduleAutoBackup();
            renderProjects();
            renderBudgetValues();
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
    
    // Delete button handlers
    document.querySelectorAll(".delete-budget-value").forEach(btn => {
        btn.addEventListener("click", async function() {
            const id = parseInt(this.dataset.id);
            
            // Validate deletion
            const validation = await validateBudgetValueDeletion(id);
            if (!validation.valid) {
                alert(validation.message);
                return;
            }
            
            await deleteBudgetValue(id);
            scheduleAutoBackup();
            renderBudgetValues();
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
}

// Initialize projects view
export function initProjectsView() {
    if (typeof document === 'undefined') return;
    
    const addProjectBtn = document.getElementById("addProjectBtn");
    if (addProjectBtn) {
        addProjectBtn.addEventListener("click", async () => {
            const name = prompt("Project name");
            if (name) await addProjectAuto(name);
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
}
