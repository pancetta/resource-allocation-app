import { openDatabase } from './data/database.js';
import { initTabs } from './ui/tabs.js';
import { renderPeople, populatePersonSelect, initPeopleView } from './views/peopleView.js';
import { renderProjects, populateProjectSelect, initProjectsView } from './views/projectsView.js';
import { renderAllocations, initAllocationsView } from './views/allocationsView.js';
import { initMonthlyReport } from './views/monthlyReport.js';
import { initYearlyReport } from './views/yearlyReport.js';
import { initProjectOverview } from './views/projectOverview.js';

// Application initialization
(async () => {
    // Open IndexedDB
    await openDatabase();
    
    // Initialize tabs
    initTabs();
    
    // Initialize views
    initPeopleView();
    initProjectsView();
    initAllocationsView();
    
    // Initialize reports
    initMonthlyReport();
    initYearlyReport();
    initProjectOverview();
    
    // Render initial data
    await renderPeople();
    await renderProjects();
    await renderAllocations();
    
    // Populate selects
    await populatePersonSelect();
    await populateProjectSelect();
    
    // Signal that modules loaded successfully
    window.modulesLoaded = true;
})();
