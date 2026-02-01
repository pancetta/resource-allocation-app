import { test, expect } from '@playwright/test';

test.describe('People Type Field', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to initialize
    await page.waitForSelector('.tab-button', { timeout: 5000 });
    
    // Clear IndexedDB before each test
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const req = indexedDB.deleteDatabase('resource-planning');
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    });
    
    // Reload page to reinitialize with clean database
    await page.reload();
    await page.waitForSelector('.tab-button', { timeout: 5000 });
    
    // Navigate to People tab
    await page.click('[data-tab="people"]');
    await page.waitForSelector('#peopleTable');
  });

  test('should display type dropdown in people table', async ({ page }) => {
    // Add a person
    page.once('dialog', async dialog => {
      await dialog.accept('Test Person');
    });
    await page.click('#addPersonBtn');
    
    // Wait for the person to be added and table to update
    await page.waitForSelector('#peopleTable tbody tr', { timeout: 10000 });
    
    // Check if the table has the Type column header
    const headers = await page.$$eval('#peopleTable thead th', ths => ths.map(th => th.textContent));
    expect(headers).toContain('Type');
    
    // Check if there's a select dropdown in the table
    const typeSelect = await page.$('#peopleTable select[data-field="type"]');
    expect(typeSelect).not.toBeNull();
    
    // Verify the dropdown has the correct options
    const options = await page.$$eval('#peopleTable select[data-field="type"] option', opts => 
      opts.map(opt => opt.value)
    );
    expect(options).toEqual(['210', '220', '230', '240', '250']);
  });

  test('should have default type value of 210', async ({ page }) => {
    // Add a person
    page.once('dialog', async dialog => {
      await dialog.accept('John Doe');
    });
    await page.click('#addPersonBtn');
    
    // Wait for the person to appear
    await page.waitForSelector('#peopleTable tbody tr', { timeout: 10000 });
    
    // Verify initial value is '210' (default)
    const selectedValue = await page.$eval('#peopleTable select[data-field="type"]', sel => sel.value);
    expect(selectedValue).toBe('210');
  });

  test('should allow changing person type via dropdown', async ({ page }) => {
    // Add a person first
    page.once('dialog', async dialog => {
      await dialog.accept('Jane Smith');
    });
    await page.click('#addPersonBtn');
    
    // Wait for the person to appear
    await page.waitForSelector('#peopleTable tbody tr', { timeout: 10000 });
    
    // Change to '230'
    await page.selectOption('#peopleTable select[data-field="type"]', '230');
    
    // Wait a bit for the change to be saved
    await page.waitForTimeout(500);
    
    // Verify the value changed
    const selectedValue = await page.$eval('#peopleTable select[data-field="type"]', sel => sel.value);
    expect(selectedValue).toBe('230');
  });

  test('should persist type value after page reload', async ({ page }) => {
    // Add a person
    page.once('dialog', async dialog => {
      await dialog.accept('Persistent User');
    });
    await page.click('#addPersonBtn');
    
    // Wait for person to be added
    await page.waitForSelector('#peopleTable tbody tr', { timeout: 10000 });
    
    // Change type to '240'
    await page.selectOption('#peopleTable select[data-field="type"]', '240');
    await page.waitForTimeout(500);
    
    // Reload the page
    await page.reload();
    await page.waitForSelector('.tab-button', { timeout: 5000 });
    await page.click('[data-tab="people"]');
    await page.waitForSelector('#peopleTable tbody tr', { timeout: 10000 });
    
    // Verify the type is still '240'
    const selectedValue = await page.$eval('#peopleTable select[data-field="type"]', sel => sel.value);
    expect(selectedValue).toBe('240');
  });

  test('should show all type options in dropdown', async ({ page }) => {
    // Add a person
    page.once('dialog', async dialog => {
      await dialog.accept('Options Test');
    });
    await page.click('#addPersonBtn');
    
    await page.waitForSelector('#peopleTable select[data-field="type"]', { timeout: 10000 });
    
    // Get all option labels
    const optionLabels = await page.$$eval('#peopleTable select[data-field="type"] option', opts => 
      opts.map(opt => opt.textContent)
    );
    
    expect(optionLabels).toEqual(['210', '220', '230', '240', '250']);
  });
});
