import { getPeople, getProjects, getAllocations, getFteValues, getBudgetValues, getAllocationOverrides } from '../data/database.js';
import { cellClass } from '../helpers/classUtil.js';
import { buildAllocationIndex, buildAllocationOverrideIndex, calculateProjectMonthlyTotals, calculateProjectTotal, sumArray } from '../helpers/allocationHelper.js';
import { getEffectiveProjectBudget, getTotalEffectiveProjectBudget } from '../helpers/overrideHelper.js';
import { generateBaseFundingSummaryTable } from '../helpers/baseFundingHelper.js';

// Project × Month Overview
export async function renderProjectMonthlyOverview(year) {
    const projects = await getProjects();
    const people = await getPeople();
    const allocations = await getAllocations();
    const fteValues = await getFteValues();
    const budgetValues = await getBudgetValues();
    const allocationOverrides = await getAllocationOverrides();
    
    // Build indices once for performance
    const allocationIndex = buildAllocationIndex(allocations);
    const allocationOverrideIndex = buildAllocationOverrideIndex(allocationOverrides);
    
    const resultsOutput = document.getElementById("resultsOutput");
    resultsOutput.innerHTML = `<h3>Project × Month Overview ${year}</h3>`;

    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
    const table = document.createElement("table");
    const header = ["Project", ...months, "Total", "Planned", "Delta"];
    table.innerHTML = `<thead><tr>${header.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const tbody = document.createElement("tbody");

    projects.forEach(p => {
        const cells = calculateProjectMonthlyTotals(allocationIndex, p.id, people, months, fteValues, allocationOverrideIndex, projects);
        const total = sumArray(cells);
        
        // Calculate expected planned PM for the year
        const expectedPlannedYearly = getTotalEffectiveProjectBudget(p.id, months, budgetValues);
        
        const delta = total - expectedPlannedYearly;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.name}</td>` +
            cells.map((c, idx) => {
                const month = months[idx];
                const monthPlanned = getEffectiveProjectBudget(p.id, month, budgetValues);
                return `<td class="${cellClass(c, monthPlanned)}">${c.toFixed(2)}</td>`;
            }).join('') +
            `<td class="${cellClass(total, expectedPlannedYearly)}">${total.toFixed(2)}</td>` +
            `<td>${expectedPlannedYearly.toFixed(2)}</td>` +
            `<td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
        tbody.appendChild(tr);
    });

    // Column totals
    const tfoot = document.createElement("tfoot");
    const sumRow = document.createElement("tr");
    sumRow.innerHTML = `<td><strong>Total</strong></td>` +
        months.map(month => {
            let monthSum = 0;
            projects.forEach(p => {
                monthSum += calculateProjectTotal(allocationIndex, p.id, people, month, fteValues, allocationOverrideIndex, projects);
            });
            return `<td><strong>${monthSum.toFixed(2)}</strong></td>`;
        }).join('') +
        `<td colspan="3"></td>`;
    tfoot.appendChild(sumRow);
    table.appendChild(tbody);
    table.appendChild(tfoot);
    resultsOutput.appendChild(table);
    
    // --- Base Funding Table ---
    const baseFundingSection = await generateBaseFundingSummaryTable(
        months,
        allocationIndex,
        people,
        projects,
        fteValues,
        allocationOverrideIndex,
        budgetValues
    );
    
    if (baseFundingSection) {
        resultsOutput.appendChild(baseFundingSection);
    }
}

// Initialize project monthly overview
export function initProjectOverview() {
    if (typeof document === 'undefined') return;
    
    const projectMonthlyBtn = document.getElementById("projectMonthlyBtn");
    if (!projectMonthlyBtn) return;
    
    projectMonthlyBtn.addEventListener("click", async () => {
        const year = document.getElementById("overviewYearInput").value;
        await renderProjectMonthlyOverview(year);
    });
}
