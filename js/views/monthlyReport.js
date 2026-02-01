import { getPeople, getProjects, getAllocations, getFteOverrides, getProjectBudgetOverrides, getAllocationOverrides } from '../data/database.js';
import { cellClass } from '../helpers/classUtil.js';
import { buildAllocationIndex, buildAllocationOverrideIndex, calculatePM, calculatePersonTotal, calculateProjectTotal } from '../helpers/allocationHelper.js';

// Monthly Report
export async function calculateMonth(month) {
    const people = await getPeople();
    const projects = await getProjects();
    const allocations = await getAllocations();
    const fteOverrides = await getFteOverrides();
    const projectBudgetOverrides = await getProjectBudgetOverrides();
    const allocationOverrides = await getAllocationOverrides();
    
    // Build indices once for performance
    const allocationIndex = buildAllocationIndex(allocations);
    const allocationOverrideIndex = buildAllocationOverrideIndex(allocationOverrides);
    
    const resultsOutput = document.getElementById("resultsOutput");
    resultsOutput.innerHTML = `<h3>Monthly Report ${month}</h3>`;

    // --- Person table ---
    const personTable = document.createElement("table");
    const pHeader = ["Person", ...projects.map(p => p.name), "Total", "FTE", "Delta"];
    personTable.innerHTML = `<thead><tr>${pHeader.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const pTbody = document.createElement("tbody");

    people.forEach(p => {
        // Get effective FTE for this month (considering overrides)
        let fte = p.fte ?? 1;
        const applicableFteOverrides = fteOverrides.filter(override => 
            override.personId === p.id &&
            override.startMonth <= month &&
            (!override.endMonth || override.endMonth >= month)
        );
        if (applicableFteOverrides.length > 0) {
            const sortedOverrides = applicableFteOverrides.sort((a, b) => 
                b.startMonth.localeCompare(a.startMonth)
            );
            fte = sortedOverrides[0].fte;
        }
        
        const cells = projects.map(proj => calculatePM(allocationIndex, p.id, proj.id, month, fte, allocationOverrideIndex));
        const total = calculatePersonTotal(allocationIndex, p.id, projects, month, fte, allocationOverrideIndex);
        const delta = total - fte;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.name}</td>` +
            cells.map(c => `<td class="${cellClass(c, fte / projects.length)}">${c.toFixed(2)}</td>`).join('') +
            `<td class="${cellClass(total, fte)}">${total.toFixed(2)}</td>` +
            `<td>${fte.toFixed(2)}</td>` +
            `<td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
        pTbody.appendChild(tr);
    });

    // Column totals
    const tfoot = document.createElement("tfoot");
    const sumRow = document.createElement("tr");
    sumRow.innerHTML = `<td><strong>Total</strong></td>` +
        projects.map(proj => {
            const sum = calculateProjectTotal(allocationIndex, proj.id, people, month, fteOverrides, allocationOverrideIndex);
            return `<td><strong>${sum.toFixed(2)}</strong></td>`;
        }).join('') +
        `<td colspan="3"></td>`;
    tfoot.appendChild(sumRow);

    personTable.appendChild(pTbody);
    personTable.appendChild(tfoot);
    resultsOutput.appendChild(personTable);

    // --- Project table ---
    const projTable = document.createElement("table");
    const projHeader = ["Project", "Allocated PM", "Planned PM", "Delta"];
    projTable.innerHTML = `<thead><tr>${projHeader.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const projTbody = document.createElement("tbody");

    projects.forEach(proj => {
        const total = calculateProjectTotal(allocationIndex, proj.id, people, month, fteOverrides, allocationOverrideIndex);
        
        // Get effective planned PM for this month (considering overrides)
        let planned = proj.plannedPM ?? 0;
        const applicableBudgetOverrides = projectBudgetOverrides.filter(override => 
            override.projectId === proj.id &&
            override.startMonth <= month &&
            (!override.endMonth || override.endMonth >= month)
        );
        if (applicableBudgetOverrides.length > 0) {
            const sortedOverrides = applicableBudgetOverrides.sort((a, b) => 
                b.startMonth.localeCompare(a.startMonth)
            );
            planned = sortedOverrides[0].plannedPM;
        }
        
        const delta = total - planned;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${proj.name}</td>` +
            `<td class="${cellClass(total, planned)}">${total.toFixed(2)}</td>` +
            `<td>${planned.toFixed(2)}</td>` +
            `<td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
        projTbody.appendChild(tr);
    });

    projTable.appendChild(projTbody);
    resultsOutput.appendChild(projTable);
}

// Initialize monthly report
export function initMonthlyReport() {
    if (typeof document === 'undefined') return;
    
    const calculateBtn = document.getElementById("calculateBtn");
    if (!calculateBtn) return;
    
    calculateBtn.addEventListener("click", async () => {
        const month = document.getElementById("monthInput").value;
        await calculateMonth(month);
    });
}
