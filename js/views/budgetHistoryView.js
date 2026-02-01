import { getProjects, getProjectBudgetOverrides, updateProjectBudgetOverride, deleteProjectBudgetOverride, addProjectBudgetOverride } from '../data/database.js';
import { scheduleAutoBackup } from '../main.js';

// Render project budget overrides table
export async function renderBudgetOverrides() {
    if (typeof document === 'undefined') return;
    
    const tbody = document.querySelector("#budgetOverridesTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    const overrides = await getProjectBudgetOverrides();
    const projects = await getProjects();
    
    // Sort by project and start month
    const sortedOverrides = overrides.sort((a, b) => {
        if (a.projectId !== b.projectId) {
            return a.projectId.localeCompare(b.projectId);
        }
        return a.startMonth.localeCompare(b.startMonth);
    });
    
    sortedOverrides.forEach(override => {
        const project = projects.find(p => p.id === override.projectId);
        const projectName = project ? project.name : override.projectId;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${projectName}</td>
            <td contenteditable="true" data-id="${override.id}" data-field="plannedPM">${override.plannedPM}</td>
            <td><input type="month" class="budget-start" value="${override.startMonth}" data-id="${override.id}"></td>
            <td><input type="month" class="budget-end" value="${override.endMonth || ''}" data-id="${override.id}"></td>
            <td><button class="delete-budget-override" data-id="${override.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    // Attach event listeners
    attachBudgetOverrideEventListeners();
    populateBudgetProjectSelect();
}

function attachBudgetOverrideEventListeners() {
    if (typeof document === 'undefined') return;
    
    // Content editable blur handlers
    document.querySelectorAll("#budgetOverridesTable td[contenteditable]").forEach(td => {
        td.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const field = this.dataset.field;
            const value = this.textContent;
            
            const overrides = await getProjectBudgetOverrides();
            const override = overrides.find(o => o.id === id);
            
            if (field === "plannedPM") {
                override.plannedPM = parseFloat(value);
            }
            
            await updateProjectBudgetOverride(override);
            scheduleAutoBackup();
        });
    });
    
    // Start month input blur handlers
    document.querySelectorAll(".budget-start").forEach(input => {
        input.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const overrides = await getProjectBudgetOverrides();
            const override = overrides.find(o => o.id === id);
            override.startMonth = this.value;
            await updateProjectBudgetOverride(override);
            scheduleAutoBackup();
        });
    });
    
    // End month input blur handlers
    document.querySelectorAll(".budget-end").forEach(input => {
        input.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const overrides = await getProjectBudgetOverrides();
            const override = overrides.find(o => o.id === id);
            override.endMonth = this.value || null;
            await updateProjectBudgetOverride(override);
            scheduleAutoBackup();
        });
    });
    
    // Delete button handlers
    document.querySelectorAll(".delete-budget-override").forEach(btn => {
        btn.addEventListener("click", async function() {
            const id = parseInt(this.dataset.id);
            await deleteProjectBudgetOverride(id);
            scheduleAutoBackup();
            renderBudgetOverrides();
        });
    });
}

// Populate project select dropdown
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

// Initialize budget history view
export function initBudgetHistoryView() {
    if (typeof document === 'undefined') return;
    
    const addBtn = document.getElementById("addBudgetOverrideBtn");
    if (!addBtn) return;
    
    addBtn.addEventListener("click", async () => {
        const projectId = document.getElementById("budgetProjectSelect").value;
        const plannedPM = parseFloat(document.getElementById("budgetValueInput").value);
        const startMonth = document.getElementById("budgetStartMonthInput").value;
        const endMonth = document.getElementById("budgetEndMonthInput").value || null;
        
        if (!projectId || !startMonth) {
            alert("Please select a project and start month");
            return;
        }
        
        await addProjectBudgetOverride({
            projectId,
            plannedPM,
            startMonth,
            endMonth
        });
        scheduleAutoBackup();
        renderBudgetOverrides();
    });
}
