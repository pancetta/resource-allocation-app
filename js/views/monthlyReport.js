import { getPeople, getProjects, getAllocations } from '../data/database.js';
import { cellClass } from '../helpers/classUtil.js';
import { buildAllocationIndex, calculatePM, calculatePersonTotal, calculateProjectTotal } from '../helpers/allocationHelper.js';

// Monthly Report
export async function calculateMonth(month) {
    const people = await getPeople();
    const projects = await getProjects();
    const allocations = await getAllocations();
    
    // Build index once for performance
    const allocationIndex = buildAllocationIndex(allocations);
    
    const resultsOutput = document.getElementById("resultsOutput");
    resultsOutput.innerHTML = `<h3>Monthly Report ${month}</h3>`;

    // --- Person table ---
    const personTable = document.createElement("table");
    const pHeader = ["Person", ...projects.map(p => p.name), "Total", "FTE", "Delta"];
    personTable.innerHTML = `<thead><tr>${pHeader.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const pTbody = document.createElement("tbody");

    people.forEach(p => {
        const fte = p.fte ?? 1;
        const cells = projects.map(proj => calculatePM(allocationIndex, p.id, proj.id, month, fte));
        const total = calculatePersonTotal(allocationIndex, p.id, projects, month, fte);
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
            const sum = calculateProjectTotal(allocationIndex, proj.id, people, month);
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
        const total = calculateProjectTotal(allocationIndex, proj.id, people, month);
        const planned = proj.plannedPM ?? 0;
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
    document.getElementById("calculateBtn").addEventListener("click", async () => {
        const month = document.getElementById("monthInput").value;
        await calculateMonth(month);
    });
}
