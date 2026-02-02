/**
 * Allocations View
 * 
 * Manages the allocations table and allocation overrides table in the UI.
 * Handles rendering, event listeners, and CRUD operations for allocations
 * and their monthly overrides.
 */

import { getAllocations, updateAllocation, deleteAllocation, addAllocation, getPeople, getProjects, getAllocationOverrides, addAllocationOverride, updateAllocationOverride, deleteAllocationOverride } from '../data/database.js';
import { scheduleAutoBackup } from '../main.js';
import { pmPerMonthToYear } from '../helpers/allocationHelper.js';
import { findOverlappingAllocations, findOpenEndedAllocationsToClose, getMonthBefore } from '../helpers/validationHelper.js';
import { PM_STEP, MIN_PM } from '../config/constants.js';

/**
 * Render allocations table
 * Displays all allocations with editable fields for person, project, PM, and date ranges
 */
export async function renderAllocations() {
    if (typeof document === 'undefined') return;
    
    const tbody = document.querySelector("#allocationsTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    const allocations = await getAllocations();
    const people = await getPeople();
    const projects = await getProjects();
    
    allocations.forEach(a => {
        const tr = document.createElement("tr");
        const personOptions = people.filter(p => p.active).map(p =>
            `<option value="${p.id}" ${p.id === a.personId ? 'selected' : ''}>${p.name}</option>`
        ).join('');
        const projectOptions = projects.map(p =>
            `<option value="${p.id}" ${p.id === a.projectId ? 'selected' : ''}>${p.name}</option>`
        ).join('');
        
        // PM values are stored directly, no calculation needed
        const pmPerMonth = a.pm;
        const pmPerYear = pmPerMonthToYear(a.pm);
        
        tr.innerHTML = `
            <td><select class="alloc-person" data-id="${a.id}">${personOptions}</select></td>
            <td><select class="alloc-project" data-id="${a.id}">${projectOptions}</select></td>
            <td><input type="number" class="alloc-pm" step="${PM_STEP}" min="${MIN_PM}" value="${a.pm}" data-id="${a.id}"></td>
            <td class="pm-display">${pmPerMonth.toFixed(2)}</td>
            <td class="pm-display">${pmPerYear.toFixed(2)}</td>
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
    const pmPerMonth = alloc.pm;
    const pmPerYear = pmPerMonthToYear(alloc.pm);
    
    // Update the PM display cells (4th and 5th cells in the row)
    const cells = row.querySelectorAll('.pm-display');
    if (cells.length >= 2) {
        cells[0].textContent = pmPerMonth.toFixed(2);
        cells[1].textContent = pmPerYear.toFixed(2);
    }
}

function attachAllocationsEventListeners() {
    // Person select change handlers
    document.querySelectorAll(".alloc-person").forEach(select => {
        select.addEventListener("change", async function() {
            const id = parseInt(this.dataset.id);
            const allocations = await getAllocations();
            const alloc = allocations.find(a => a.id === id);
            if (!alloc) {
                console.error(`Allocation with id ${id} not found`);
                return;
            }
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
            const allocations = await getAllocations();
            const alloc = allocations.find(a => a.id === id);
            if (!alloc) {
                console.error(`Allocation with id ${id} not found`);
                return;
            }
            alloc.projectId = this.value;
            await updateAllocation(alloc);
            scheduleAutoBackup();
        });
    });
    
    // PM input blur handlers
    document.querySelectorAll(".alloc-pm").forEach(input => {
        input.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const allocations = await getAllocations();
            const alloc = allocations.find(a => a.id === id);
            if (!alloc) {
                console.error(`Allocation with id ${id} not found`);
                return;
            }
            
            const pm = parseFloat(this.value);
            if (isNaN(pm) || pm < MIN_PM) {
                alert("PM must be a positive number");
                // Revert to original value
                this.value = alloc.pm;
                return;
            }
            
            alloc.pm = pm;
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
            const allocations = await getAllocations();
            const alloc = allocations.find(a => a.id === id);
            if (!alloc) {
                console.error(`Allocation with id ${id} not found`);
                return;
            }
            const newStartMonth = this.value;
            
            // Check for overlaps with the new start date
            const overlapping = await findOverlappingAllocations(
                alloc.personId,
                alloc.projectId,
                newStartMonth,
                alloc.endMonth,
                id  // Exclude current allocation
            );
            
            if (overlapping.length > 0) {
                const people = await getPeople();
                const projects = await getProjects();
                const person = people.find(p => p.id === alloc.personId);
                const project = projects.find(p => p.id === alloc.projectId);
                const label = `${person ? person.name : alloc.personId} → ${project ? project.name : alloc.projectId}`;
                
                const overlapMsg = overlapping.map(a => 
                    `  - ${a.pm.toFixed(2)} PM from ${a.startMonth} to ${a.endMonth || 'ongoing'}`
                ).join('\n');
                
                const confirmOverlap = confirm(
                    `Warning: This change creates overlapping allocations for ${label}:\n${overlapMsg}\n\n` +
                    `The system will use the most recent allocation when multiple values apply.\n` +
                    `Are you sure you want to continue?`
                );
                
                if (!confirmOverlap) {
                    // Revert to original value
                    this.value = alloc.startMonth;
                    return;
                }
            }
            
            alloc.startMonth = newStartMonth;
            await updateAllocation(alloc);
            scheduleAutoBackup();
        });
    });
    
    // End month input blur handlers
    document.querySelectorAll(".alloc-end").forEach(input => {
        input.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const allocations = await getAllocations();
            const alloc = allocations.find(a => a.id === id);
            if (!alloc) {
                console.error(`Allocation with id ${id} not found`);
                return;
            }
            const newEndMonth = this.value || null;
            
            // Check for overlaps with the new end date
            const overlapping = await findOverlappingAllocations(
                alloc.personId,
                alloc.projectId,
                alloc.startMonth,
                newEndMonth,
                id  // Exclude current allocation
            );
            
            if (overlapping.length > 0) {
                const people = await getPeople();
                const projects = await getProjects();
                const person = people.find(p => p.id === alloc.personId);
                const project = projects.find(p => p.id === alloc.projectId);
                const label = `${person ? person.name : alloc.personId} → ${project ? project.name : alloc.projectId}`;
                
                const overlapMsg = overlapping.map(a => 
                    `  - ${a.pm.toFixed(2)} PM from ${a.startMonth} to ${a.endMonth || 'ongoing'}`
                ).join('\n');
                
                const confirmOverlap = confirm(
                    `Warning: This change creates overlapping allocations for ${label}:\n${overlapMsg}\n\n` +
                    `The system will use the most recent allocation when multiple values apply.\n` +
                    `Are you sure you want to continue?`
                );
                
                if (!confirmOverlap) {
                    // Revert to original value
                    this.value = alloc.endMonth || '';
                    return;
                }
            }
            
            alloc.endMonth = newEndMonth;
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
            <td contenteditable="true" data-id="${override.id}" data-field="pm">${override.pm}</td>
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
            
            if (field === "pm") {
                const pm = parseFloat(value);
                if (isNaN(pm) || pm < 0) {
                    alert("PM must be a positive number");
                    // Revert to original value
                    this.textContent = override.pm;
                    return;
                }
                override.pm = pm;
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
        const personId = document.getElementById("personSelect").value;
        const projectId = document.getElementById("projectSelect").value;
        const pm = parseFloat(document.getElementById("pmInput").value);
        const startMonth = document.getElementById("startMonthInput").value;
        const endMonth = document.getElementById("endMonthInput").value || null;
        
        if (!personId || !projectId || !startMonth) {
            alert("Please select a person, project, and start month");
            return;
        }
        
        // Validate allocation PM
        if (isNaN(pm) || pm < 0) {
            alert("PM must be a positive number");
            return;
        }
        
        // Check for overlapping allocations
        const overlapping = await findOverlappingAllocations(personId, projectId, startMonth, endMonth);
        
        if (overlapping.length > 0) {
            // Find open-ended entries to auto-close
            const toClose = await findOpenEndedAllocationsToClose(personId, projectId, startMonth);
            
            if (toClose.length > 0) {
                // Ask user if they want to auto-close previous open-ended allocation
                const people = await getPeople();
                const projects = await getProjects();
                const person = people.find(p => p.id === personId);
                const project = projects.find(p => p.id === projectId);
                const label = `${person ? person.name : personId} → ${project ? project.name : projectId}`;
                
                const closeMsg = toClose.map(a => {
                    const suggestedEnd = getMonthBefore(startMonth);
                    return `  - ${a.pm.toFixed(2)} PM allocation starting ${a.startMonth} (will set end to ${suggestedEnd})`;
                }).join('\n');
                
                const shouldClose = confirm(
                    `This allocation for ${label} overlaps with existing open-ended entries:\n${closeMsg}\n\n` +
                    `Click OK to AUTO-CLOSE (set end date), or Cancel for more options.`
                );
                
                if (shouldClose) {
                    // Auto-close previous open-ended allocations
                    const suggestedEnd = getMonthBefore(startMonth);
                    
                    for (const alloc of toClose) {
                        alloc.endMonth = suggestedEnd;
                        await updateAllocation(alloc);
                    }
                } else {
                    // Ask if user wants to overwrite instead
                    const shouldOverwrite = confirm(
                        `Do you want to OVERWRITE (delete) the conflicting allocations instead?\n` +
                        `Click OK to delete conflicting allocations, or Cancel to keep overlapping allocations.`
                    );
                    
                    if (shouldOverwrite) {
                        // Delete all overlapping allocations
                        for (const alloc of overlapping) {
                            await deleteAllocation(alloc.id);
                        }
                    } else {
                        // User chose to create overlapping allocations - warn them
                        const warnConfirm = confirm(
                            `Warning: Creating overlapping allocations may lead to unexpected behavior.\n` +
                            `The system will use the most recent allocation when multiple values apply.\n\n` +
                            `Are you sure you want to continue?`
                        );
                        
                        if (!warnConfirm) {
                            return; // User cancelled
                        }
                    }
                }
            } else {
                // Overlapping but no open-ended entries to auto-close
                const people = await getPeople();
                const projects = await getProjects();
                const person = people.find(p => p.id === personId);
                const project = projects.find(p => p.id === projectId);
                const label = `${person ? person.name : personId} → ${project ? project.name : projectId}`;
                
                const overlapMsg = overlapping.map(a => 
                    `  - ${a.pm.toFixed(2)} PM from ${a.startMonth} to ${a.endMonth || 'ongoing'}`
                ).join('\n');
                
                const shouldOverwrite = confirm(
                    `Warning: This allocation for ${label} overlaps with existing entries:\n${overlapMsg}\n\n` +
                    `Click OK to OVERWRITE (delete conflicting allocations), or Cancel for more options.`
                );
                
                if (shouldOverwrite) {
                    // Delete all overlapping allocations
                    for (const alloc of overlapping) {
                        await deleteAllocation(alloc.id);
                    }
                } else {
                    // Ask if user wants to keep overlapping allocations
                    const confirmOverlap = confirm(
                        `Do you want to keep the overlapping allocations?\n` +
                        `The system will use the most recent allocation when multiple values apply.\n\n` +
                        `Click OK to proceed with overlap, or Cancel to abort.`
                    );
                    
                    if (!confirmOverlap) {
                        return; // User cancelled
                    }
                }
            }
        }
        
        await addAllocation({
            personId,
            projectId,
            pm,
            startMonth,
            endMonth
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
            const pm = parseFloat(document.getElementById("overridePmInput").value);
            
            if (!allocationId || !month) {
                alert("Please select an allocation and month");
                return;
            }
            
            if (isNaN(pm) || pm < 0) {
                alert("PM must be a positive number");
                return;
            }
            
            await addAllocationOverride({
                allocationId,
                month,
                pm
            });
            scheduleAutoBackup();
            renderAllocationOverrides();
        });
    }
}
