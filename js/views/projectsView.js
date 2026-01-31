import { getProjects, updateProject, deleteProject, addProject, generateProjectId } from '../data/database.js';
import { scheduleAutoBackup } from '../main.js';

// Render projects table
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
            <td contenteditable="true" data-id="${p.id}" data-field="plannedPM">${p.plannedPM ?? 0}</td>
            <td><button class="delete-project" data-id="${p.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    // Attach event listeners
    attachProjectsEventListeners();
    populateProjectSelect();
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
            } else if (field === "plannedPM") {
                project.plannedPM = parseFloat(value);
            }
            
            await updateProject(project);
            scheduleAutoBackup();
        });
    });
    
    // Delete button handlers
    document.querySelectorAll(".delete-project").forEach(btn => {
        btn.addEventListener("click", async function() {
            const id = this.dataset.id;
            await deleteProject(id);
            scheduleAutoBackup();
            renderProjects();
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

// Add project with auto-generated ID
export async function addProjectAuto(name) {
    const id = await generateProjectId();
    await addProject({ id, name, plannedPM: 0 });
    scheduleAutoBackup();
    renderProjects();
}

// Initialize projects view
export function initProjectsView() {
    if (typeof document === 'undefined') return;
    
    const addProjectBtn = document.getElementById("addProjectBtn");
    if (!addProjectBtn) return;
    
    addProjectBtn.addEventListener("click", async () => {
        const name = prompt("Project name");
        if (name) await addProjectAuto(name);
    });
}
