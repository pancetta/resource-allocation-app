import { getPeople, getAllocationsByMonth } from '../data/database.js';
import { cellClass } from '../helpers/classUtil.js';

// Yearly Overview View
export function renderYearlyReport(year = "2024") {
    const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    
    let html = `<div class="report-section">`;
    html += `<h2>Yearly Overview - ${year}</h2>`;
    html += `<table>`;
    html += `<thead><tr><th>Person</th>`;
    
    months.forEach(month => {
        html += `<th>${year}-${month}</th>`;
    });
    html += `</tr></thead><tbody>`;

    getPeople().forEach(person => {
        html += `<tr><td>${person.name}</td>`;
        months.forEach(month => {
            const monthStr = `${year}-${month}`;
            const monthAllocations = getAllocationsByMonth(monthStr)
                .filter(a => a.personId === person.id);
            const total = monthAllocations.reduce((sum, a) => sum + a.percentage, 0);
            const cssClass = total > 0 ? cellClass(total) : '';
            html += `<td class="${cssClass}">${total > 0 ? total + '%' : '-'}</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    return html;
}
