import { openDatabase, createBackup } from './data/database.js';
import { initTabs } from './ui/tabs.js';
import { renderPeople, renderFteValues, populatePersonSelect, populateFtePersonSelect, initPeopleView } from './views/peopleView.js';
import { renderProjects, renderBudgetValues, populateProjectSelect, populateBudgetProjectSelect, initProjectsView } from './views/projectsView.js';
import { renderAllocations, renderAllocationOverrides, populateAllocationSelect, initAllocationsView } from './views/allocationsView.js';
import { initMonthlyReport } from './views/monthlyReport.js';
import { initYearlyReport } from './views/yearlyReport.js';
import { initTimelineView } from './views/timelineView.js';
import { init as initDataManagement, scheduleAutoBackup, updateAutoBackupStatus } from './views/dataManagement.js';
import { init as initScheduledBackups } from './views/scheduledBackups.js';
import { initUndoRedoShortcuts, updateUndoRedoButtons } from './helpers/undoManager.js';
import { initUIEnhancements } from './ui/enhancements.js';
import { initSmartDefaults } from './helpers/smartDefaults.js';

// Function to re-render all views (used after undo/redo)
async function rerenderAllViews() {
    await renderPeople();
    await renderFteValues();
    await renderProjects();
    await renderBudgetValues();
    await renderAllocations();
    await renderAllocationOverrides();
    
    await populatePersonSelect();
    await populateFtePersonSelect();
    await populateProjectSelect();
    await populateBudgetProjectSelect();
    await populateAllocationSelect();
}

// Application initialization - only run if we're in a browser environment with DOM
if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.readyState !== undefined) {
    (async () => {
        // Open IndexedDB
        await openDatabase();
        
        // Initialize tabs
        initTabs();
        
        // Initialize UI enhancements (undo/redo, help, etc.)
        initUIEnhancements();
        
        // Initialize smart defaults
        initSmartDefaults();
        
        // Initialize views
        initPeopleView();
        initProjectsView();
        initAllocationsView();
        initDataManagement();
        initScheduledBackups();
        
        // Initialize reports
        initMonthlyReport();
        initYearlyReport();
        initTimelineView();
        
        // Initialize undo/redo keyboard shortcuts
        initUndoRedoShortcuts();
        
        // Render initial data
        await rerenderAllViews();
        
        // Listen for data imported events (from undo/redo)
        document.addEventListener('dataImported', async () => {
            await rerenderAllViews();
        });
        
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
