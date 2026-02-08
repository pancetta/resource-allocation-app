import { getPeople, getProjects, getAllocations, getFteValues, getBudgetValues, getAllocationOverrides, getBaseFundingProjects, isBaseFundingProject, deductsFromBaseFunding } from '../data/database.js';
import { cellClass } from '../helpers/classUtil.js';
import { buildAllocationIndex, buildAllocationOverrideIndex, calculatePM, calculatePersonTotal, calculateProjectTotal, formatPM, pmToPercentage, formatPercentage, calculateBaseFundingDeductions, calculateNetBaseFunding } from '../helpers/allocationHelper.js';
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
        projects.map(p => {
            const projectNumber = p.projectNumber ? `<br><small>${p.projectNumber}</small>` : '';
            return `<th colspan="2">${p.name}${projectNumber}</th>`;
        }).join('');
    
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
                       `<td>${c.toFixed(2)}</td>`;
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
        const sum = calculateProjectTotal(allocationIndex, proj.id, people, month, fteValues, allocationOverrideIndex, projects);
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
        const total = calculateProjectTotal(allocationIndex, proj.id, people, month, fteValues, allocationOverrideIndex, projects);
        
        // Get effective planned PM for this month
        const planned = getEffectiveProjectBudget(proj.id, month, budgetValues);
        
        const delta = total - planned;
        
        // Format project name with number on separate line if it exists
        const projectDisplay = proj.projectNumber 
            ? `${proj.name}<br><small>${proj.projectNumber}</small>` 
            : proj.name;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${projectDisplay}</td>` +
            `<td>${total.toFixed(2)}</td>` +
            `<td>${planned.toFixed(2)}</td>` +
            `<td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
        projTbody.appendChild(tr);
    });

    projTable.appendChild(projTbody);
    resultsOutput.appendChild(projTable);
    
    // --- Base Funding Table ---
    const baseFundingProjects = await getBaseFundingProjects();
    if (baseFundingProjects.length > 0) {
        // Calculate base funding deductions
        const deductions = calculateBaseFundingDeductions(allocationIndex, people, projects, month, fteValues, allocationOverrideIndex);
        const netValues = calculateNetBaseFunding(baseFundingProjects, deductions, budgetValues, month);
        
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
            const values = netValues[bfProj.id] || { planned: 0, deductions: 0, net: 0 };
            const status = values.net >= 0 ? '✓ OK' : '⚠ Over-allocated';
            const statusClass = values.net >= 0 ? 'correct' : 'warning';
            
            const tr = document.createElement("tr");
            tr.className = 'base-funding-row';
            tr.innerHTML = `<td><strong>${bfProj.name}</strong></td>` +
                `<td>${values.planned.toFixed(2)}</td>` +
                `<td>${values.deductions.toFixed(2)}</td>` +
                `<td>${values.net.toFixed(2)}</td>` +
                `<td class="${statusClass}">${status}</td>`;
            bfTbody.appendChild(tr);
        });
        
        bfTable.appendChild(bfTbody);
        baseFundingSection.appendChild(bfTable);
        resultsOutput.appendChild(baseFundingSection);
    }
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
