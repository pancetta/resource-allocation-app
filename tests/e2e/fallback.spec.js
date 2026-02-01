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
    
    // Wait a bit for the initial backup to be created
    await page.waitForTimeout(1000);
    
    // Status should not be "Checking..." - it should be updated
    const statusText = await statusElement.textContent();
    expect(statusText).not.toContain('Checking...');
    
    // Should contain either "Last prepared:" or "No automatic backup prepared yet"
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
    
    // Wait for initial backup to be created
    await page.waitForTimeout(1000);
    
    // Verify download button is enabled
    const downloadBtn = page.locator('#downloadAutoBackupBtn');
    const statusElement = page.locator('#autoBackupStatus');
    const statusText = await statusElement.textContent();
    
    if (statusText.includes('Last prepared:')) {
      await expect(downloadBtn).toBeEnabled();
    }
  });

  test('should download auto-backup file with bundle.js', async ({ page }) => {
    await page.click('.tab-button[data-tab="data"]');
    
    // Wait for initial backup
    await page.waitForTimeout(1000);
    
    // Check if button is enabled
    const downloadBtn = page.locator('#downloadAutoBackupBtn');
    const isEnabled = await downloadBtn.isEnabled();
    
    if (isEnabled) {
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
    }
  });

  test('should create manual backup with bundle.js', async ({ page }) => {
    await page.click('.tab-button[data-tab="data"]');
    
    // Create a manual backup
    page.on('dialog', dialog => dialog.accept());
    await page.click('#createBackupBtn');
    
    // Wait for backup to be created
    await page.waitForTimeout(500);
    
    // Verify backup appears in the table
    const backupRows = await page.locator('#backupsTable tbody tr').count();
    expect(backupRows).toBeGreaterThan(0);
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
