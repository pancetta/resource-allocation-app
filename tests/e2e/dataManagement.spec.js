import { test, expect } from '@playwright/test';

test.describe('Data Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to initialize
    await page.waitForSelector('.tab-button[data-tab="data"]');
  });

  test('should show Data tab', async ({ page }) => {
    // Click on Data tab
    await page.click('.tab-button[data-tab="data"]');
    
    // Verify Data tab content is visible
    await expect(page.locator('#data')).toBeVisible();
    await expect(page.locator('h2:has-text("Data Management")')).toBeVisible();
  });

  test('should have export and import buttons', async ({ page }) => {
    await page.click('.tab-button[data-tab="data"]');
    
    await expect(page.locator('#exportDataBtn')).toBeVisible();
    await expect(page.locator('#importDataBtn')).toBeVisible();
    await expect(page.locator('#createBackupBtn')).toBeVisible();
  });

  test('should export data', async ({ page }) => {
    // Add some test data first by handling the prompt dialog
    await page.click('.tab-button[data-tab="people"]');
    
    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      await dialog.accept('Test Person');
    });
    await page.click('#addPersonBtn');
    await page.waitForTimeout(500);

    // Go to Data tab
    await page.click('.tab-button[data-tab="data"]');
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    await page.click('#exportDataBtn');
    const download = await downloadPromise;
    
    // Verify download occurred
    expect(download.suggestedFilename()).toContain('resource-allocation-backup');
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('should create manual backup', async ({ page }) => {
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

  test('should display backups in table', async ({ page }) => {
    await page.click('.tab-button[data-tab="data"]');
    
    // Backups table should exist and have headers
    await expect(page.locator('#backupsTable')).toBeVisible();
    await expect(page.locator('#backupsTable thead th:has-text("Backup Date")')).toBeVisible();
    await expect(page.locator('#backupsTable thead th:has-text("Data Date")')).toBeVisible();
    await expect(page.locator('#backupsTable thead th:has-text("Actions")')).toBeVisible();
  });

  test.skip('should restore from backup', async ({ page }) => {
    // Note: This test is skipped because page reload after restore is inconsistent in E2E tests
    // The restore functionality is tested in unit tests instead
    
    // Add a person by handling the prompt dialog
    await page.click('.tab-button[data-tab="people"]');
    
    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      await dialog.accept('Original Person');
    });
    await page.click('#addPersonBtn');
    await page.waitForTimeout(1000);

    // Verify person was added
    let peopleCount = await page.locator('#peopleTable tbody tr').count();
    expect(peopleCount).toBe(1);

    // Create a backup
    await page.click('.tab-button[data-tab="data"]');
    
    // Handle both alert and confirm dialogs
    page.on('dialog', dialog => dialog.accept());
    
    await page.click('#createBackupBtn');
    await page.waitForTimeout(1000);

    // Verify backup was created
    const backupCount = await page.locator('#backupsTable tbody tr').count();
    expect(backupCount).toBeGreaterThan(0);

    // Delete the person
    await page.click('.tab-button[data-tab="people"]');
    await page.click('.delete-person');
    await page.waitForTimeout(1000);

    // Verify person is gone
    peopleCount = await page.locator('#peopleTable tbody tr').count();
    expect(peopleCount).toBe(0);

    // Restore from backup - the page will reload
    await page.click('.tab-button[data-tab="data"]');
    const restoreButtons = page.locator('#backupsTable tbody tr button:has-text("Restore")');
    
    // Wait for reload to complete
    await Promise.all([
      page.waitForLoadState('networkidle'),
      restoreButtons.first().click()
    ]);
    
    // Wait a bit more for app initialization
    await page.waitForTimeout(2000);
    
    // The page should be on the People tab or we need to click it
    const peopleTabVisible = await page.locator('#people.tab-content.active').isVisible().catch(() => false);
    if (!peopleTabVisible) {
      await page.click('.tab-button[data-tab="people"]');
      await page.waitForTimeout(500);
    }

    // Verify person is restored
    peopleCount = await page.locator('#peopleTable tbody tr').count();
    expect(peopleCount).toBe(1);
  });

  test('should delete backup', async ({ page }) => {
    await page.click('.tab-button[data-tab="data"]');
    
    // Create a backup
    page.on('dialog', dialog => dialog.accept());
    await page.click('#createBackupBtn');
    await page.waitForTimeout(500);

    const backupCountBefore = await page.locator('#backupsTable tbody tr').count();

    // Delete the first backup
    const deleteButtons = page.locator('#backupsTable tbody tr button:has-text("Delete")');
    await deleteButtons.first().click();
    await page.waitForTimeout(500);

    const backupCountAfter = await page.locator('#backupsTable tbody tr').count();
    expect(backupCountAfter).toBe(backupCountBefore - 1);
  });

  test.skip('should show automatic backup on data change', async ({ page }) => {
    // Note: This test is skipped because auto-backup timing is inconsistent in E2E tests
    // The auto-backup feature is tested in unit tests instead
    
    // Go to data tab to count initial backups
    await page.click('.tab-button[data-tab="data"]');
    await page.waitForTimeout(500);
    
    const backupCountBefore = await page.locator('#backupsTable tbody tr').count();

    // Add a person (should trigger auto-backup after 5 seconds)
    await page.click('.tab-button[data-tab="people"]');
    
    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      await dialog.accept('Auto Backup Test');
    });
    await page.click('#addPersonBtn');
    await page.waitForTimeout(1000);
    
    // Wait for auto-backup (5 seconds debounce + 2 second buffer)
    await page.waitForTimeout(7000);

    // Check if new backup was created
    await page.click('.tab-button[data-tab="data"]');
    await page.waitForTimeout(500);
    
    const backupCountAfter = await page.locator('#backupsTable tbody tr').count();
    
    // Should have at least one more backup (might have 2 - initial + auto)
    expect(backupCountAfter).toBeGreaterThanOrEqual(backupCountBefore + 1);
  });
});
