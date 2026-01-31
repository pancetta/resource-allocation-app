import { getPeople, getAllocationsByMonth } from '../data/database.js';
import { cellClass } from '../helpers/classUtil.js';

// Monthly Report View
export function renderMonthlyReport(month = "2024-01") {
    const monthAllocations = getAllocationsByMonth(month);
    const personTotals = {};

    monthAllocations.forEach(alloc => {
        if (!personTotals[alloc.personId]) {
            personTotals[alloc.personId] = 0;
        }
        personTotals[alloc.personId] += alloc.percentage;
    });

    let html = `<div class="report-section">`;
    html += `<h2>Monthly Report - ${month}</h2>`;
    html += `<table>`;
    html += `<thead><tr><th>Person</th><th>Role</th><th>Total Allocation %</th></tr></thead>`;
    html += `<tbody>`;

    getPeople().forEach(person => {
        const total = personTotals[person.id] || 0;
        const cssClass = cellClass(total);
        html += `<tr><td>${person.name}</td><td>${person.role}</td><td class="${cssClass}">${total}%</td></tr>`;
    });

    html += `</tbody></table></div>`;
    return html;
}
