import { getPeople, getProjects, getAllocations, getFteValues, getBudgetValues, getAllocationOverrides } from '../data/database.js';
import { cellClass } from '../helpers/classUtil.js';
import { buildAllocationIndex, buildAllocationOverrideIndex, calculatePersonMonthlyTotals, calculateProjectMonthlyTotals, calculatePersonTotal, calculateProjectTotal, sumArray, formatPMWithPct } from '../helpers/allocationHelper.js';
import { getEffectiveFte, getTotalEffectiveFte, getEffectiveProjectBudget, getTotalEffectiveProjectBudget } from '../helpers/overrideHelper.js';
import { getMonthsInYear } from '../helpers/dateHelper.js';
import { formatNumber } from '../config/constants.js';

// Yearly Overview
export async function calculateYear(year) {
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
    resultsOutput.innerHTML = `<h3>Yearly Overview ${year}</h3>`;

    const months = getMonthsInYear(year);

    // --- People × Months Table ---
    const personTable = document.createElement("table");
    const pHeader = ["Person", ...months, "Total", "FTE", "Delta"];
    personTable.innerHTML = `<thead><tr>${pHeader.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const pTbody = document.createElement("tbody");

    people.forEach(p => {
        const cells = calculatePersonMonthlyTotals(allocationIndex, p.id, projects, months, 1, fteValues, allocationOverrideIndex);
        const total = sumArray(cells);
        
        // Calculate expected FTE for the year
        const expectedFteYearly = getTotalEffectiveFte(p.id, months, fteValues);
        
        const delta = total - expectedFteYearly;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.name}</td>` +
            cells.map((c, idx) => {
                const month = months[idx];
                const monthFte = getEffectiveFte(p.id, month, fteValues);
                return `<td class="${cellClass(c, monthFte)}">${formatPMWithPct(c, monthFte)}</td>`;
            }).join('') +
            `<td class="${cellClass(total, expectedFteYearly)}">${formatNumber(total)}</td>` +
            `<td>${formatNumber(expectedFteYearly)}</td>` +
            `<td class="${cellClass(delta, 0)}">${formatNumber(delta)}</td>`;
        pTbody.appendChild(tr);
    });

    // --- Totals Row ---
    const tfoot = document.createElement("tfoot");
    const sumRow = document.createElement("tr");

    // Pre-compute monthly sums (using optimized helper functions)

    const monthlySums = months.map(m => {
        let sum = 0;
        people.forEach(p => {
            const monthFte = getEffectiveFte(p.id, m, fteValues);
            sum += calculatePersonTotal(allocationIndex, p.id, projects, m, monthFte, allocationOverrideIndex);
        });
        return sum;
    });

    // Calculate total sum
    const totalSum = sumArray(monthlySums);
    let fteSum = 0;
    people.forEach(p => {
        months.forEach(month => {
            const monthFte = getEffectiveFte(p.id, month, fteValues);
            fteSum += monthFte;
        });
    });
    const deltaSum = totalSum - fteSum;

    // Build the total row HTML in one statement
    sumRow.innerHTML = `<td><strong>Total</strong></td>` +
        monthlySums.map(sum => `<td><strong>${formatNumber(sum)}</strong></td>`).join('') +
        `<td><strong>${formatNumber(totalSum)}</strong></td>` +
        `<td><strong>${formatNumber(fteSum)}</strong></td>` +
        `<td class="${cellClass(deltaSum, 0)}"><strong>${formatNumber(deltaSum)}</strong></td>`;
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
        const cells = calculateProjectMonthlyTotals(allocationIndex, p.id, people, months, fteValues, allocationOverrideIndex);
        const total = sumArray(cells);
        
        // Calculate expected planned PM for the year
        const expectedPlannedYearly = getTotalEffectiveProjectBudget(p.id, months, budgetValues);
        
        const delta = total - expectedPlannedYearly;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.name}</td>` +
            cells.map((c, idx) => {
                const month = months[idx];
                const monthPlanned = getEffectiveProjectBudget(p.id, month, budgetValues);
                return `<td class="${cellClass(c, monthPlanned)}">${formatNumber(c)}</td>`;
            }).join('') +
            `<td class="${cellClass(total, expectedPlannedYearly)}">${formatNumber(total)}</td>` +
            `<td>${formatNumber(expectedPlannedYearly)}</td>` +
            `<td class="${cellClass(delta, 0)}">${formatNumber(delta)}</td>`;
        projTbody.appendChild(tr);
    });

    // Totals row for projects
    const tfootProj = document.createElement("tfoot");
    const sumRowProj = document.createElement("tr");

    // Pre-compute monthly sums for projects (using optimized helper functions)
    const monthlySumsProj = months.map(m => {
        let sum = 0;
        projects.forEach(p => {
            sum += calculateProjectTotal(allocationIndex, p.id, people, m, fteValues, allocationOverrideIndex);
        });
        return sum;
    });

    // Calculate total sum
    const totalSumProj = sumArray(monthlySumsProj);
    let plannedSumProj = 0;
    projects.forEach(p => {
        plannedSumProj += getTotalEffectiveProjectBudget(p.id, months, budgetValues);
    });
    const deltaSumProj = totalSumProj - plannedSumProj;

    // Build the total row HTML in one statement
    sumRowProj.innerHTML = `<td><strong>Total</strong></td>` +
        monthlySumsProj.map(sum => `<td><strong>${formatNumber(sum)}</strong></td>`).join('') +
        `<td><strong>${formatNumber(totalSumProj)}</strong></td>` +
        `<td><strong>${formatNumber(plannedSumProj)}</strong></td>` +
        `<td class="${cellClass(deltaSumProj, 0)}"><strong>${formatNumber(deltaSumProj)}</strong></td>`;
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
