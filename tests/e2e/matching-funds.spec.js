/**
 * E2E test for matching funds functionality
 * Verifies that users can select matching funds when creating a new project
 */

import { test, expect } from '@playwright/test';

test.describe('Matching Funds Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to initialize
    await page.waitForSelector('[data-tab="projects"]');
    
    // Navigate to Projects tab
    await page.click('[data-tab="projects"]');
    await page.waitForSelector('#projectsTable');
  });

  test('should enable matching funds checkbox for newly created project', async ({ page }) => {
    // Count existing projects first
    const initialRows = await page.locator('#projectsTable tbody tr').count();
    
    // Click Add Project button
    await page.click('#addProjectBtn');
    
    // Wait for quick-add row to appear
    await page.waitForSelector('.quick-add-row');
    
    // Enter project name
    const nameInput = page.locator('.quick-add-input').first();
    await nameInput.fill('Test Project');
    
    // Save the project
    await page.click('.quick-add-save');
    
    // Wait for the quick-add row to disappear (project was added)
    await page.waitForSelector('.quick-add-row', { state: 'detached' });
    
    // Wait for new row to appear in table
    await page.waitForFunction(
      (count) => document.querySelectorAll('#projectsTable tbody tr').length > count,
      initialRows
    );
    
    // Get all checkboxes
    const checkboxes = page.locator('input[type="checkbox"][data-field="deductsFromBaseFunding"]');
    const count = await checkboxes.count();
    
    // The last checkbox should be for our newly added project
    const checkbox = checkboxes.nth(count - 1);
    
    // Verify checkbox exists and is enabled
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeEnabled();
    
    // Verify checkbox is unchecked by default
    await expect(checkbox).not.toBeChecked();
  });

  test('should allow checking matching funds checkbox on new project', async ({ page }) => {
    // Count existing projects first
    const initialRows = await page.locator('#projectsTable tbody tr').count();
    
    // Add a new project
    await page.click('#addProjectBtn');
    await page.waitForSelector('.quick-add-row');
    const nameInput = page.locator('.quick-add-input').first();
    await nameInput.fill('Project with Matching Funds');
    await page.click('.quick-add-save');
    await page.waitForSelector('.quick-add-row', { state: 'detached' });
    
    // Wait for new row to appear in table
    await page.waitForFunction(
      (count) => document.querySelectorAll('#projectsTable tbody tr').length > count,
      initialRows
    );
    
    // Get the last checkbox (newly added project)
    const checkboxes = page.locator('input[type="checkbox"][data-field="deductsFromBaseFunding"]');
    let count = await checkboxes.count();
    let checkbox = checkboxes.nth(count - 1);
    
    // Check the matching funds checkbox
    await checkbox.check();
    
    // Wait a moment for the change to be saved
    await page.waitForTimeout(500);
    
    // Verify checkbox is checked
    await expect(checkbox).toBeChecked();
    
    // Refresh the page to verify it persisted
    await page.reload();
    await page.click('[data-tab="projects"]');
    await page.waitForSelector('#projectsTable');
    
    // Get the last checkbox again after reload
    const checkboxesAfterReload = page.locator('input[type="checkbox"][data-field="deductsFromBaseFunding"]');
    const countAfterReload = await checkboxesAfterReload.count();
    const checkboxAfterReload = checkboxesAfterReload.nth(countAfterReload - 1);
    
    // Verify checkbox is still checked
    await expect(checkboxAfterReload).toBeChecked();
  });

  test('should disable matching funds checkbox after first change', async ({ page }) => {
    // Count existing projects first
    const initialRows = await page.locator('#projectsTable tbody tr').count();
    
    // Add a new project
    await page.click('#addProjectBtn');
    await page.waitForSelector('.quick-add-row');
    const nameInput = page.locator('.quick-add-input').first();
    await nameInput.fill('Project Funds Test');
    await page.click('.quick-add-save');
    await page.waitForSelector('.quick-add-row', { state: 'detached' });
    
    // Wait for new row to appear in table
    await page.waitForFunction(
      (count) => document.querySelectorAll('#projectsTable tbody tr').length > count,
      initialRows
    );
    
    // Get the last checkbox (newly added project)
    const checkboxes = page.locator('input[type="checkbox"][data-field="deductsFromBaseFunding"]');
    let count = await checkboxes.count();
    let checkbox = checkboxes.nth(count - 1);
    
    // Initially checkbox should be enabled
    await expect(checkbox).toBeEnabled();
    
    // Check the checkbox
    await checkbox.check();
    
    // Wait for the re-render
    await page.waitForTimeout(500);
    
    // After change, get the checkbox again (since table was re-rendered)
    const checkboxesAfterChange = page.locator('input[type="checkbox"][data-field="deductsFromBaseFunding"]');
    count = await checkboxesAfterChange.count();
    const checkboxAfterChange = checkboxesAfterChange.nth(count - 1);
    
    // Should be disabled now and still checked
    await expect(checkboxAfterChange).toBeDisabled();
    await expect(checkboxAfterChange).toBeChecked();
  });
});
