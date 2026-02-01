import { getAllocations, updateAllocation, deleteAllocation, addAllocation, getPeople, getProjects, getAllocationOverrides, addAllocationOverride, updateAllocationOverride, deleteAllocationOverride } from '../data/database.js';
import { scheduleAutoBackup } from '../main.js';
import { pctToPMPerMonth, pctToPMPerYear } from '../helpers/allocationHelper.js';
import { validateAllocationPercentage } from '../helpers/validationHelper.js';
import { formatNumber } from '../config/constants.js';

// Render allocations table
export async function renderAllocations() {
    if (typeof document === 'undefined') return;
    
    const tbody = document.querySelector("#allocationsTable tbody");
    if (!tbody) return;
    
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
        
        // Get person's FTE to calculate PM values
        const person = people.find(p => p.id === a.personId);
        const fte = person ? (person.fte ?? 1) : 1;
        const pmPerMonth = pctToPMPerMonth(fte, a.pct);
        const pmPerYear = pctToPMPerYear(fte, a.pct);
        
        tr.innerHTML = `
            <td><select class="alloc-person" data-id="${a.id}">${personOptions}</select></td>
            <td><select class="alloc-project" data-id="${a.id}">${projectOptions}</select></td>
            <td><input type="number" class="alloc-pct" step="0.01" min="0" max="1" value="${a.pct}" data-id="${a.id}"></td>
            <td class="pm-display">${formatNumber(pmPerMonth)}</td>
            <td class="pm-display">${formatNumber(pmPerYear)}</td>
            <td><input type="month" class="alloc-start" value="${a.startMonth}" data-id="${a.id}"></td>
            <td><input type="month" class="alloc-end" value="${a.endMonth ?? ''}" data-id="${a.id}"></td>
            <td><button class="delete-allocation" data-id="${a.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    // Attach event listeners
    attachAllocationsEventListeners();
}

/**
 * Update PM values for a specific row without re-rendering the entire table
 * @param {HTMLTableRowElement} row - The table row element
 * @param {Object} alloc - The allocation object
 */
async function updateRowPMValues(row, alloc) {
    const people = await getPeople();
    const person = people.find(p => p.id === alloc.personId);
    const fte = person ? (person.fte ?? 1) : 1;
    const pmPerMonth = pctToPMPerMonth(fte, alloc.pct);
    const pmPerYear = pctToPMPerYear(fte, alloc.pct);
    
    // Update the PM display cells (4th and 5th cells in the row)
    const cells = row.querySelectorAll('.pm-display');
    if (cells.length >= 2) {
        cells[0].textContent = formatNumber(pmPerMonth);
        cells[1].textContent = formatNumber(pmPerYear);
    }
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
            scheduleAutoBackup();
            // Update PM values for this row
            await updateRowPMValues(this.closest('tr'), alloc);
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
            scheduleAutoBackup();
        });
    });
    
    // Percentage input blur handlers
    document.querySelectorAll(".alloc-pct").forEach(input => {
        input.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const allocs = await getAllocations();
            const alloc = allocs.find(a => a.id === id);
            
            const validation = validateAllocationPercentage(this.value);
            if (!validation.valid) {
                alert(validation.message);
                // Revert to original value
                this.value = alloc.pct;
                return;
            }
            
            alloc.pct = parseFloat(this.value);
            await updateAllocation(alloc);
            scheduleAutoBackup();
            // Update PM values for this row
            await updateRowPMValues(this.closest('tr'), alloc);
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
            scheduleAutoBackup();
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
            scheduleAutoBackup();
        });
    });
    
    // Delete button handlers
    document.querySelectorAll(".delete-allocation").forEach(btn => {
        btn.addEventListener("click", async function() {
            const id = parseInt(this.dataset.id);
            await deleteAllocation(id);
            scheduleAutoBackup();
            renderAllocations();
        });
    });
}

// Render allocation overrides table
export async function renderAllocationOverrides() {
    if (typeof document === 'undefined') return;
    
    const tbody = document.querySelector("#allocationOverridesTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    const overrides = await getAllocationOverrides();
    const allocations = await getAllocations();
    const people = await getPeople();
    const projects = await getProjects();
    
    // Sort by allocation and month
    const sortedOverrides = overrides.sort((a, b) => {
        if (a.allocationId !== b.allocationId) {
            return a.allocationId - b.allocationId;
        }
        return a.month.localeCompare(b.month);
    });
    
    sortedOverrides.forEach(override => {
        const allocation = allocations.find(a => a.id === override.allocationId);
        let allocationLabel = `Allocation #${override.allocationId}`;
        if (allocation) {
            const person = people.find(p => p.id === allocation.personId);
            const project = projects.find(p => p.id === allocation.projectId);
            allocationLabel = `${person ? person.name : allocation.personId} → ${project ? project.name : allocation.projectId}`;
        }
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${allocationLabel}</td>
            <td><input type="month" class="override-month" value="${override.month}" data-id="${override.id}"></td>
            <td contenteditable="true" data-id="${override.id}" data-field="pct">${override.pct}</td>
            <td><button class="delete-allocation-override" data-id="${override.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    // Attach event listeners
    attachAllocationOverrideEventListeners();
    populateAllocationSelect();
}

function attachAllocationOverrideEventListeners() {
    if (typeof document === 'undefined') return;
    
    // Content editable blur handlers
    document.querySelectorAll("#allocationOverridesTable td[contenteditable]").forEach(td => {
        td.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const field = this.dataset.field;
            const value = this.textContent;
            
            const overrides = await getAllocationOverrides();
            const override = overrides.find(o => o.id === id);
            
            if (field === "pct") {
                const validation = validateAllocationPercentage(value);
                if (!validation.valid) {
                    alert(validation.message);
                    // Revert to original value
                    this.textContent = override.pct;
                    return;
                }
                override.pct = parseFloat(value);
            }
            
            await updateAllocationOverride(override);
            scheduleAutoBackup();
        });
    });
    
    // Month input blur handlers
    document.querySelectorAll(".override-month").forEach(input => {
        input.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const overrides = await getAllocationOverrides();
            const override = overrides.find(o => o.id === id);
            override.month = this.value;
            await updateAllocationOverride(override);
            scheduleAutoBackup();
        });
    });
    
    // Delete button handlers
    document.querySelectorAll(".delete-allocation-override").forEach(btn => {
        btn.addEventListener("click", async function() {
            const id = parseInt(this.dataset.id);
            await deleteAllocationOverride(id);
            scheduleAutoBackup();
            renderAllocationOverrides();
        });
    });
}

// Populate allocation select dropdown
export async function populateAllocationSelect() {
    if (typeof document === 'undefined') return;
    
    const select = document.getElementById("allocationSelect");
    if (!select) return;
    
    select.innerHTML = "";
    const allocations = await getAllocations();
    const people = await getPeople();
    const projects = await getProjects();
    
    allocations.forEach(a => {
        const person = people.find(p => p.id === a.personId);
        const project = projects.find(p => p.id === a.projectId);
        const label = `${person ? person.name : a.personId} → ${project ? project.name : a.projectId}`;
        
        const option = document.createElement("option");
        option.value = a.id;
        option.textContent = label;
        select.appendChild(option);
    });
}

// Initialize allocations view
export function initAllocationsView() {
    if (typeof document === 'undefined') return;
    
    const addAllocationBtn = document.getElementById("addAllocationBtn");
    if (!addAllocationBtn) return;
    
    addAllocationBtn.addEventListener("click", async () => {
        await addAllocation({
            personId: document.getElementById("personSelect").value,
            projectId: document.getElementById("projectSelect").value,
            pct: parseFloat(document.getElementById("pctInput").value),
            startMonth: document.getElementById("startMonthInput").value,
            endMonth: document.getElementById("endMonthInput").value || null
        });
        scheduleAutoBackup();
        renderAllocations();
        populateAllocationSelect(); // Update allocation override select
    });
    
    const addOverrideBtn = document.getElementById("addAllocationOverrideBtn");
    if (addOverrideBtn) {
        addOverrideBtn.addEventListener("click", async () => {
            const allocationId = parseInt(document.getElementById("allocationSelect").value);
            const month = document.getElementById("overrideMonthInput").value;
            const pct = parseFloat(document.getElementById("overridePctInput").value);
            
            if (!allocationId || !month) {
                alert("Please select an allocation and month");
                return;
            }
            
            await addAllocationOverride({
                allocationId,
                month,
                pct
            });
            scheduleAutoBackup();
            renderAllocationOverrides();
        });
    }
}
