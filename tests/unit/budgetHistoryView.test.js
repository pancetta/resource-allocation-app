import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderBudgetOverrides, populateBudgetProjectSelect, initBudgetHistoryView } from '../../js/views/budgetHistoryView.js';
import { openDatabase, clearCache, addProject, addProjectBudgetOverride, getProjectBudgetOverrides } from '../../js/data/database.js';

// Mock scheduleAutoBackup
vi.mock('../../js/main.js', () => ({
    scheduleAutoBackup: vi.fn()
}));

describe('Budget History View', () => {
    beforeEach(async () => {
        // Set up DOM
        document.body.innerHTML = `
            <table id="budgetOverridesTable">
                <tbody></tbody>
            </table>
            <select id="budgetProjectSelect"></select>
            <input type="number" id="budgetValueInput" value="5">
            <input type="month" id="budgetStartMonthInput" value="2025-01">
            <input type="month" id="budgetEndMonthInput" value="">
            <button id="addBudgetOverrideBtn">Add Budget Override</button>
        `;
        
        await openDatabase();
        clearCache();
    });

    describe('renderBudgetOverrides', () => {
        it('should render empty table when no overrides exist', async () => {
            await renderBudgetOverrides();
            
            const tbody = document.querySelector('#budgetOverridesTable tbody');
            expect(tbody.children.length).toBe(0);
        });

        it('should render budget overrides in table', async () => {
            // Add test data
            await addProject({ id: 'proj001', name: 'Project A', plannedPM: 10 });
            await addProjectBudgetOverride({ projectId: 'proj001', plannedPM: 5, startMonth: '2025-03', endMonth: '2025-06' });
            
            await renderBudgetOverrides();
            
            const tbody = document.querySelector('#budgetOverridesTable tbody');
            expect(tbody.children.length).toBe(1);
            
            const row = tbody.children[0];
            expect(row.textContent).toContain('Project A');
            expect(row.textContent).toContain('5');
        });

        it('should sort overrides by project and start month', async () => {
            await addProject({ id: 'proj001', name: 'Project A', plannedPM: 10 });
            await addProject({ id: 'proj002', name: 'Project B', plannedPM: 8 });
            
            await addProjectBudgetOverride({ projectId: 'proj001', plannedPM: 5, startMonth: '2025-06', endMonth: null });
            await addProjectBudgetOverride({ projectId: 'proj001', plannedPM: 7, startMonth: '2025-03', endMonth: '2025-05' });
            await addProjectBudgetOverride({ projectId: 'proj002', plannedPM: 4, startMonth: '2025-01', endMonth: null });
            
            await renderBudgetOverrides();
            
            const tbody = document.querySelector('#budgetOverridesTable tbody');
            expect(tbody.children.length).toBe(3);
            
            // Check sorting: proj001 before proj002, and within proj001 sorted by start month
            const rows = Array.from(tbody.children);
            expect(rows[0].textContent).toContain('Project A');
            expect(rows[0].textContent).toContain('7'); // March
            expect(rows[1].textContent).toContain('Project A');
            expect(rows[1].textContent).toContain('5'); // June
            expect(rows[2].textContent).toContain('Project B');
        });
    });

    describe('populateBudgetProjectSelect', () => {
        it('should populate dropdown with all projects', async () => {
            await addProject({ id: 'proj001', name: 'Project A', plannedPM: 10 });
            await addProject({ id: 'proj002', name: 'Project B', plannedPM: 8 });
            await addProject({ id: 'proj003', name: 'Project C', plannedPM: 12 });
            
            await populateBudgetProjectSelect();
            
            const select = document.getElementById('budgetProjectSelect');
            expect(select.options.length).toBe(3);
            expect(select.options[0].textContent).toBe('Project A');
            expect(select.options[1].textContent).toBe('Project B');
            expect(select.options[2].textContent).toBe('Project C');
        });
    });

    describe('initBudgetHistoryView', () => {
        it('should initialize add button event listener', async () => {
            await addProject({ id: 'proj001', name: 'Project A', plannedPM: 10 });
            await populateBudgetProjectSelect();
            
            initBudgetHistoryView();
            
            const addBtn = document.getElementById('addBudgetOverrideBtn');
            expect(addBtn).toBeTruthy();
            
            // Simulate click
            document.getElementById('budgetProjectSelect').value = 'proj001';
            document.getElementById('budgetValueInput').value = '5';
            document.getElementById('budgetStartMonthInput').value = '2025-03';
            document.getElementById('budgetEndMonthInput').value = '2025-06';
            
            addBtn.click();
            
            // Wait a bit for async operations
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const overrides = await getProjectBudgetOverrides();
            expect(overrides.length).toBe(1);
            expect(overrides[0].projectId).toBe('proj001');
            expect(overrides[0].plannedPM).toBe(5);
            expect(overrides[0].startMonth).toBe('2025-03');
            expect(overrides[0].endMonth).toBe('2025-06');
        });

        it('should show alert when project is not selected', async () => {
            // Mock alert
            const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
            
            initBudgetHistoryView();
            
            const addBtn = document.getElementById('addBudgetOverrideBtn');
            
            // Try to add without selecting project
            document.getElementById('budgetProjectSelect').value = '';
            document.getElementById('budgetStartMonthInput').value = '2025-03';
            
            addBtn.click();
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            expect(alertMock).toHaveBeenCalledWith('Please select a project and start month');
            
            alertMock.mockRestore();
        });

        it('should show alert when start month is not provided', async () => {
            // Mock alert
            const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
            
            await addProject({ id: 'proj001', name: 'Project A', plannedPM: 10 });
            await populateBudgetProjectSelect();
            
            initBudgetHistoryView();
            
            const addBtn = document.getElementById('addBudgetOverrideBtn');
            
            // Try to add without start month
            document.getElementById('budgetProjectSelect').value = 'proj001';
            document.getElementById('budgetStartMonthInput').value = '';
            
            addBtn.click();
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            expect(alertMock).toHaveBeenCalledWith('Please select a project and start month');
            
            alertMock.mockRestore();
        });
    });
});
