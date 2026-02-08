/**
 * E2E tests for allocation validation and overallocation warnings
 */

import { test, expect } from '@playwright/test';

test.describe('Allocation Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('#people-tab');
    
    // Add a person with FTE value
    await page.click('#people-tab');
    await page.waitForSelector('#people');
    
    await page.fill('#person-name-input', 'Alice Smith');
    await page.click('#add-person-btn');
    await page.waitForTimeout(100);
    
    // Add FTE value for the person
    await page.click('#fteValuesTab');
    await page.waitForSelector('#fteValuesTable');
    await page.selectOption('select.fte-person-select', { index: 0 });
    await page.fill('#fte-fte-input', '1.0');
    await page.fill('#fte-start-month-input', '2025-01');
    await page.click('#add-fte-btn');
    await page.waitForTimeout(100);
    
    // Add a project with budget
    await page.click('#projects-tab');
    await page.waitForSelector('#projects');
    
    await page.fill('#project-name-input', 'Project Alpha');
    await page.click('#add-project-btn');
    await page.waitForTimeout(100);
    
    // Add budget value for the project
    await page.click('#budgetValuesTab');
    await page.waitForSelector('#budgetValuesTable');
    await page.selectOption('select.budget-project-select', { index: 0 });
    await page.fill('#budget-planned-pm-input', '5.0');
    await page.fill('#budget-start-month-input', '2025-01');
    await page.click('#add-budget-btn');
    await page.waitForTimeout(100);
    
    // Go to allocations tab
    await page.click('#allocations-tab');
    await page.waitForSelector('#allocations');
  });

  test('should show warning when person would be overallocated', async ({ page }) => {
    // Set up a dialog handler to capture the warning message
    let dialogMessage = '';
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss(); // Click Cancel to prevent allocation
    });
    
    // Try to allocate 1.5 PM (exceeds FTE of 1.0)
    await page.selectOption('#personSelect', { index: 0 });
    await page.selectOption('#projectSelect', { index: 0 });
    await page.fill('#pmInput', '1.5');
    await page.fill('#startMonthInput', '2025-01');
    await page.fill('#endMonthInput', '2025-12');
    await page.click('#addAllocationBtn');
    
    // Wait for validation to run
    await page.waitForTimeout(500);
    
    // Verify warning message was shown
    expect(dialogMessage).toContain('OVERALLOCATION WARNING');
    expect(dialogMessage).toContain('Alice Smith');
    expect(dialogMessage).toContain('FTE=1.00');
    expect(dialogMessage).toContain('would exceed FTE');
    
    // Verify allocation was not added (since we dismissed the dialog)
    const rows = await page.locator('#allocationsTable tbody tr').count();
    expect(rows).toBe(0);
  });

  test('should show warning when project would be overallocated', async ({ page }) => {
    // First add an allocation that's within limits
    let dialogMessage = '';
    let dialogCount = 0;
    
    page.on('dialog', async dialog => {
      dialogCount++;
      dialogMessage = dialog.message();
      
      // Accept the first dialog (if any overlap warning)
      // Dismiss the overallocation warning
      if (dialogCount === 1 || !dialogMessage.includes('OVERALLOCATION')) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
    
    // Add a valid allocation first (within budget)
    await page.selectOption('#personSelect', { index: 0 });
    await page.selectOption('#projectSelect', { index: 0 });
    await page.fill('#pmInput', '3.0');
    await page.fill('#startMonthInput', '2025-01');
    await page.fill('#endMonthInput', '2025-06');
    await page.click('#addAllocationBtn');
    await page.waitForTimeout(500);
    
    // Reset dialog counter for the overallocation attempt
    dialogMessage = '';
    dialogCount = 0;
    
    // Try to add another allocation that would exceed budget (3 + 4 = 7 > 5)
    await page.fill('#pmInput', '4.0');
    await page.fill('#startMonthInput', '2025-02');
    await page.fill('#endMonthInput', '2025-12');
    await page.click('#addAllocationBtn');
    await page.waitForTimeout(500);
    
    // Verify warning message was shown
    expect(dialogMessage).toContain('OVERALLOCATION WARNING');
    expect(dialogMessage).toContain('Project Alpha');
    expect(dialogMessage).toContain('Planned=5.00');
    expect(dialogMessage).toContain('would exceed budget');
  });

  test('should allow user to proceed with overallocation if confirmed', async ({ page }) => {
    // Set up dialog handler to accept the warning
    page.on('dialog', async dialog => {
      await dialog.accept(); // Click OK to proceed despite warning
    });
    
    // Try to allocate 1.5 PM (exceeds FTE of 1.0)
    await page.selectOption('#personSelect', { index: 0 });
    await page.selectOption('#projectSelect', { index: 0 });
    await page.fill('#pmInput', '1.5');
    await page.fill('#startMonthInput', '2025-01');
    await page.fill('#endMonthInput', '2025-12');
    await page.click('#addAllocationBtn');
    
    // Wait for allocation to be added
    await page.waitForTimeout(500);
    
    // Verify allocation was added (since we accepted the warning)
    const rows = await page.locator('#allocationsTable tbody tr').count();
    expect(rows).toBe(1);
    
    // Verify the PM value
    const pmCell = await page.locator('#allocationsTable tbody tr:first-child input.alloc-pm').inputValue();
    expect(pmCell).toBe('1.5');
  });

  test('should validate allocation updates', async ({ page }) => {
    // First add a valid allocation
    page.on('dialog', async dialog => {
      await dialog.accept(); // Accept any dialogs
    });
    
    await page.selectOption('#personSelect', { index: 0 });
    await page.selectOption('#projectSelect', { index: 0 });
    await page.fill('#pmInput', '0.5');
    await page.fill('#startMonthInput', '2025-01');
    await page.fill('#endMonthInput', '2025-12');
    await page.click('#addAllocationBtn');
    await page.waitForTimeout(500);
    
    // Reset and capture the next dialog
    let dialogMessage = '';
    page.removeAllListeners('dialog');
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss(); // Dismiss to prevent update
    });
    
    // Try to update the allocation to exceed FTE
    const pmInput = page.locator('#allocationsTable tbody tr:first-child input.alloc-pm');
    await pmInput.fill('2.0');
    await pmInput.blur();
    
    // Wait for validation
    await page.waitForTimeout(500);
    
    // Verify warning was shown
    expect(dialogMessage).toContain('OVERALLOCATION WARNING');
    expect(dialogMessage).toContain('Alice Smith');
    
    // Verify value was reverted (since we dismissed)
    const currentValue = await pmInput.inputValue();
    expect(currentValue).toBe('0.5');
  });

  test('should show specific conflict details in warning message', async ({ page }) => {
    let dialogMessage = '';
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    
    // Try to allocate 1.2 PM for a person with 1.0 FTE
    await page.selectOption('#personSelect', { index: 0 });
    await page.selectOption('#projectSelect', { index: 0 });
    await page.fill('#pmInput', '1.2');
    await page.fill('#startMonthInput', '2025-01');
    await page.fill('#endMonthInput', '2025-03');
    await page.click('#addAllocationBtn');
    await page.waitForTimeout(500);
    
    // Verify the message includes:
    // - Number of months with conflicts
    // - Specific month examples
    // - FTE values
    // - Existing allocation totals
    // - How much the new allocation would exceed by
    expect(dialogMessage).toContain('month(s)');
    expect(dialogMessage).toContain('2025-');
    expect(dialogMessage).toContain('FTE=1.00');
    expect(dialogMessage).toContain('existing=0.00 PM');
    expect(dialogMessage).toContain('new allocation=1.20 PM');
    expect(dialogMessage).toContain('exceed');
  });

  test('should handle multiple months with varying FTE values', async ({ page }) => {
    // Add another FTE value that reduces FTE in March
    await page.click('#people-tab');
    await page.click('#fteValuesTab');
    await page.selectOption('select.fte-person-select', { index: 0 });
    await page.fill('#fte-fte-input', '0.5');
    await page.fill('#fte-start-month-input', '2025-03');
    await page.click('#add-fte-btn');
    await page.waitForTimeout(100);
    
    await page.click('#allocations-tab');
    await page.waitForSelector('#allocations');
    
    let dialogMessage = '';
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    
    // Try to allocate 0.8 PM from Jan to Jun
    // This should be OK for Jan-Feb (FTE=1.0) but fail for Mar-Jun (FTE=0.5)
    await page.selectOption('#personSelect', { index: 0 });
    await page.selectOption('#projectSelect', { index: 0 });
    await page.fill('#pmInput', '0.8');
    await page.fill('#startMonthInput', '2025-01');
    await page.fill('#endMonthInput', '2025-06');
    await page.click('#addAllocationBtn');
    await page.waitForTimeout(500);
    
    // Verify warning mentions the months where FTE is exceeded
    expect(dialogMessage).toContain('OVERALLOCATION WARNING');
    expect(dialogMessage).toContain('month(s)'); // Multiple months
  });
});
