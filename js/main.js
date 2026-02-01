import { openDatabase, createBackup } from './data/database.js';
import { initTabs } from './ui/tabs.js';
import { renderPeople, populatePersonSelect, initPeopleView } from './views/peopleView.js';
import { renderProjects, populateProjectSelect, initProjectsView } from './views/projectsView.js';
import { renderAllocations, renderAllocationOverrides, populateAllocationSelect, initAllocationsView } from './views/allocationsView.js';
import { renderFteOverrides, populateFtePersonSelect, initFteHistoryView } from './views/fteHistoryView.js';
import { renderBudgetOverrides, populateBudgetProjectSelect, initBudgetHistoryView } from './views/budgetHistoryView.js';
import { initMonthlyReport } from './views/monthlyReport.js';
import { initYearlyReport } from './views/yearlyReport.js';
import { initProjectOverview } from './views/projectOverview.js';
import { init as initDataManagement, scheduleAutoBackup, updateAutoBackupStatus } from './views/dataManagement.js';

// Application initialization - only run if we're in a browser environment with DOM
if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.readyState !== undefined) {
    (async () => {
        // Open IndexedDB
        await openDatabase();
        
        // Initialize tabs
        initTabs();
        
        // Initialize views
        initPeopleView();
        initProjectsView();
        initAllocationsView();
        initFteHistoryView();
        initBudgetHistoryView();
        initDataManagement();
        
        // Initialize reports
        initMonthlyReport();
        initYearlyReport();
        initProjectOverview();
        
        // Render initial data
        await renderPeople();
        await renderProjects();
        await renderAllocations();
        await renderAllocationOverrides();
        await renderFteOverrides();
        await renderBudgetOverrides();
        
        // Populate selects
        await populatePersonSelect();
        await populateProjectSelect();
        await populateAllocationSelect();
        await populateFtePersonSelect();
        await populateBudgetProjectSelect();
        
        // Create initial backup if none exists
        try {
            await createBackup();
            console.log("Initial backup created");
            
            // Update auto-backup status after backup is created
            updateAutoBackupStatus();
        } catch (e) {
            console.error("Failed to create initial backup:", e);
        }
        
        // Signal that modules loaded successfully
        window.modulesLoaded = true;
    })();
}

// Export scheduleAutoBackup for use by other modules
export { scheduleAutoBackup };
