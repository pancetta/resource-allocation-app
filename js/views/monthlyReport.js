import { getPeople, getProjects, getAllocations } from '../data/database.js';
import { cellClass } from '../helpers/classUtil.js';

// Monthly Report
export async function calculateMonth(month) {
    const people = await getPeople();
    const projects = await getProjects();
    const allocations = await getAllocations();
    const resultsOutput = document.getElementById("resultsOutput");
    resultsOutput.innerHTML = `<h3>Monthly Report ${month}</h3>`;

    // --- Person table ---
    const personTable = document.createElement("table");
    const pHeader = ["Person", ...projects.map(p => p.name), "Total", "FTE", "Delta"];
    personTable.innerHTML = `<thead><tr>${pHeader.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const pTbody = document.createElement("tbody");

    people.forEach(p => {
        const fte = p.fte ?? 1;
        let total = 0;
        const cells = projects.map(proj => {
            const alloc = allocations.filter(a => a.personId === p.id && a.projectId === proj.id
                && a.startMonth <= month && (!a.endMonth || a.endMonth >= month));
            const pm = alloc.reduce((s, a) => s + a.pct * fte, 0);
            total += pm;
            return pm;
        });
        const delta = total - fte;
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.name}</td>` +
            cells.map(c => `<td class="${cellClass(c, fte / projects.length)}">${c.toFixed(2)}</td>`).join('') +
            `<td class="${cellClass(total, fte)}">${total.toFixed(2)}</td>` +
            `<td>${fte.toFixed(2)}</td>` +
            `<td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
        pTbody.appendChild(tr);
    });

    // Column totals
    const tfoot = document.createElement("tfoot");
    const sumRow = document.createElement("tr");
    sumRow.innerHTML = `<td><strong>Total</strong></td>` +
        projects.map(proj => {
            let sum = 0;
            people.forEach(p => {
                const fte = p.fte ?? 1;
                const alloc = allocations.filter(a => a.personId === p.id && a.projectId === proj.id
                    && a.startMonth <= month && (!a.endMonth || a.endMonth >= month));
                sum += alloc.reduce((s, a) => s + a.pct * fte, 0);
            });
            return `<td class="${cellClass(sum, sum)}"><strong>${sum.toFixed(2)}</strong></td>`;
        }).join('') +
        `<td></td><td></td><td></td>`;
    tfoot.appendChild(sumRow);
    pTbody.appendChild(tfoot);

    personTable.appendChild(pTbody);
    resultsOutput.appendChild(personTable);

    // --- Project table ---
    const projTable = document.createElement("table");
    const projHeader = ["Project", "Allocated PM", "Planned PM", "Delta"];
    projTable.innerHTML = `<thead><tr>${projHeader.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const projTbody = document.createElement("tbody");

    projects.forEach(proj => {
        let total = 0;
        people.forEach(p => {
            const fte = p.fte ?? 1;
            const alloc = allocations.filter(a => a.personId === p.id && a.projectId === proj.id
                && a.startMonth <= month && (!a.endMonth || a.endMonth >= month));
            total += alloc.reduce((s, a) => s + a.pct * fte, 0);
        });
        const planned = proj.plannedPM ?? 0;
        const delta = total - planned;
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${proj.name}</td>` +
            `<td class="${cellClass(total, planned)}">${total.toFixed(2)}</td>` +
            `<td>${planned.toFixed(2)}</td>` +
            `<td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
        projTbody.appendChild(tr);
    });

    projTable.appendChild(projTbody);
    resultsOutput.appendChild(projTable);
}

// Initialize monthly report
export function initMonthlyReport() {
    document.getElementById("calculateBtn").addEventListener("click", async () => {
        const month = document.getElementById("monthInput").value;
        await calculateMonth(month);
    });
}
