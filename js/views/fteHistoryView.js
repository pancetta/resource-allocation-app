import { getPeople, getFteOverrides, updateFteOverride, deleteFteOverride, addFteOverride } from '../data/database.js';
import { scheduleAutoBackup } from '../main.js';

// Render FTE overrides table
export async function renderFteOverrides() {
    if (typeof document === 'undefined') return;
    
    const tbody = document.querySelector("#fteOverridesTable tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    const overrides = await getFteOverrides();
    const people = await getPeople();
    
    // Sort by person and start month
    const sortedOverrides = overrides.sort((a, b) => {
        if (a.personId !== b.personId) {
            return a.personId.localeCompare(b.personId);
        }
        return a.startMonth.localeCompare(b.startMonth);
    });
    
    sortedOverrides.forEach(override => {
        const person = people.find(p => p.id === override.personId);
        const personName = person ? person.name : override.personId;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${personName}</td>
            <td contenteditable="true" data-id="${override.id}" data-field="fte">${override.fte}</td>
            <td><input type="month" class="fte-start" value="${override.startMonth}" data-id="${override.id}"></td>
            <td><input type="month" class="fte-end" value="${override.endMonth || ''}" data-id="${override.id}"></td>
            <td><button class="delete-fte-override" data-id="${override.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    // Attach event listeners
    attachFteOverrideEventListeners();
    populateFtePersonSelect();
}

function attachFteOverrideEventListeners() {
    if (typeof document === 'undefined') return;
    
    // Content editable blur handlers
    document.querySelectorAll("#fteOverridesTable td[contenteditable]").forEach(td => {
        td.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const field = this.dataset.field;
            const value = this.textContent;
            
            const overrides = await getFteOverrides();
            const override = overrides.find(o => o.id === id);
            
            if (field === "fte") {
                override.fte = parseFloat(value);
            }
            
            await updateFteOverride(override);
            scheduleAutoBackup();
        });
    });
    
    // Start month input blur handlers
    document.querySelectorAll(".fte-start").forEach(input => {
        input.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const overrides = await getFteOverrides();
            const override = overrides.find(o => o.id === id);
            override.startMonth = this.value;
            await updateFteOverride(override);
            scheduleAutoBackup();
        });
    });
    
    // End month input blur handlers
    document.querySelectorAll(".fte-end").forEach(input => {
        input.addEventListener("blur", async function() {
            const id = parseInt(this.dataset.id);
            const overrides = await getFteOverrides();
            const override = overrides.find(o => o.id === id);
            override.endMonth = this.value || null;
            await updateFteOverride(override);
            scheduleAutoBackup();
        });
    });
    
    // Delete button handlers
    document.querySelectorAll(".delete-fte-override").forEach(btn => {
        btn.addEventListener("click", async function() {
            const id = parseInt(this.dataset.id);
            await deleteFteOverride(id);
            scheduleAutoBackup();
            renderFteOverrides();
        });
    });
}

// Populate person select dropdown
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

// Initialize FTE history view
export function initFteHistoryView() {
    if (typeof document === 'undefined') return;
    
    const addBtn = document.getElementById("addFteOverrideBtn");
    if (!addBtn) return;
    
    addBtn.addEventListener("click", async () => {
        const personId = document.getElementById("ftePersonSelect").value;
        const fte = parseFloat(document.getElementById("fteValueInput").value);
        const startMonth = document.getElementById("fteStartMonthInput").value;
        const endMonth = document.getElementById("fteEndMonthInput").value || null;
        
        if (!personId || !startMonth) {
            alert("Please select a person and start month");
            return;
        }
        
        await addFteOverride({
            personId,
            fte,
            startMonth,
            endMonth
        });
        scheduleAutoBackup();
        renderFteOverrides();
    });
}
