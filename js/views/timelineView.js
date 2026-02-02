/**
 * Timeline Visualization
 * 
 * Creates a visual timeline showing allocations across months
 */

import { getAllocations, getPeople, getProjects } from '../data/database.js';

/**
 * Generate a color from a string (consistent color for same input)
 * @param {string} str - Input string
 * @returns {string} Hex color
 */
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const h = hash % 360;
    const s = 65;
    const l = 55;
    
    return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Parse YYYY-MM to Date
 * @param {string} monthStr - Month string in YYYY-MM format
 * @returns {Date} Date object
 */
function parseMonth(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month - 1, 1);
}

/**
 * Format month for display
 * @param {string} monthStr - Month string in YYYY-MM format
 * @returns {string} Formatted month
 */
function formatMonth(monthStr) {
    const date = parseMonth(monthStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

/**
 * Get list of months between start and end
 * @param {string} startMonth - Start month YYYY-MM
 * @param {string} endMonth - End month YYYY-MM
 * @param {number} maxMonths - Maximum months to show
 * @returns {Array<string>} Array of month strings
 */
function getMonthRange(startMonth, endMonth, maxMonths = 24) {
    const months = [];
    let current = parseMonth(startMonth);
    const end = endMonth ? parseMonth(endMonth) : new Date(current.getFullYear() + 2, current.getMonth(), 1);
    
    let count = 0;
    while (current <= end && count < maxMonths) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        months.push(`${year}-${month}`);
        current.setMonth(current.getMonth() + 1);
        count++;
    }
    
    return months;
}

/**
 * Render timeline visualization
 * @param {string} containerId - ID of container element
 * @param {number} year - Year to display
 */
export async function renderTimeline(containerId, year) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Get data
    const allocations = await getAllocations();
    const people = await getPeople();
    const projects = await getProjects();
    
    // Filter allocations for the year
    const yearStart = `${year}-01`;
    const yearEnd = `${year}-12`;
    
    const relevantAllocations = allocations.filter(a => {
        const start = a.startMonth;
        const end = a.endMonth || '9999-12'; // Open-ended treated as far future
        return start <= yearEnd && end >= yearStart;
    });
    
    if (relevantAllocations.length === 0) {
        container.innerHTML = '<p>No allocations found for this year.</p>';
        return;
    }
    
    // Get all months in the year
    const months = [];
    for (let m = 1; m <= 12; m++) {
        months.push(`${year}-${String(m).padStart(2, '0')}`);
    }
    
    // Create timeline HTML
    const html = `
        <div class="timeline-container">
            <h3>Allocation Timeline for ${year}</h3>
            <div class="timeline-grid">
                <div class="timeline-row timeline-header-row">
                    <div class="timeline-label">Person → Project</div>
                    ${months.map(m => `<div class="timeline-month-header">${formatMonth(m)}</div>`).join('')}
                </div>
                ${relevantAllocations.map(alloc => {
                    const person = people.find(p => p.id === alloc.personId);
                    const project = projects.find(p => p.id === alloc.projectId);
                    const personName = person ? person.name : alloc.personId;
                    const projectName = project ? project.name : alloc.projectId;
                    const color = stringToColor(alloc.projectId);
                    
                    return `
                        <div class="timeline-row">
                            <div class="timeline-label" title="${personName} → ${projectName}">${personName} → ${projectName}</div>
                            ${months.map(m => {
                                const start = alloc.startMonth;
                                const end = alloc.endMonth || '9999-12';
                                const isActive = m >= start && m <= end;
                                const pm = alloc.pm;
                                
                                return `
                                    <div class="timeline-cell ${isActive ? 'timeline-active' : ''}" 
                                         style="${isActive ? `background-color: ${color}; opacity: ${Math.min(pm * 0.5 + 0.3, 1)}` : ''}"
                                         title="${isActive ? `${personName} → ${projectName}: ${pm} PM` : ''}">
                                        ${isActive ? pm.toFixed(1) : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="timeline-legend">
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #ccc;"></div>
                    <span>No allocation</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: hsl(200, 65%, 55%); opacity: 0.5;"></div>
                    <span>Low allocation (&lt;0.5 PM)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: hsl(200, 65%, 55%);"></div>
                    <span>High allocation (≥0.5 PM)</span>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Initialize timeline view
 */
export function initTimelineView() {
    if (typeof document === 'undefined') return;
    
    const showTimelineBtn = document.getElementById('showTimelineBtn');
    if (showTimelineBtn) {
        showTimelineBtn.addEventListener('click', async () => {
            const year = parseInt(document.getElementById('timelineYearInput')?.value || new Date().getFullYear());
            await renderTimeline('timelineOutput', year);
        });
    }
}
