import { getAllocations, updateAllocation, deleteAllocation, addAllocation, getPeople, getProjects } from '../data/database.js';

// Render allocations table
export async function renderAllocations() {
    const tbody = document.querySelector("#allocationsTable tbody");
    tbody.innerHTML = "";
    const allocs = await getAllocations();
    const people = await getPeople();
    const projects = await getProjects();
    
    allocs.forEach(a => {
        const tr = document.createElement("tr");
        const personOptions = people.filter(p => p.active).map(p =>
            `<option value="${p.id}" ${p.id === a.personId ? 'selected' : ''}>${p.name}</option>`
        ).join('');
        const projectOptions = projects.map(p =>
            `<option value="${p.id}" ${p.id === a.projectId ? 'selected' : ''}>${p.name}</option>`
        ).join('');
        
        tr.innerHTML = `
            <td><select class="alloc-person" data-id="${a.id}">${personOptions}</select></td>
            <td><select class="alloc-project" data-id="${a.id}">${projectOptions}</select></td>
            <td><input type="number" class="alloc-pct" step="0.01" min="0" max="1" value="${a.pct}" data-id="${a.id}"></td>
            <td><input type="month" class="alloc-start" value="${a.startMonth}" data-id="${a.id}"></td>
            <td><input type="month" class="alloc-end" value="${a.endMonth ?? ''}" data-id="${a.id}"></td>
            <td><button class="delete-allocation" data-id="${a.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    // Attach event listeners
    attachAllocationsEventListeners();
}

function attachAllocationsEventListeners() {
    // Person select change handlers
    document.querySelectorAll(".alloc-person").forEach(select => {
        select.addEventListener("change", async function() {
            const id = parseInt(this.dataset.id);
            const allocs = await getAllocations();
            const alloc = allocs.find(a => a.id === id);
            alloc.personId = this.value;
            await updateAllocation(alloc);
        });
    });
    
    // Project select change handlers
    document.querySelectorAll(".alloc-project").forEach(select => {
        select.addEventListener("change", async function() {
            const id = parseInt(this.dataset.id);
            const allocs = await getAllocations();
            const alloc = allocs.find(a => a.id === id);
            alloc.projectId = this.value;
            await updateAllocation(alloc);
        });
    });
    
    // Percentage input blur handlers
    document.querySelectorAll(".alloc-pct").forEach(input => {
        input.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const allocs = await getAllocations();
            const alloc = allocs.find(a => a.id === id);
            alloc.pct = parseFloat(this.value);
            await updateAllocation(alloc);
        });
    });
    
    // Start month input blur handlers
    document.querySelectorAll(".alloc-start").forEach(input => {
        input.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const allocs = await getAllocations();
            const alloc = allocs.find(a => a.id === id);
            alloc.startMonth = this.value;
            await updateAllocation(alloc);
        });
    });
    
    // End month input blur handlers
    document.querySelectorAll(".alloc-end").forEach(input => {
        input.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const allocs = await getAllocations();
            const alloc = allocs.find(a => a.id === id);
            alloc.endMonth = this.value || null;
            await updateAllocation(alloc);
        });
    });
    
    // Delete button handlers
    document.querySelectorAll(".delete-allocation").forEach(btn => {
        btn.addEventListener("click", async function() {
            const id = parseInt(this.dataset.id);
            await deleteAllocation(id);
            renderAllocations();
        });
    });
}

// Initialize allocations view
export function initAllocationsView() {
    document.getElementById("addAllocationBtn").addEventListener("click", async () => {
        await addAllocation({
            personId: document.getElementById("personSelect").value,
            projectId: document.getElementById("projectSelect").value,
            pct: parseFloat(document.getElementById("pctInput").value),
            startMonth: document.getElementById("startMonthInput").value,
            endMonth: document.getElementById("endMonthInput").value || null
        });
        renderAllocations();
    });
}
