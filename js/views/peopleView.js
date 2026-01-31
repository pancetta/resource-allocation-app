import { getPeople, updatePerson, deletePerson, addPerson, generatePersonId } from '../data/database.js';
import { scheduleAutoBackup } from '../main.js';

// Render people table
export async function renderPeople() {
    const tbody = document.querySelector("#peopleTable tbody");
    tbody.innerHTML = "";
    const people = await getPeople();
    
    people.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td contenteditable="true" data-id="${p.id}" data-field="name">${p.name}</td>
            <td contenteditable="true" data-id="${p.id}" data-field="fte">${p.fte ?? 1}</td>
            <td><input type="checkbox" ${p.active ? "checked" : ""} data-id="${p.id}" data-field="active"></td>
            <td><button class="delete-person" data-id="${p.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    // Attach event listeners
    attachPeopleEventListeners();
    populatePersonSelect();
}

function attachPeopleEventListeners() {
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
            } else if (field === "fte") {
                person.fte = parseFloat(value);
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
            await deletePerson(id);
            scheduleAutoBackup();
            renderPeople();
        });
    });
}

// Populate person select dropdown
export async function populatePersonSelect() {
    const select = document.getElementById("personSelect");
    select.innerHTML = "";
    const people = await getPeople();
    
    people.filter(p => p.active).forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.name;
        select.appendChild(option);
    });
}

// Add person with auto-generated ID
export async function addPersonAuto(name) {
    const id = await generatePersonId();
    await addPerson({ id, name, active: true, fte: 1 });
    scheduleAutoBackup();
    renderPeople();
}

// Initialize people view
export function initPeopleView() {
    if (typeof document === 'undefined') return;
    
    const addPersonBtn = document.getElementById("addPersonBtn");
    if (!addPersonBtn) return;
    
    addPersonBtn.addEventListener("click", async () => {
        const name = prompt("Person name");
        if (name) await addPersonAuto(name);
    });
}
