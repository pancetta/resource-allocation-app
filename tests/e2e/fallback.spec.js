import { test, expect } from '@playwright/test';

test.describe('Bundle.js Fallback', () => {
  test.beforeEach(async ({ page }) => {
    // Load the fallback test page which uses bundle.js directly
    await page.goto('/test-fallback.html');
    // Wait for the app to initialize
    await page.waitForSelector('.tab-button[data-tab="data"]');
  });

  test('should load app with bundle.js fallback', async ({ page }) => {
    // Verify basic elements are present
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.tab-button[data-tab="people"]')).toBeVisible();
    await expect(page.locator('.tab-button[data-tab="data"]')).toBeVisible();
  });

  test('should show auto-backup status correctly with bundle.js', async ({ page }) => {
    // Click on Data tab
    await page.click('.tab-button[data-tab="data"]');
    
    // Verify auto-backup status is displayed (initial backup is created on app load)
    const statusElement = page.locator('#autoBackupStatus');
    await expect(statusElement).toBeVisible();
    
    // Wait for status to update from "Checking..." by waiting for it to not contain that text
    await expect(statusElement).not.toContainText('Checking...', { timeout: 5000 });
    
    // Verify status shows either "Last prepared:" or "No automatic backup prepared yet"
    const statusText = await statusElement.textContent();
    const hasLastPrepared = statusText.includes('Last prepared:');
    const hasNoPrepared = statusText.includes('No automatic backup prepared yet');
    expect(hasLastPrepared || hasNoPrepared).toBe(true);
    
    // If backup exists, button should be enabled
    if (hasLastPrepared) {
      const downloadBtn = page.locator('#downloadAutoBackupBtn');
      await expect(downloadBtn).toBeEnabled();
    }
  });

  test('should enable download button when backup exists with bundle.js', async ({ page }) => {
    await page.click('.tab-button[data-tab="data"]');
    
    // Wait for auto-backup status to update (not "Checking...")
    const statusElement = page.locator('#autoBackupStatus');
    await expect(statusElement).not.toContainText('Checking...', { timeout: 5000 });
    
    // Verify download button state matches status
    const downloadBtn = page.locator('#downloadAutoBackupBtn');
    const statusText = await statusElement.textContent();
    
    if (statusText.includes('Last prepared:')) {
      await expect(downloadBtn).toBeEnabled();
    }
  });

  test('should download auto-backup file with bundle.js', async ({ page }) => {
    await page.click('.tab-button[data-tab="data"]');
    
    // Wait for download button to be enabled (indicating backup exists)
    const downloadBtn = page.locator('#downloadAutoBackupBtn');
    await expect(downloadBtn).toBeEnabled({ timeout: 5000 });
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Handle the alert dialog
    page.on('dialog', dialog => dialog.accept());
    
    // Click download button
    await downloadBtn.click();
    
    const download = await downloadPromise;
    
    // Verify download occurred with correct filename
    expect(download.suggestedFilename()).toContain('resource-allocation-backup');
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('should create manual backup with bundle.js', async ({ page }) => {
    await page.click('.tab-button[data-tab="data"]');
    
    // Get initial backup count
    const initialCount = await page.locator('#backupsTable tbody tr').count();
    
    // Create a manual backup
    page.on('dialog', dialog => dialog.accept());
    await page.click('#createBackupBtn');
    
    // Wait for new backup to appear (count should increase by 1)
    await expect(page.locator('#backupsTable tbody tr')).toHaveCount(initialCount + 1, { timeout: 2000 });
  });

  test('should export data with bundle.js', async ({ page }) => {
    // Go to Data tab
    await page.click('.tab-button[data-tab="data"]');
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Handle alert dialog
    page.on('dialog', dialog => dialog.accept());
    
    await page.click('#exportDataBtn');
    const download = await downloadPromise;
    
    // Verify download occurred
    expect(download.suggestedFilename()).toContain('resource-allocation-backup');
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('should switch tabs with bundle.js', async ({ page }) => {
    // Initially people tab should be active
    await expect(page.locator('#people.tab-content.active')).toBeVisible();
    
    // Click Data tab
    await page.click('.tab-button[data-tab="data"]');
    await expect(page.locator('#data.tab-content.active')).toBeVisible();
    await expect(page.locator('#people.tab-content.active')).not.toBeVisible();
    
    // Click Projects tab
    await page.click('.tab-button[data-tab="projects"]');
    await expect(page.locator('#projects.tab-content.active')).toBeVisible();
    await expect(page.locator('#data.tab-content.active')).not.toBeVisible();
  });
});
