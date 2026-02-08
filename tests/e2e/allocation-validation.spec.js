/**
 * E2E tests for allocation validation and overallocation warnings
 */

import { test, expect } from '@playwright/test';

test.describe('Allocation Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('[data-tab="people"]');
    
    // People tab should be visible by default
    await page.waitForSelector('#people');
    
    // Add a person using quick-add row
    await page.click('#addPersonBtn');
    await page.waitForSelector('.quick-add-row', { timeout: 5000 });
    await page.fill('.quick-add-row input', 'Alice Smith');
    await page.press('.quick-add-row input', 'Enter');
    await page.waitForSelector('#peopleTable tbody tr:not(.quick-add-row)', { timeout: 10000 });
    await page.waitForTimeout(500);
    
    // Add FTE value for the person (already on people tab)
    await page.selectOption('#ftePersonSelect', { label: 'Alice Smith' });
    await page.fill('#fteValueInput', '1.0');
    await page.fill('#fteStartMonthInput', '2025-01');
    await page.click('#addFteValueBtn');
    await page.waitForTimeout(500);
    
    // Add a project with budget
    await page.click('[data-tab="projects"]');
    await page.waitForSelector('#projects');
    
    // Add project using quick-add row
    await page.click('#addProjectBtn');
    await page.waitForSelector('.quick-add-row', { timeout: 5000 });
    await page.fill('.quick-add-row input', 'Project Alpha');
    await page.press('.quick-add-row input', 'Enter');
    await page.waitForSelector('#projectsTable tbody tr:not(.quick-add-row)', { timeout: 10000 });
    await page.waitForTimeout(500);
    
    // Add budget value for the project (already on projects tab)
    await page.selectOption('#budgetProjectSelect', { label: 'Project Alpha' });
    await page.fill('#budgetValueInput', '5.0');
    await page.fill('#budgetStartMonthInput', '2025-01');
    await page.click('#addBudgetValueBtn');
    await page.waitForTimeout(500);
    
    // Go to allocations tab
    await page.click('[data-tab="allocations"]');
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
    await page.selectOption('#personSelect', { label: 'Alice Smith' });
    await page.selectOption('#projectSelect', { label: 'Project Alpha' });
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
    
    // Add a valid allocation first (within budget and within person capacity)
    await page.selectOption('#personSelect', { label: 'Alice Smith' });
    await page.selectOption('#projectSelect', { label: 'Project Alpha' });
    await page.fill('#pmInput', '0.3');
    await page.fill('#startMonthInput', '2025-01');
    await page.fill('#endMonthInput', '2025-06');
    await page.click('#addAllocationBtn');
    await page.waitForTimeout(500);
    
    // Reset dialog counter for the overallocation attempt
    dialogMessage = '';
    dialogCount = 0;
    
    // Try to add another allocation that would exceed budget (0.3 + 0.8 = 1.1 > person's 1.0 FTE)
    // Wait, we need to test PROJECT overallocation, not person
    // We need a second person to allocate more to the project
    // Let's go back to people tab and add another person
    await page.click('[data-tab="people"]');
    await page.waitForSelector('#people');
    
    // Add second person
    await page.click('#addPersonBtn');
    await page.waitForSelector('.quick-add-row', { timeout: 5000 });
    await page.fill('.quick-add-row input', 'Bob Jones');
    await page.press('.quick-add-row input', 'Enter');
    await page.waitForSelector('#peopleTable tbody tr:not(.quick-add-row)', { timeout: 10000 });
    await page.waitForTimeout(500);
    
    // Add FTE for second person
    await page.selectOption('#ftePersonSelect', { label: 'Bob Jones' });
    await page.fill('#fteValueInput', '1.0');
    await page.fill('#fteStartMonthInput', '2025-01');
    await page.click('#addFteValueBtn');
    await page.waitForTimeout(500);
    
    // Go back to allocations
    await page.click('[data-tab="allocations"]');
    await page.waitForSelector('#allocations');
    
    // Now add allocation from Bob that exceeds project budget
    // Alice has 0.3 PM, if Bob adds 0.8 PM, total = 1.1 PM, but person capacity is OK
    // But we want to exceed PROJECT budget which is 5.0 PM
    // Alice has 0.3, if Bob adds 4.8, total = 5.1 > 5.0 budget
    await page.selectOption('#personSelect', { label: 'Bob Jones' });
    await page.selectOption('#projectSelect', { label: 'Project Alpha' });
    await page.fill('#pmInput', '4.8');
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
    await page.selectOption('#personSelect', { label: 'Alice Smith' });
    await page.selectOption('#projectSelect', { label: 'Project Alpha' });
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
    
    await page.selectOption('#personSelect', { label: 'Alice Smith' });
    await page.selectOption('#projectSelect', { label: 'Project Alpha' });
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
    await page.selectOption('#personSelect', { label: 'Alice Smith' });
    await page.selectOption('#projectSelect', { label: 'Project Alpha' });
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
    await page.click('[data-tab="people"]');
    await page.waitForSelector('#people');
    await page.selectOption('#ftePersonSelect', { label: 'Alice Smith' });
    await page.fill('#fteValueInput', '0.5');
    await page.fill('#fteStartMonthInput', '2025-03');
    await page.click('#addFteValueBtn');
    await page.waitForTimeout(500);
    
    await page.click('[data-tab="allocations"]');
    await page.waitForSelector('#allocations');
    
    let dialogMessage = '';
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    
    // Try to allocate 0.8 PM from Jan to Jun
    // This should be OK for Jan-Feb (FTE=1.0) but fail for Mar-Jun (FTE=0.5)
    await page.selectOption('#personSelect', { label: 'Alice Smith' });
    await page.selectOption('#projectSelect', { label: 'Project Alpha' });
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
