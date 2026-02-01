import { getPeople, getProjects, getAllocations, getFteOverrides, getProjectBudgetOverrides, getAllocationOverrides } from '../data/database.js';
import { cellClass } from '../helpers/classUtil.js';
import { buildAllocationIndex, buildAllocationOverrideIndex, calculatePersonMonthlyTotals, calculateProjectMonthlyTotals, calculatePersonTotal, calculateProjectTotal, sumArray, formatPMWithPct } from '../helpers/allocationHelper.js';

// Yearly Overview
export async function calculateYear(year) {
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
    resultsOutput.innerHTML = `<h3>Yearly Overview ${year}</h3>`;

    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);

    // --- People × Months Table ---
    const personTable = document.createElement("table");
    const pHeader = ["Person", ...months, "Total", "FTE", "Delta"];
    personTable.innerHTML = `<thead><tr>${pHeader.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const pTbody = document.createElement("tbody");

    people.forEach(p => {
        const fte = p.fte ?? 1;
        const cells = calculatePersonMonthlyTotals(allocationIndex, p.id, projects, months, fte, fteOverrides, allocationOverrideIndex);
        const total = sumArray(cells);
        
        // Calculate expected FTE for the year considering overrides
        let expectedFteYearly = 0;
        months.forEach(month => {
            let monthFte = fte;
            const applicableFteOverrides = fteOverrides.filter(override => 
                override.personId === p.id &&
                override.startMonth <= month &&
                (!override.endMonth || override.endMonth >= month)
            );
            if (applicableFteOverrides.length > 0) {
                const sortedOverrides = applicableFteOverrides.sort((a, b) => 
                    b.startMonth.localeCompare(a.startMonth)
                );
                monthFte = sortedOverrides[0].fte;
            }
            expectedFteYearly += monthFte;
        });
        
        const delta = total - expectedFteYearly;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.name}</td>` +
            cells.map((c, idx) => {
                const month = months[idx];
                let monthFte = fte;
                const applicableFteOverrides = fteOverrides.filter(override => 
                    override.personId === p.id &&
                    override.startMonth <= month &&
                    (!override.endMonth || override.endMonth >= month)
                );
                if (applicableFteOverrides.length > 0) {
                    const sortedOverrides = applicableFteOverrides.sort((a, b) => 
                        b.startMonth.localeCompare(a.startMonth)
                    );
                    monthFte = sortedOverrides[0].fte;
                }
                return `<td class="${cellClass(c, monthFte)}">${formatPMWithPct(c, monthFte)}</td>`;
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
            let fte = p.fte ?? 1;
            const applicableFteOverrides = fteOverrides.filter(override => 
                override.personId === p.id &&
                override.startMonth <= m &&
                (!override.endMonth || override.endMonth >= m)
            );
            if (applicableFteOverrides.length > 0) {
                const sortedOverrides = applicableFteOverrides.sort((a, b) => 
                    b.startMonth.localeCompare(a.startMonth)
                );
                fte = sortedOverrides[0].fte;
            }
            sum += calculatePersonTotal(allocationIndex, p.id, projects, m, fte, allocationOverrideIndex);
        });
        return sum;
    });

    // Calculate total sum considering FTE overrides
    const totalSum = sumArray(monthlySums);
    let fteSum = 0;
    people.forEach(p => {
        months.forEach(month => {
            let monthFte = p.fte ?? 1;
            const applicableFteOverrides = fteOverrides.filter(override => 
                override.personId === p.id &&
                override.startMonth <= month &&
                (!override.endMonth || override.endMonth >= month)
            );
            if (applicableFteOverrides.length > 0) {
                const sortedOverrides = applicableFteOverrides.sort((a, b) => 
                    b.startMonth.localeCompare(a.startMonth)
                );
                monthFte = sortedOverrides[0].fte;
            }
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
    const projHeader = ["Project", ...months, "Total", "Planned", "Delta"];
    projTable.innerHTML = `<thead><tr>${projHeader.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const projTbody = document.createElement("tbody");

    projects.forEach(p => {
        const cells = calculateProjectMonthlyTotals(allocationIndex, p.id, people, months, fteOverrides, allocationOverrideIndex);
        const total = sumArray(cells);
        
        // Calculate expected planned PM for the year considering overrides
        let expectedPlannedYearly = 0;
        months.forEach(month => {
            let monthPlanned = p.plannedPM ?? 0;
            const applicableBudgetOverrides = projectBudgetOverrides.filter(override => 
                override.projectId === p.id &&
                override.startMonth <= month &&
                (!override.endMonth || override.endMonth >= month)
            );
            if (applicableBudgetOverrides.length > 0) {
                const sortedOverrides = applicableBudgetOverrides.sort((a, b) => 
                    b.startMonth.localeCompare(a.startMonth)
                );
                monthPlanned = sortedOverrides[0].plannedPM;
            }
            expectedPlannedYearly += monthPlanned;
        });
        
        const delta = total - expectedPlannedYearly;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.name}</td>` +
            cells.map((c, idx) => {
                const month = months[idx];
                let monthPlanned = p.plannedPM ?? 0;
                const applicableBudgetOverrides = projectBudgetOverrides.filter(override => 
                    override.projectId === p.id &&
                    override.startMonth <= month &&
                    (!override.endMonth || override.endMonth >= month)
                );
                if (applicableBudgetOverrides.length > 0) {
                    const sortedOverrides = applicableBudgetOverrides.sort((a, b) => 
                        b.startMonth.localeCompare(a.startMonth)
                    );
                    monthPlanned = sortedOverrides[0].plannedPM;
                }
                return `<td class="${cellClass(c, monthPlanned)}">${c.toFixed(2)}</td>`;
            }).join('') +
            `<td class="${cellClass(total, expectedPlannedYearly)}">${total.toFixed(2)}</td>` +
            `<td>${expectedPlannedYearly.toFixed(2)}</td>` +
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
            sum += calculateProjectTotal(allocationIndex, p.id, people, m, fteOverrides, allocationOverrideIndex);
        });
        return sum;
    });

    // Calculate total sum considering budget overrides
    const totalSumProj = sumArray(monthlySumsProj);
    let plannedSumProj = 0;
    projects.forEach(p => {
        months.forEach(month => {
            let monthPlanned = p.plannedPM ?? 0;
            const applicableBudgetOverrides = projectBudgetOverrides.filter(override => 
                override.projectId === p.id &&
                override.startMonth <= month &&
                (!override.endMonth || override.endMonth >= month)
            );
            if (applicableBudgetOverrides.length > 0) {
                const sortedOverrides = applicableBudgetOverrides.sort((a, b) => 
                    b.startMonth.localeCompare(a.startMonth)
                );
                monthPlanned = sortedOverrides[0].plannedPM;
            }
            plannedSumProj += monthPlanned;
        });
    });
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
