import { getPeople, updatePerson, deletePerson, addPerson, generatePersonId, getFteValues, addFteValue, updateFteValue, deleteFteValue } from '../data/database.js';
import { scheduleAutoBackup } from '../main.js';
import { validateFteValueDeletion } from '../helpers/validationHelper.js';

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
            fteValue.startMonth = this.value;
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
            fteValue.endMonth = this.value || null;
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
