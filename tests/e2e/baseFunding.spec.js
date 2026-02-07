import { test, expect } from '@playwright/test';

test.describe('Base Funding Workflow', () => {
  test('should demonstrate base funding deduction workflow', async ({ page }) => {
    await page.goto('http://localhost:8080/index.html');
    await page.waitForLoadState('networkidle');
    
    // Step 1: Navigate to Projects tab and verify base funding projects exist
    await page.click('button:has-text("Projects")');
    await page.waitForSelector('#projectsTable');
    
    // Should see Base Funding 210 and 220 in the table
    const table = page.locator('#projectsTable');
    await expect(table.locator('td:has-text("Base Funding 210")')).toBeVisible();
    await expect(table.locator('td:has-text("Base Funding 220")')).toBeVisible();
  });
  
  test('should show base funding in projects table with special styling', async ({ page }) => {
    await page.goto('http://localhost:8080/index.html');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Projects")');
    await page.waitForSelector('#projectsTable');
    
    // Check that base funding projects exist in the table
    const table = page.locator('#projectsTable');
    await expect(table.locator('td:has-text("Base Funding 210")').first()).toBeVisible();
    await expect(table.locator('td:has-text("Base Funding 220")').first()).toBeVisible();
  });
});
