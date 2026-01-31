import { renderMonthlyReport } from './views/monthlyReport.js';
import { renderYearlyReport } from './views/yearlyReport.js';
import { renderProjectOverview } from './views/projectOverview.js';

// Application initialization
function initApp() {
    // Get DOM elements
    const output = document.getElementById('output');
    const btnMonthly = document.getElementById('btnMonthly');
    const btnYearly = document.getElementById('btnYearly');
    const btnProject = document.getElementById('btnProject');

    // Event handlers
    btnMonthly.addEventListener('click', function() {
        output.innerHTML = renderMonthlyReport("2024-01");
    });

    btnYearly.addEventListener('click', function() {
        output.innerHTML = renderYearlyReport("2024");
    });

    btnProject.addEventListener('click', function() {
        output.innerHTML = renderProjectOverview(1);
    });

    // Initialize with monthly report
    output.innerHTML = renderMonthlyReport("2024-01");
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
