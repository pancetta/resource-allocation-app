import { getPeople, getProjects, getAllocations } from '../data/database.js';
import { cellClass } from '../helpers/classUtil.js';
import { buildAllocationIndex, calculatePersonMonthlyTotals, calculateProjectMonthlyTotals, calculatePersonTotal, calculateProjectTotal, sumArray } from '../helpers/allocationHelper.js';

// Yearly Overview
export async function calculateYear(year) {
    const people = await getPeople();
    const projects = await getProjects();
    const allocations = await getAllocations();
    
    // Build index once for performance
    const allocationIndex = buildAllocationIndex(allocations);
    
    const resultsOutput = document.getElementById("resultsOutput");
    resultsOutput.innerHTML = `<h3>Yearly Overview ${year}</h3>`;

    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);

    // --- People × Months Table ---
    const personTable = document.createElement("table");
    const pHeader = ["Person", ...months, "Total", "FTE", "Delta"];
    personTable.innerHTML = `<thead><tr>${pHeader.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const pTbody = document.createElement("tbody");

    people.forEach(p => {
        const fte = p.fte ?? 1;
        const cells = calculatePersonMonthlyTotals(allocationIndex, p.id, projects, months, fte);
        const total = sumArray(cells);
        const delta = total - (fte * 12);
        
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.name}</td>` +
            cells.map(c => `<td class="${cellClass(c, fte)}">${c.toFixed(2)}</td>`).join('') +
            `<td class="${cellClass(total, fte * 12)}">${total.toFixed(2)}</td>` +
            `<td>${(fte * 12).toFixed(2)}</td>` +
            `<td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
        pTbody.appendChild(tr);
    });

    // --- Totals Row ---
    const tfoot = document.createElement("tfoot");
    const sumRow = document.createElement("tr");

    // Pre-compute monthly sums (using optimized helper functions)

    const monthlySums = months.map(m => {
        let sum = 0;
        people.forEach(p => {
            const fte = p.fte ?? 1;
            sum += calculatePersonTotal(allocationIndex, p.id, projects, m, fte);
        });
        return sum;
    });

    // Calculate total sum
    const totalSum = sumArray(monthlySums);
    const fteSum = people.reduce((sum, p) => sum + (p.fte ?? 1) * 12, 0);
    const deltaSum = totalSum - fteSum;

    // Build the total row HTML in one statement
    sumRow.innerHTML = `<td><strong>Total</strong></td>` +
        monthlySums.map(sum => `<td><strong>${sum.toFixed(2)}</strong></td>`).join('') +
        `<td><strong>${totalSum.toFixed(2)}</strong></td>` +
        `<td><strong>${fteSum.toFixed(2)}</strong></td>` +
        `<td class="${cellClass(deltaSum, 0)}"><strong>${deltaSum.toFixed(2)}</strong></td>`;
    tfoot.appendChild(sumRow);
    
    personTable.appendChild(pTbody);
    personTable.appendChild(tfoot);
    resultsOutput.appendChild(personTable);

    // --- Project × Months Table ---
    const projTable = document.createElement("table");
    const projHeader = ["Project", ...months, "Total", "Planned", "Delta"];
    projTable.innerHTML = `<thead><tr>${projHeader.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const projTbody = document.createElement("tbody");

    projects.forEach(p => {
        const cells = calculateProjectMonthlyTotals(allocationIndex, p.id, people, months);
        const total = sumArray(cells);
        const plannedTotal = (p.plannedPM ?? 0) * 12;
        const delta = total - plannedTotal;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.name}</td>` +
            cells.map(c => `<td class="${cellClass(c, p.plannedPM ?? 0)}">${c.toFixed(2)}</td>`).join('') +
            `<td class="${cellClass(total, plannedTotal)}">${total.toFixed(2)}</td>` +
            `<td>${plannedTotal.toFixed(2)}</td>` +
            `<td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
        projTbody.appendChild(tr);
    });

    // Totals row for projects
    const tfootProj = document.createElement("tfoot");
    const sumRowProj = document.createElement("tr");

    // Pre-compute monthly sums for projects (using optimized helper functions)
    const monthlySumsProj = months.map(m => {
        let sum = 0;
        projects.forEach(p => {
            sum += calculateProjectTotal(allocationIndex, p.id, people, m);
        });
        return sum;
    });

    // Calculate total sum
    const totalSumProj = sumArray(monthlySumsProj);
    const plannedSumProj = projects.reduce((sum, p) => (sum + (p.plannedPM ?? 0) * 12), 0);
    const deltaSumProj = totalSumProj - plannedSumProj;

    // Build the total row HTML in one statement
    sumRowProj.innerHTML = `<td><strong>Total</strong></td>` +
        monthlySumsProj.map(sum => `<td><strong>${sum.toFixed(2)}</strong></td>`).join('') +
        `<td><strong>${totalSumProj.toFixed(2)}</strong></td>` +
        `<td><strong>${plannedSumProj.toFixed(2)}</strong></td>` +
        `<td class="${cellClass(deltaSumProj, 0)}"><strong>${deltaSumProj.toFixed(2)}</strong></td>`;
    tfootProj.appendChild(sumRowProj);
    
    projTable.appendChild(projTbody);
    projTable.appendChild(tfootProj);
    resultsOutput.appendChild(projTable);
}

// Initialize yearly report
export function initYearlyReport() {
    if (typeof document === 'undefined') return;
    
    const calculateYearBtn = document.getElementById("calculateYearBtn");
    if (!calculateYearBtn) return;
    
    calculateYearBtn.addEventListener("click", async () => {
        const year = document.getElementById("yearInput").value;
        await calculateYear(year);
    });
}
