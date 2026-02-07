import { getPeople, getProjects, getAllocations, getFteValues, getBudgetValues, getAllocationOverrides, getBaseFundingProjects } from '../data/database.js';
import { cellClass } from '../helpers/classUtil.js';
import { buildAllocationIndex, buildAllocationOverrideIndex, calculatePersonMonthlyTotals, calculateProjectMonthlyTotals, calculatePersonTotal, calculateProjectTotal, sumArray, formatPM, calculateBaseFundingDeductions, calculateNetBaseFunding } from '../helpers/allocationHelper.js';
import { getEffectiveFte, getTotalEffectiveFte, getEffectiveProjectBudget, getTotalEffectiveProjectBudget } from '../helpers/overrideHelper.js';
import { getMonthsInYear } from '../helpers/dateHelper.js';

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
                return `<td class="${cellClass(c, monthFte)}">${c.toFixed(2)}</td>`;
            }).join('') +
            `<td class="${cellClass(total, expectedFteYearly)}">${total.toFixed(2)}</td>` +
            `<td>${expectedFteYearly.toFixed(2)}</td>` +
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
    const projHeader = ["Project", "", ...months, "Total"];
    projTable.innerHTML = `<thead><tr>${projHeader.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const projTbody = document.createElement("tbody");

    projects.forEach(p => {
        const cells = calculateProjectMonthlyTotals(allocationIndex, p.id, people, months, fteValues, allocationOverrideIndex);
        const total = sumArray(cells);
        
        // Calculate expected planned PM for the year
        const expectedPlannedYearly = getTotalEffectiveProjectBudget(p.id, months, budgetValues);
        
        const delta = total - expectedPlannedYearly;
        
        // Get planned PMs for each month
        const plannedCells = months.map(month => getEffectiveProjectBudget(p.id, month, budgetValues));
        const deltaCells = cells.map((c, idx) => c - plannedCells[idx]);
        
        // Planned row (first row with project name spanning 3 rows)
        const trPlanned = document.createElement("tr");
        trPlanned.innerHTML = `<td rowspan="3">${p.name}</td>` +
            `<td><em class="project-row-label-main">Planned</em></td>` +
            plannedCells.map(plannedValue => `<td>${plannedValue.toFixed(2)}</td>`).join('') +
            `<td>${expectedPlannedYearly.toFixed(2)}</td>`;
        projTbody.appendChild(trPlanned);
        
        // Allocated row (second row, no project name cell)
        const trAllocated = document.createElement("tr");
        trAllocated.innerHTML = `<td><em class="project-row-label-main">Allocated</em></td>` +
            cells.map((c, idx) => {
                const monthPlanned = plannedCells[idx];
                return `<td class="${cellClass(c, monthPlanned)}">${c.toFixed(2)}</td>`;
            }).join('') +
            `<td class="${cellClass(total, expectedPlannedYearly)}">${total.toFixed(2)}</td>`;
        projTbody.appendChild(trAllocated);
        
        // Delta row (third row, no project name cell)
        const trDelta = document.createElement("tr");
        trDelta.innerHTML = `<td class="project-row-delimiter"><em class="project-row-label-main">Delta</em></td>` +
            deltaCells.map(d => `<td class="${cellClass(d, 0)} project-row-delimiter">${d.toFixed(2)}</td>`).join('') +
            `<td class="${cellClass(delta, 0)} project-row-delimiter">${delta.toFixed(2)}</td>`;
        projTbody.appendChild(trDelta);
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

    // Build the total row HTML in one statement (with colspan for project name and label columns)
    sumRowProj.innerHTML = `<td colspan="2"><strong>Total</strong></td>` +
        monthlySumsProj.map(sum => `<td><strong>${sum.toFixed(2)}</strong></td>`).join('') +
        `<td><strong>${totalSumProj.toFixed(2)}</strong></td>`;
    tfootProj.appendChild(sumRowProj);
    
    projTable.appendChild(projTbody);
    projTable.appendChild(tfootProj);
    resultsOutput.appendChild(projTable);
    
    // --- Base Funding Table ---
    const baseFundingProjects = await getBaseFundingProjects();
    if (baseFundingProjects.length > 0) {
        // Calculate base funding deductions for each month and sum them
        const monthlyDeductions = months.map(month => {
            return calculateBaseFundingDeductions(allocationIndex, people, projects, month, fteValues, allocationOverrideIndex);
        });
        
        // Sum deductions across all months by base funding type
        const yearlyDeductions = {};
        monthlyDeductions.forEach(monthDeductions => {
            Object.keys(monthDeductions).forEach(type => {
                if (!yearlyDeductions[type]) {
                    yearlyDeductions[type] = 0;
                }
                yearlyDeductions[type] += monthDeductions[type];
            });
        });
        
        // Calculate yearly planned values for base funding projects
        const yearlyPlanned = {};
        baseFundingProjects.forEach(bfProj => {
            const totalPlanned = getTotalEffectiveProjectBudget(bfProj.id, months, budgetValues);
            yearlyPlanned[bfProj.id] = totalPlanned;
        });
        
        // Create base funding summary section
        const baseFundingSection = document.createElement("div");
        baseFundingSection.className = "base-funding-section";
        baseFundingSection.innerHTML = `<h3>Base Funding Summary</h3>`;
        
        const bfTable = document.createElement("table");
        bfTable.className = "base-funding-table";
        const bfHeader = ["Base Funding Type", "Planned PM", "Deductions", "Net Available", "Status"];
        bfTable.innerHTML = `<thead><tr>${bfHeader.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
        const bfTbody = document.createElement("tbody");
        
        baseFundingProjects.forEach(bfProj => {
            const type = bfProj.baseFundingType;
            const deduction = yearlyDeductions[type] || 0;
            const plannedPM = yearlyPlanned[bfProj.id] || 0;
            const net = plannedPM - deduction;
            
            const status = net >= 0 ? '✓ OK' : '⚠ Over-allocated';
            const statusClass = net >= 0 ? 'correct' : 'warning';
            
            const tr = document.createElement("tr");
            tr.className = 'base-funding-row';
            tr.innerHTML = `<td><strong>${bfProj.name}</strong></td>` +
                `<td>${plannedPM.toFixed(2)}</td>` +
                `<td>${deduction.toFixed(2)}</td>` +
                `<td class="${cellClass(net, 0)}">${net.toFixed(2)}</td>` +
                `<td class="${statusClass}">${status}</td>`;
            bfTbody.appendChild(tr);
        });
        
        bfTable.appendChild(bfTbody);
        baseFundingSection.appendChild(bfTable);
        resultsOutput.appendChild(baseFundingSection);
    }
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
