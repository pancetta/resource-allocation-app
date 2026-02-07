import { getBaseFundingProjects } from '../data/database.js';
import { cellClass } from './classUtil.js';
import { calculateBaseFundingDeductions, calculateNetBaseFunding } from './allocationHelper.js';
import { getTotalEffectiveProjectBudget } from './overrideHelper.js';

/**
 * Generate base funding summary table for reports
 * This shows how matching funds allocations are deducted from base funding
 * 
 * @param {Array} months - Array of month strings in YYYY-MM format
 * @param {Map} allocationIndex - Pre-built allocation index
 * @param {Array} people - Array of person objects
 * @param {Array} projects - Array of project objects
 * @param {Array} fteValues - Array of FTE value objects
 * @param {Map} allocationOverrideIndex - Pre-built allocation override index
 * @param {Array} budgetValues - Array of budget value objects
 * @returns {HTMLElement|null} Base funding section element, or null if no base funding projects
 */
export async function generateBaseFundingSummaryTable(
    months,
    allocationIndex,
    people,
    projects,
    fteValues,
    allocationOverrideIndex,
    budgetValues
) {
    const baseFundingProjects = await getBaseFundingProjects();
    
    if (baseFundingProjects.length === 0) {
        return null;
    }
    
    // Calculate base funding deductions for each month and sum them
    const monthlyDeductions = months.map(month => {
        return calculateBaseFundingDeductions(
            allocationIndex,
            people,
            projects,
            month,
            fteValues,
            allocationOverrideIndex
        );
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
    
    return baseFundingSection;
}
