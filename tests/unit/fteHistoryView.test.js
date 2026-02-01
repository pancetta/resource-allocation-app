import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderFteOverrides, populateFtePersonSelect, initFteHistoryView } from '../../js/views/fteHistoryView.js';
import { openDatabase, clearCache, addPerson, addFteOverride, getFteOverrides } from '../../js/data/database.js';

// Mock scheduleAutoBackup
vi.mock('../../js/main.js', () => ({
    scheduleAutoBackup: vi.fn()
}));

describe('FTE History View', () => {
    beforeEach(async () => {
        // Set up DOM
        document.body.innerHTML = `
            <table id="fteOverridesTable">
                <tbody></tbody>
            </table>
            <select id="ftePersonSelect"></select>
            <input type="number" id="fteValueInput" value="0.5">
            <input type="month" id="fteStartMonthInput" value="2025-01">
            <input type="month" id="fteEndMonthInput" value="">
            <button id="addFteOverrideBtn">Add FTE Override</button>
        `;
        
        await openDatabase();
        clearCache();
    });

    describe('renderFteOverrides', () => {
        it('should render empty table when no overrides exist', async () => {
            await renderFteOverrides();
            
            const tbody = document.querySelector('#fteOverridesTable tbody');
            expect(tbody.children.length).toBe(0);
        });

        it('should render FTE overrides in table', async () => {
            // Add test data
            await addPerson({ id: 'p001', name: 'Alice', fte: 1.0, active: true });
            await addFteOverride({ personId: 'p001', fte: 0.5, startMonth: '2025-03', endMonth: '2025-06' });
            
            await renderFteOverrides();
            
            const tbody = document.querySelector('#fteOverridesTable tbody');
            expect(tbody.children.length).toBe(1);
            
            const row = tbody.children[0];
            expect(row.textContent).toContain('Alice');
            expect(row.textContent).toContain('0.5');
        });

        it('should sort overrides by person and start month', async () => {
            await addPerson({ id: 'p001', name: 'Alice', fte: 1.0, active: true });
            await addPerson({ id: 'p002', name: 'Bob', fte: 1.0, active: true });
            
            await addFteOverride({ personId: 'p001', fte: 0.5, startMonth: '2025-06', endMonth: null });
            await addFteOverride({ personId: 'p001', fte: 0.75, startMonth: '2025-03', endMonth: '2025-05' });
            await addFteOverride({ personId: 'p002', fte: 0.8, startMonth: '2025-01', endMonth: null });
            
            await renderFteOverrides();
            
            const tbody = document.querySelector('#fteOverridesTable tbody');
            expect(tbody.children.length).toBe(3);
            
            // Check sorting: p001 before p002, and within p001 sorted by start month
            const rows = Array.from(tbody.children);
            expect(rows[0].textContent).toContain('Alice');
            expect(rows[0].textContent).toContain('0.75'); // March
            expect(rows[1].textContent).toContain('Alice');
            expect(rows[1].textContent).toContain('0.5'); // June
            expect(rows[2].textContent).toContain('Bob');
        });
    });

    describe('populateFtePersonSelect', () => {
        it('should populate dropdown with active people', async () => {
            await addPerson({ id: 'p001', name: 'Alice', fte: 1.0, active: true });
            await addPerson({ id: 'p002', name: 'Bob', fte: 1.0, active: false });
            await addPerson({ id: 'p003', name: 'Charlie', fte: 1.0, active: true });
            
            await populateFtePersonSelect();
            
            const select = document.getElementById('ftePersonSelect');
            expect(select.options.length).toBe(2); // Only active people
            expect(select.options[0].textContent).toBe('Alice');
            expect(select.options[1].textContent).toBe('Charlie');
        });
    });

    describe('initFteHistoryView', () => {
        it('should initialize add button event listener', async () => {
            await addPerson({ id: 'p001', name: 'Alice', fte: 1.0, active: true });
            await populateFtePersonSelect();
            
            initFteHistoryView();
            
            const addBtn = document.getElementById('addFteOverrideBtn');
            expect(addBtn).toBeTruthy();
            
            // Simulate click
            document.getElementById('ftePersonSelect').value = 'p001';
            document.getElementById('fteValueInput').value = '0.5';
            document.getElementById('fteStartMonthInput').value = '2025-03';
            document.getElementById('fteEndMonthInput').value = '2025-06';
            
            addBtn.click();
            
            // Wait a bit for async operations
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const overrides = await getFteOverrides();
            expect(overrides.length).toBe(1);
            expect(overrides[0].personId).toBe('p001');
            expect(overrides[0].fte).toBe(0.5);
            expect(overrides[0].startMonth).toBe('2025-03');
            expect(overrides[0].endMonth).toBe('2025-06');
        });

        it('should show alert when person is not selected', async () => {
            // Mock alert
            const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
            
            initFteHistoryView();
            
            const addBtn = document.getElementById('addFteOverrideBtn');
            
            // Try to add without selecting person
            document.getElementById('ftePersonSelect').value = '';
            document.getElementById('fteStartMonthInput').value = '2025-03';
            
            addBtn.click();
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            expect(alertMock).toHaveBeenCalledWith('Please select a person and start month');
            
            alertMock.mockRestore();
        });

        it('should show alert when start month is not provided', async () => {
            // Mock alert
            const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
            
            await addPerson({ id: 'p001', name: 'Alice', fte: 1.0, active: true });
            await populateFtePersonSelect();
            
            initFteHistoryView();
            
            const addBtn = document.getElementById('addFteOverrideBtn');
            
            // Try to add without start month
            document.getElementById('ftePersonSelect').value = 'p001';
            document.getElementById('fteStartMonthInput').value = '';
            
            addBtn.click();
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            expect(alertMock).toHaveBeenCalledWith('Please select a person and start month');
            
            alertMock.mockRestore();
        });
    });
});
