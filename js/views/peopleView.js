import { getPeople, updatePerson, deletePerson, addPerson, generatePersonId, getFteValues, addFteValue, updateFteValue, deleteFteValue } from '../data/database.js';
import { scheduleAutoBackup } from '../main.js';
import { validateFteValueDeletion, validateFteValue, findOverlappingFteValues, findOpenEndedFteValuesToClose } from '../helpers/validationHelper.js';

// Render people table (basic person info)
export async function renderPeople() {
    if (typeof document === 'undefined') return;
    
    const tbody = document.querySelector("#peopleTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    const people = await getPeople();
    
    people.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td contenteditable="true" data-id="${p.id}" data-field="name">${p.name}</td>
            <td><input type="checkbox" ${p.active ? "checked" : ""} data-id="${p.id}" data-field="active"></td>
            <td><button class="delete-person" data-id="${p.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    // Attach event listeners
    attachPeopleEventListeners();
    populatePersonSelect();
}

// Render FTE values table (time-based FTE entries)
export async function renderFteValues() {
    if (typeof document === 'undefined') return;
    
    const tbody = document.querySelector("#fteValuesTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    const fteValues = await getFteValues();
    const people = await getPeople();
    
    // Sort by person and start month
    const sortedValues = fteValues.sort((a, b) => {
        if (a.personId !== b.personId) {
            return a.personId.localeCompare(b.personId);
        }
        return a.startMonth.localeCompare(b.startMonth);
    });
    
    sortedValues.forEach(value => {
        const person = people.find(p => p.id === value.personId);
        const personName = person ? person.name : value.personId;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${personName}</td>
            <td contenteditable="true" data-id="${value.id}" data-field="fte">${value.fte}</td>
            <td><input type="month" class="fte-start" value="${value.startMonth}" data-id="${value.id}"></td>
            <td><input type="month" class="fte-end" value="${value.endMonth || ''}" data-id="${value.id}"></td>
            <td><button class="delete-fte-value" data-id="${value.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    // Attach event listeners
    attachFteValueEventListeners();
    populateFtePersonSelect();
}

function attachPeopleEventListeners() {
    if (typeof document === 'undefined') return;
    
    // Content editable blur handlers
    document.querySelectorAll("#peopleTable td[contenteditable]").forEach(td => {
        td.addEventListener("blur", async function() {
            const id = this.dataset.id;
            const field = this.dataset.field;
            const value = this.textContent;
            
            const people = await getPeople();
            const person = people.find(p => p.id === id);
            
            if (field === "name") {
                person.name = value;
                populatePersonSelect();
                renderFteValues(); // Update FTE table in case person name changed
            }
            
            await updatePerson(person);
            scheduleAutoBackup();
        });
    });
    
    // Checkbox handlers
    document.querySelectorAll("#peopleTable input[type=checkbox]").forEach(checkbox => {
        checkbox.addEventListener("change", async function() {
            const id = this.dataset.id;
            const checked = this.checked;
            
            const people = await getPeople();
            const person = people.find(p => p.id === id);
            person.active = checked;
            
            await updatePerson(person);
            scheduleAutoBackup();
            populatePersonSelect();
        });
    });
    
    // Delete button handlers
    document.querySelectorAll(".delete-person").forEach(btn => {
        btn.addEventListener("click", async function() {
            const id = this.dataset.id;
            // Delete person's FTE values first
            const fteValues = await getFteValues();
            const personFteValues = fteValues.filter(v => v.personId === id);
            for (const value of personFteValues) {
                await deleteFteValue(value.id);
            }
            
            // Then delete the person
            await deletePerson(id);
            scheduleAutoBackup();
            renderPeople();
            renderFteValues();
        });
    });
}

function attachFteValueEventListeners() {
    if (typeof document === 'undefined') return;
    
    // Content editable blur handlers
    document.querySelectorAll("#fteValuesTable td[contenteditable]").forEach(td => {
        td.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const field = this.dataset.field;
            const value = this.textContent;
            
            const fteValues = await getFteValues();
            const fteValue = fteValues.find(v => v.id === id);
            
            if (field === "fte") {
                const validation = validateFteValue(value);
                if (!validation.valid) {
                    alert(validation.message);
                    // Revert to original value
                    this.textContent = fteValue.fte;
                    return;
                }
                fteValue.fte = parseFloat(value);
            }
            
            await updateFteValue(fteValue);
            scheduleAutoBackup();
        });
    });
    
    // Start month input blur handlers
    document.querySelectorAll(".fte-start").forEach(input => {
        input.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const fteValues = await getFteValues();
            const fteValue = fteValues.find(v => v.id === id);
            const newStartMonth = this.value;
            
            // Check for overlaps with the new start date
            const overlapping = await findOverlappingFteValues(
                fteValue.personId, 
                newStartMonth, 
                fteValue.endMonth,
                id  // Exclude current entry
            );
            
            if (overlapping.length > 0) {
                const overlapMsg = overlapping.map(v => 
                    `  - FTE ${v.fte} from ${v.startMonth} to ${v.endMonth || 'ongoing'}`
                ).join('\n');
                
                const confirmOverlap = confirm(
                    `Warning: This change creates overlapping FTE entries:\n${overlapMsg}\n\n` +
                    `The system will use the most recent entry when multiple values apply.\n` +
                    `Are you sure you want to continue?`
                );
                
                if (!confirmOverlap) {
                    // Revert to original value
                    this.value = fteValue.startMonth;
                    return;
                }
            }
            
            fteValue.startMonth = newStartMonth;
            await updateFteValue(fteValue);
            scheduleAutoBackup();
        });
    });
    
    // End month input blur handlers
    document.querySelectorAll(".fte-end").forEach(input => {
        input.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const fteValues = await getFteValues();
            const fteValue = fteValues.find(v => v.id === id);
            const newEndMonth = this.value || null;
            
            // Check for overlaps with the new end date
            const overlapping = await findOverlappingFteValues(
                fteValue.personId, 
                fteValue.startMonth, 
                newEndMonth,
                id  // Exclude current entry
            );
            
            if (overlapping.length > 0) {
                const overlapMsg = overlapping.map(v => 
                    `  - FTE ${v.fte} from ${v.startMonth} to ${v.endMonth || 'ongoing'}`
                ).join('\n');
                
                const confirmOverlap = confirm(
                    `Warning: This change creates overlapping FTE entries:\n${overlapMsg}\n\n` +
                    `The system will use the most recent entry when multiple values apply.\n` +
                    `Are you sure you want to continue?`
                );
                
                if (!confirmOverlap) {
                    // Revert to original value
                    this.value = fteValue.endMonth || '';
                    return;
                }
            }
            
            fteValue.endMonth = newEndMonth;
            await updateFteValue(fteValue);
            scheduleAutoBackup();
        });
    });
    
    // Delete button handlers
    document.querySelectorAll(".delete-fte-value").forEach(btn => {
        btn.addEventListener("click", async function() {
            const id = parseInt(this.dataset.id);
            
            // Validate deletion
            const validation = await validateFteValueDeletion(id);
            if (!validation.valid) {
                alert(validation.message);
                return;
            }
            
            await deleteFteValue(id);
            scheduleAutoBackup();
            renderFteValues();
        });
    });
}

// Populate person select dropdown
export async function populatePersonSelect() {
    if (typeof document === 'undefined') return;
    
    const select = document.getElementById("personSelect");
    if (!select) return;
    
    select.innerHTML = "";
    const people = await getPeople();
    
    people.filter(p => p.active).forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.name;
        select.appendChild(option);
    });
}

// Populate FTE person select dropdown
export async function populateFtePersonSelect() {
    if (typeof document === 'undefined') return;
    
    const select = document.getElementById("ftePersonSelect");
    if (!select) return;
    
    select.innerHTML = "";
    const people = await getPeople();
    
    people.filter(p => p.active).forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.name;
        select.appendChild(option);
    });
}

// Add person with auto-generated ID and initial FTE value
export async function addPersonAuto(name) {
    const id = await generatePersonId();
    await addPerson({ id, name, active: true });
    
    // Create initial FTE value for the person
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    await addFteValue({
        personId: id,
        fte: 1.0,
        startMonth: currentMonth,
        endMonth: null // Open-ended
    });
    
    scheduleAutoBackup();
    renderPeople();
    renderFteValues();
}

// Initialize people view
export function initPeopleView() {
    if (typeof document === 'undefined') return;
    
    const addPersonBtn = document.getElementById("addPersonBtn");
    if (addPersonBtn) {
        addPersonBtn.addEventListener("click", async () => {
            const name = prompt("Person name");
            if (name) await addPersonAuto(name);
        });
    }
    
    const addFteValueBtn = document.getElementById("addFteValueBtn");
    if (addFteValueBtn) {
        addFteValueBtn.addEventListener("click", async () => {
            const personId = document.getElementById("ftePersonSelect").value;
            const fte = parseFloat(document.getElementById("fteValueInput").value);
            const startMonth = document.getElementById("fteStartMonthInput").value;
            const endMonth = document.getElementById("fteEndMonthInput").value || null;
            
            if (!personId || !startMonth) {
                alert("Please select a person and start month");
                return;
            }
            
            // Validate FTE value
            const validation = validateFteValue(fte);
            if (!validation.valid) {
                alert(validation.message);
                return;
            }
            
            // Check for overlapping entries
            const overlapping = await findOverlappingFteValues(personId, startMonth, endMonth);
            
            if (overlapping.length > 0) {
                // Find open-ended entries to auto-close
                const toClose = await findOpenEndedFteValuesToClose(personId, startMonth);
                
                if (toClose.length > 0) {
                    // Ask user if they want to auto-close previous open-ended entry
                    const closeMsg = toClose.map(v => {
                        const endDate = new Date(startMonth + '-01');
                        endDate.setMonth(endDate.getMonth() - 1);
                        const suggestedEnd = endDate.toISOString().slice(0, 7);
                        return `  - FTE ${v.fte} starting ${v.startMonth} (will set end to ${suggestedEnd})`;
                    }).join('\n');
                    
                    const shouldClose = confirm(
                        `This FTE value overlaps with existing open-ended entries:\n${closeMsg}\n\n` +
                        `Do you want to automatically close the previous entries?\n` +
                        `Click OK to auto-close, or Cancel to create overlapping entries (not recommended).`
                    );
                    
                    if (shouldClose) {
                        // Auto-close previous open-ended entries
                        const endDate = new Date(startMonth + '-01');
                        endDate.setMonth(endDate.getMonth() - 1);
                        const suggestedEnd = endDate.toISOString().slice(0, 7);
                        
                        for (const value of toClose) {
                            value.endMonth = suggestedEnd;
                            await updateFteValue(value);
                        }
                    } else {
                        // User chose to create overlapping entries - warn them
                        const warnConfirm = confirm(
                            `Warning: Creating overlapping FTE entries may lead to unexpected behavior.\n` +
                            `The system will use the most recent entry when multiple values apply.\n\n` +
                            `Are you sure you want to continue?`
                        );
                        
                        if (!warnConfirm) {
                            return; // User cancelled
                        }
                    }
                } else {
                    // Overlapping but no open-ended entries to auto-close
                    const overlapMsg = overlapping.map(v => 
                        `  - FTE ${v.fte} from ${v.startMonth} to ${v.endMonth || 'ongoing'}`
                    ).join('\n');
                    
                    const confirmOverlap = confirm(
                        `Warning: This FTE value overlaps with existing entries:\n${overlapMsg}\n\n` +
                        `The system will use the most recent entry when multiple values apply.\n` +
                        `Are you sure you want to continue?`
                    );
                    
                    if (!confirmOverlap) {
                        return; // User cancelled
                    }
                }
            }
            
            await addFteValue({
                personId,
                fte,
                startMonth,
                endMonth
            });
            scheduleAutoBackup();
            renderFteValues();
        });
    }
}
