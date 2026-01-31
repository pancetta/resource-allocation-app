import { getPeople, getProjects, getAllocations } from '../data/database.js';
import { cellClass } from '../helpers/classUtil.js';

// Project × Month Overview
export async function renderProjectMonthlyOverview(year) {
    const projects = await getProjects();
    const people = await getPeople();
    const allocations = await getAllocations();
    const resultsOutput = document.getElementById("resultsOutput");
    resultsOutput.innerHTML = `<h3>Project × Month Overview ${year}</h3>`;

    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
    const table = document.createElement("table");
    const header = ["Project", ...months, "Total", "Planned", "Delta"];
    table.innerHTML = `<thead><tr>${header.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const tbody = document.createElement("tbody");

    projects.forEach(p => {
        let total = 0;
        const cells = months.map(month => {
            let pm = 0;
            people.forEach(person => {
                const fte = person.fte ?? 1;
                const alloc = allocations.filter(a => a.projectId === p.id && a.personId === person.id && a.startMonth <= month && (!a.endMonth || a.endMonth >= month));
                pm += alloc.reduce((s, a) => s + a.pct * fte, 0);
            });
            total += pm;
            return pm;
        });

        const plannedTotal = (p.plannedPM ?? 0) * 12;
        const delta = total - plannedTotal;
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.name}</td>` +
            cells.map(c => `<td class="${cellClass(c, p.plannedPM ?? 0)}">${c.toFixed(2)}</td>`).join('') +
            `<td class="${cellClass(total, plannedTotal)}">${total.toFixed(2)}</td>` +
            `<td>${plannedTotal.toFixed(2)}</td>` +
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
                people.forEach(person => {
                    const fte = person.fte ?? 1;
                    const alloc = allocations.filter(a => a.projectId === p.id && a.personId === person.id && a.startMonth <= month && (!a.endMonth || a.endMonth >= month));
                    monthSum += alloc.reduce((s, a) => s + a.pct * fte, 0);
                });
            });
            return `<td class="${cellClass(monthSum, monthSum)}"><strong>${monthSum.toFixed(2)}</strong></td>`;
        }).join('') +
        `<td></td><td></td><td></td>`;
    tfoot.appendChild(sumRow);
    table.appendChild(tbody);
    table.appendChild(tfoot);
    resultsOutput.appendChild(table);
}

// Initialize project monthly overview
export function initProjectOverview() {
    document.getElementById("projectMonthlyBtn").addEventListener("click", async () => {
        const year = document.getElementById("overviewYearInput").value;
        await renderProjectMonthlyOverview(year);
    });
}
