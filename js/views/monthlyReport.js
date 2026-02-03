import { getPeople, getProjects, getAllocations, getFteValues, getBudgetValues, getAllocationOverrides } from '../data/database.js';
import { cellClass } from '../helpers/classUtil.js';
import { buildAllocationIndex, buildAllocationOverrideIndex, calculatePM, calculatePersonTotal, calculateProjectTotal, formatPM, pmToPercentage, formatPercentage } from '../helpers/allocationHelper.js';
import { getEffectiveFte, getEffectiveProjectBudget } from '../helpers/overrideHelper.js';

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
    
    // Create two-row header with colspan
    const headerRow1 = document.createElement("tr");
    headerRow1.innerHTML = `<th rowspan="2">Person</th>` +
        `<th rowspan="2">FTE</th>` +
        `<th rowspan="2">Delta</th>` +
        `<th colspan="2">Total</th>` +
        projects.map(p => `<th colspan="2">${p.name}</th>`).join('');
    
    const headerRow2 = document.createElement("tr");
    headerRow2.innerHTML = 
        `<th class="sub-header">%</th><th class="sub-header">PM</th>` +
        projects.map(() => `<th class="sub-header">%</th><th class="sub-header">PM</th>`).join('');
    
    const thead = document.createElement("thead");
    thead.appendChild(headerRow1);
    thead.appendChild(headerRow2);
    personTable.appendChild(thead);
    
    const pTbody = document.createElement("tbody");

    people.forEach(p => {
        // Get effective FTE for this month
        const fte = getEffectiveFte(p.id, month, fteValues);
        
        const cells = projects.map(proj => calculatePM(allocationIndex, p.id, proj.id, month, fte, allocationOverrideIndex));
        const total = calculatePersonTotal(allocationIndex, p.id, projects, month, fte, allocationOverrideIndex);
        const delta = total - fte;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.name}</td>` +
            `<td>${fte.toFixed(2)}</td>` +
            `<td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>` +
            `<td class="pct-cell">${pmToPercentage(total, fte).toFixed(1)}%</td>` +
            `<td class="${cellClass(total, fte)}">${total.toFixed(2)}</td>` +
            cells.map(c => {
                const pct = pmToPercentage(c, fte);
                return `<td class="pct-cell">${pct.toFixed(1)}%</td>` +
                       `<td class="${cellClass(c, fte / projects.length)}">${c.toFixed(2)}</td>`;
            }).join('');
        pTbody.appendChild(tr);
    });

    // Column totals
    const tfoot = document.createElement("tfoot");
    const sumRow = document.createElement("tr");
    
    // Calculate total FTE and total delta
    const totalFte = people.reduce((sum, p) => {
        const fte = getEffectiveFte(p.id, month, fteValues);
        return sum + fte;
    }, 0);
    
    const totalDelta = people.reduce((sum, p) => {
        const fte = getEffectiveFte(p.id, month, fteValues);
        const personTotal = calculatePersonTotal(allocationIndex, p.id, projects, month, fte, allocationOverrideIndex);
        return sum + (personTotal - fte);
    }, 0);
    
    // Calculate total for overall allocation
    const overallTotal = people.reduce((sum, p) => {
        const fte = getEffectiveFte(p.id, month, fteValues);
        return sum + calculatePersonTotal(allocationIndex, p.id, projects, month, fte, allocationOverrideIndex);
    }, 0);
    
    const overallPct = totalFte > 0 ? pmToPercentage(overallTotal, totalFte) : 0;
    
    const projectTotalCells = projects.map(proj => {
        const sum = calculateProjectTotal(allocationIndex, proj.id, people, month, fteValues, allocationOverrideIndex);
        const sumPct = totalFte > 0 ? pmToPercentage(sum, totalFte) : 0;
        return `<td class="pct-cell"><strong>${sumPct.toFixed(1)}%</strong></td>` +
               `<td><strong>${sum.toFixed(2)}</strong></td>`;
    }).join('');
    
    sumRow.innerHTML = `<td><strong>Total</strong></td>` +
        `<td><strong>${totalFte.toFixed(2)}</strong></td>` +
        `<td class="${cellClass(totalDelta, 0)}"><strong>${totalDelta.toFixed(2)}</strong></td>` +
        `<td class="pct-cell"><strong>${overallPct.toFixed(1)}%</strong></td>` +
        `<td><strong>${overallTotal.toFixed(2)}</strong></td>` +
        projectTotalCells;
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
