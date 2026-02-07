/**
 * E2E test for yearly report base funding deductions
 * Verifies that base funding deductions appear correctly in yearly report
 */

import { test, expect } from '@playwright/test';

test.describe('Yearly Report - Base Funding Deductions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to initialize
    await page.waitForSelector('[data-tab="people"]');
  });

  test('should display base funding summary in yearly report', async ({ page }) => {
    // Navigate to People tab and add a person
    await page.click('[data-tab="people"]');
    await page.waitForSelector('#peopleTable');
    
    // Add a person of type 210
    await page.click('#addPersonBtn');
    await page.waitForSelector('.quick-add-row');
    
    const nameInput = page.locator('.quick-add-input').first();
    await nameInput.fill('Alice');
    
    // Find the type dropdown in the quick-add row and select 210
    const typeSelect = page.locator('.quick-add-row select[data-field="type"]');
    await typeSelect.selectOption('210');
    
    await page.click('.quick-add-save');
    await page.waitForSelector('.quick-add-row', { state: 'detached' });
    
    // Navigate to Projects tab
    await page.click('[data-tab="projects"]');
    await page.waitForSelector('#projectsTable');
    
    // Add a base funding project for type 210
    await page.click('#addBaseFundingBtn');
    await page.waitForSelector('#baseFundingModal');
    
    // Fill base funding modal
    await page.fill('#baseFundingName', 'Base Funding 210');
    await page.selectOption('#baseFundingType', '210');
    await page.fill('#baseFundingPlannedPM', '10');
    
    await page.click('#saveBaseFundingBtn');
    await page.waitForSelector('#baseFundingModal', { state: 'hidden' });
    
    // Add a matching funds project
    await page.click('#addProjectBtn');
    await page.waitForSelector('.quick-add-row');
    
    const projectNameInput = page.locator('.quick-add-input').first();
    await projectNameInput.fill('Project with Matching Funds');
    
    await page.click('.quick-add-save');
    await page.waitForSelector('.quick-add-row', { state: 'detached' });
    
    // Wait for project to appear and enable matching funds
    await page.waitForTimeout(500); // Give time for re-render
    
    // Get all matching funds checkboxes
    const checkboxes = page.locator('input[type="checkbox"][data-field="deductsFromBaseFunding"]');
    const count = await checkboxes.count();
    
    // The last checkbox should be for our newly added project
    const checkbox = checkboxes.nth(count - 1);
    await checkbox.check();
    
    // Wait for checkbox to be persisted
    await page.waitForTimeout(500);
    
    // Navigate to Allocations tab
    await page.click('[data-tab="allocations"]');
    await page.waitForSelector('#allocationsTable');
    
    // Add an allocation
    await page.click('#addAllocationBtn');
    await page.waitForSelector('.quick-add-row');
    
    // Select person (Alice)
    const personSelect = page.locator('.quick-add-row select[data-field="personId"]');
    await personSelect.selectOption({ label: /Alice/ });
    
    // Select project (Project with Matching Funds)
    const projectSelect = page.locator('.quick-add-row select[data-field="projectId"]');
    await projectSelect.selectOption({ label: /Project with Matching Funds/ });
    
    // Enter PM value
    const pmInput = page.locator('.quick-add-row input[data-field="pm"]');
    await pmInput.fill('0.5');
    
    // Enter date range
    const startMonthInput = page.locator('.quick-add-row input[data-field="startMonth"]');
    await startMonthInput.fill('2024-01');
    
    const endMonthInput = page.locator('.quick-add-row input[data-field="endMonth"]');
    await endMonthInput.fill('2024-12');
    
    await page.click('.quick-add-save');
    await page.waitForSelector('.quick-add-row', { state: 'detached' });
    
    // Navigate to Yearly Report tab
    await page.click('[data-tab="yearly-report"]');
    await page.waitForSelector('#yearInput');
    
    // Enter year and calculate
    await page.fill('#yearInput', '2024');
    await page.click('#calculateYearBtn');
    
    // Wait for report to be generated
    await page.waitForSelector('#resultsOutput h3');
    
    // Verify base funding summary section exists
    const resultsOutput = page.locator('#resultsOutput');
    await expect(resultsOutput).toContainText('Base Funding Summary');
    
    // Verify base funding table exists
    const baseFundingTable = page.locator('.base-funding-table');
    await expect(baseFundingTable).toBeVisible();
    
    // Verify table contains base funding project
    await expect(baseFundingTable).toContainText('Base Funding 210');
    
    // Verify table shows planned, deductions, and net columns
    await expect(baseFundingTable).toContainText('Planned PM');
    await expect(baseFundingTable).toContainText('Deductions');
    await expect(baseFundingTable).toContainText('Net Available');
    
    // Verify the calculations
    // Planned: 10 PM/month * 12 months = 120.00 PM/year
    await expect(baseFundingTable).toContainText('120.00');
    
    // Deductions: 0.5 PM/month * 12 months = 6.00 PM/year
    await expect(baseFundingTable).toContainText('6.00');
    
    // Net: 120.00 - 6.00 = 114.00 PM/year
    await expect(baseFundingTable).toContainText('114.00');
    
    // Verify status is OK (positive net)
    await expect(baseFundingTable).toContainText('✓ OK');
  });

  test('should display base funding summary in project overview report', async ({ page }) => {
    // Navigate to People tab and add a person
    await page.click('[data-tab="people"]');
    await page.waitForSelector('#peopleTable');
    
    // Add a person of type 210
    await page.click('#addPersonBtn');
    await page.waitForSelector('.quick-add-row');
    
    const nameInput = page.locator('.quick-add-input').first();
    await nameInput.fill('Bob');
    
    const typeSelect = page.locator('.quick-add-row select[data-field="type"]');
    await typeSelect.selectOption('210');
    
    await page.click('.quick-add-save');
    await page.waitForSelector('.quick-add-row', { state: 'detached' });
    
    // Navigate to Projects tab
    await page.click('[data-tab="projects"]');
    await page.waitForSelector('#projectsTable');
    
    // Add a base funding project
    await page.click('#addBaseFundingBtn');
    await page.waitForSelector('#baseFundingModal');
    
    await page.fill('#baseFundingName', 'Base Funding 210');
    await page.selectOption('#baseFundingType', '210');
    await page.fill('#baseFundingPlannedPM', '8');
    
    await page.click('#saveBaseFundingBtn');
    await page.waitForSelector('#baseFundingModal', { state: 'hidden' });
    
    // Add a matching funds project
    await page.click('#addProjectBtn');
    await page.waitForSelector('.quick-add-row');
    
    const projectNameInput = page.locator('.quick-add-input').first();
    await projectNameInput.fill('Matching Project');
    
    await page.click('.quick-add-save');
    await page.waitForSelector('.quick-add-row', { state: 'detached' });
    
    await page.waitForTimeout(500);
    
    const checkboxes = page.locator('input[type="checkbox"][data-field="deductsFromBaseFunding"]');
    const count = await checkboxes.count();
    const checkbox = checkboxes.nth(count - 1);
    await checkbox.check();
    
    await page.waitForTimeout(500);
    
    // Navigate to Allocations tab
    await page.click('[data-tab="allocations"]');
    await page.waitForSelector('#allocationsTable');
    
    // Add an allocation
    await page.click('#addAllocationBtn');
    await page.waitForSelector('.quick-add-row');
    
    const personSelect = page.locator('.quick-add-row select[data-field="personId"]');
    await personSelect.selectOption({ label: /Bob/ });
    
    const projectSelect = page.locator('.quick-add-row select[data-field="projectId"]');
    await projectSelect.selectOption({ label: /Matching Project/ });
    
    const pmInput = page.locator('.quick-add-row input[data-field="pm"]');
    await pmInput.fill('0.3');
    
    const startMonthInput = page.locator('.quick-add-row input[data-field="startMonth"]');
    await startMonthInput.fill('2024-01');
    
    const endMonthInput = page.locator('.quick-add-row input[data-field="endMonth"]');
    await endMonthInput.fill('2024-12');
    
    await page.click('.quick-add-save');
    await page.waitForSelector('.quick-add-row', { state: 'detached' });
    
    // Navigate to Project Overview tab
    await page.click('[data-tab="project-overview"]');
    await page.waitForSelector('#overviewYearInput');
    
    // Enter year and calculate
    await page.fill('#overviewYearInput', '2024');
    await page.click('#projectMonthlyBtn');
    
    // Wait for report to be generated
    await page.waitForSelector('#resultsOutput h3');
    
    // Verify base funding summary section exists
    const resultsOutput = page.locator('#resultsOutput');
    await expect(resultsOutput).toContainText('Base Funding Summary');
    
    // Verify base funding table exists
    const baseFundingTable = page.locator('.base-funding-table');
    await expect(baseFundingTable).toBeVisible();
    
    // Verify calculations
    // Planned: 8 PM/month * 12 months = 96.00 PM/year
    await expect(baseFundingTable).toContainText('96.00');
    
    // Deductions: 0.3 PM/month * 12 months = 3.60 PM/year
    await expect(baseFundingTable).toContainText('3.60');
    
    // Net: 96.00 - 3.60 = 92.40 PM/year
    await expect(baseFundingTable).toContainText('92.40');
  });
});
