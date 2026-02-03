import { describe, it, expect, beforeEach } from 'vitest';
import { 
    openDatabase, 
    addProject, 
    getProjects,
    addBudgetValue, 
    getBudgetValues,
    updateBudgetValue,
    clearCache
} from '../../js/data/database.js';
import { getEffectiveProjectBudget } from '../../js/helpers/overrideHelper.js';

describe('Budget Values Integration', () => {
    beforeEach(async () => {
        await openDatabase();
        clearCache();
    });

    it('should update plannedPM in budget values and reflect in reports', async () => {
        // Add a project
        const projectId = 'proj001';
        await addProject({ id: projectId, name: 'Test Project' });
        
        // Add initial budget value with plannedPM = 0
        const budgetValue = {
            projectId: projectId,
            plannedPM: 0,
            startMonth: '2024-01',
            endMonth: null
        };
        await addBudgetValue(budgetValue);
        
        // Verify initial state
        let budgetValues = await getBudgetValues();
        expect(budgetValues).toHaveLength(1);
        expect(budgetValues[0].plannedPM).toBe(0);
        
        // Check what reports would see
        let effectiveBudget = getEffectiveProjectBudget(projectId, '2024-01', budgetValues);
        expect(effectiveBudget).toBe(0);
        
        // Update the budget value to plannedPM = 1
        const updatedBudgetValue = { ...budgetValues[0], plannedPM: 1 };
        await updateBudgetValue(updatedBudgetValue);
        
        // Get fresh budget values after update
        budgetValues = await getBudgetValues();
        expect(budgetValues).toHaveLength(1);
        expect(budgetValues[0].plannedPM).toBe(1);
        
        // Check what reports would see AFTER the update
        effectiveBudget = getEffectiveProjectBudget(projectId, '2024-01', budgetValues);
        expect(effectiveBudget).toBe(1);
    });

    it('should handle multiple budget values for same project', async () => {
        const projectId = 'proj002';
        await addProject({ id: projectId, name: 'Test Project 2' });
        
        // Add budget value for Jan-Mar with plannedPM = 2
        await addBudgetValue({
            projectId: projectId,
            plannedPM: 2,
            startMonth: '2024-01',
            endMonth: '2024-03'
        });
        
        // Add budget value for Apr onwards with plannedPM = 5
        await addBudgetValue({
            projectId: projectId,
            plannedPM: 5,
            startMonth: '2024-04',
            endMonth: null
        });
        
        const budgetValues = await getBudgetValues();
        expect(budgetValues).toHaveLength(2);
        
        // Check February (should use first budget value)
        let effectiveBudget = getEffectiveProjectBudget(projectId, '2024-02', budgetValues);
        expect(effectiveBudget).toBe(2);
        
        // Check May (should use second budget value)
        effectiveBudget = getEffectiveProjectBudget(projectId, '2024-05', budgetValues);
        expect(effectiveBudget).toBe(5);
    });

    it('should use most recent budget value when multiple overlap', async () => {
        const projectId = 'proj003';
        await addProject({ id: projectId, name: 'Test Project 3' });
        
        // Add overlapping budget values
        await addBudgetValue({
            projectId: projectId,
            plannedPM: 1,
            startMonth: '2024-01',
            endMonth: null
        });
        
        await addBudgetValue({
            projectId: projectId,
            plannedPM: 3,
            startMonth: '2024-03',
            endMonth: null
        });
        
        const budgetValues = await getBudgetValues();
        
        // For February, should use the first value (startMonth 2024-01)
        let effectiveBudget = getEffectiveProjectBudget(projectId, '2024-02', budgetValues);
        expect(effectiveBudget).toBe(1);
        
        // For April, should use the most recent value (startMonth 2024-03)
        effectiveBudget = getEffectiveProjectBudget(projectId, '2024-04', budgetValues);
        expect(effectiveBudget).toBe(3);
    });
});
