import { getPeople, getProjects, getAllocations, getFteValues, getBudgetValues, getAllocationOverrides } from '../data/database.js';
import { cellClass } from '../helpers/classUtil.js';
import { buildAllocationIndex, buildAllocationOverrideIndex, calculatePM, calculatePersonTotal, calculateProjectTotal, formatPMWithPct } from '../helpers/allocationHelper.js';
import { getEffectiveFte, getEffectiveProjectBudget } from '../helpers/overrideHelper.js';
import { formatNumber } from '../config/constants.js';

// Monthly Report
export async function calculateMonth(month) {
    const people = await getPeople();
    const projects = await getProjects();
    const allocations = await getAllocations();
    const fteValues = await getFteValues();
    const budgetValues = await getBudgetValues();
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
        // Get effective FTE for this month
        const fte = getEffectiveFte(p.id, month, fteValues);
        
        const cells = projects.map(proj => calculatePM(allocationIndex, p.id, proj.id, month, fte, allocationOverrideIndex));
        const total = calculatePersonTotal(allocationIndex, p.id, projects, month, fte, allocationOverrideIndex);
        const delta = total - fte;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.name}</td>` +
            cells.map(c => `<td class="${cellClass(c, fte / projects.length)}">${formatPMWithPct(c, fte)}</td>`).join('') +
            `<td class="${cellClass(total, fte)}">${formatPMWithPct(total, fte)}</td>` +
            `<td>${formatNumber(fte)}</td>` +
            `<td class="${cellClass(delta, 0)}">${formatNumber(delta)}</td>`;
        pTbody.appendChild(tr);
    });

    // Column totals
    const tfoot = document.createElement("tfoot");
    const sumRow = document.createElement("tr");
    sumRow.innerHTML = `<td><strong>Total</strong></td>` +
        projects.map(proj => {
            const sum = calculateProjectTotal(allocationIndex, proj.id, people, month, fteValues, allocationOverrideIndex);
            return `<td><strong>${formatNumber(sum)}</strong></td>`;
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
        const total = calculateProjectTotal(allocationIndex, proj.id, people, month, fteValues, allocationOverrideIndex);
        
        // Get effective planned PM for this month
        const planned = getEffectiveProjectBudget(proj.id, month, budgetValues);
        
        const delta = total - planned;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${proj.name}</td>` +
            `<td class="${cellClass(total, planned)}">${formatNumber(total)}</td>` +
            `<td>${formatNumber(planned)}</td>` +
            `<td class="${cellClass(delta, 0)}">${formatNumber(delta)}</td>`;
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
