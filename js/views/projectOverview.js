import { getPersonById, getProjectById, getAllocationsByProject } from '../data/database.js';
import { cellClass } from '../helpers/classUtil.js';

// Project Overview View
export function renderProjectOverview(projectId = 1) {
    const project = getProjectById(projectId);
    if (!project) return '<p>Project not found</p>';

    const projectAllocations = getAllocationsByProject(projectId);
    
    // Get unique months for this project
    const projectMonths = [...new Set(projectAllocations.map(a => a.month))].sort();
    
    let html = `<div class="report-section">`;
    html += `<h2>Project Overview - ${project.name}</h2>`;
    html += `<table>`;
    html += `<thead><tr><th>Person</th><th>Role</th>`;
    
    projectMonths.forEach(month => {
        html += `<th>${month}</th>`;
    });
    html += `</tr></thead><tbody>`;

    const peopleOnProject = new Set(projectAllocations.map(a => a.personId));
    
    peopleOnProject.forEach(personId => {
        const person = getPersonById(personId);
        html += `<tr><td>${person.name}</td><td>${person.role}</td>`;
        
        projectMonths.forEach(month => {
            const alloc = projectAllocations.find(a => a.personId === personId && a.month === month);
            const percentage = alloc ? alloc.percentage : 0;
            const cssClass = percentage > 0 ? cellClass(percentage) : '';
            html += `<td class="${cssClass}">${percentage > 0 ? percentage + '%' : '-'}</td>`;
        });
        
        html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    return html;
}
