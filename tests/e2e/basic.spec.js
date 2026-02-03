import { test, expect } from '@playwright/test';

test.describe('Resource Allocation App - Basic E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('h1', { timeout: 5000 });
  });

  test('should load and display the application', async ({ page }) => {
    // Check title
    await expect(page.locator('h1')).toContainText('Resource Allocation App');
    
    // Check all tabs are visible
    await expect(page.locator('[data-tab="people"]')).toBeVisible();
    await expect(page.locator('[data-tab="projects"]')).toBeVisible();
    await expect(page.locator('[data-tab="allocations"]')).toBeVisible();
    await expect(page.locator('[data-tab="results"]')).toBeVisible();
    
    // Check that People tab is initially active
    await expect(page.locator('#people')).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    // Projects tab
    await page.click('[data-tab="projects"]');
    await expect(page.locator('#projects')).toBeVisible();
    
    // Allocations tab
    await page.click('[data-tab="allocations"]');
    await expect(page.locator('#allocations')).toBeVisible();
    
    // Results tab
    await page.click('[data-tab="results"]');
    await expect(page.locator('#results')).toBeVisible();
    
    // Back to People tab
    await page.click('[data-tab="people"]');
    await expect(page.locator('#people')).toBeVisible();
  });

  test('should have Add Person button', async ({ page }) => {
    await expect(page.locator('#addPersonBtn')).toBeVisible();
    await expect(page.locator('#addPersonBtn')).toHaveText('Add Person');
  });

  test('should have Add Project button on Projects tab', async ({ page }) => {
    await page.click('[data-tab="projects"]');
    await expect(page.locator('#addProjectBtn')).toBeVisible();
    await expect(page.locator('#addProjectBtn')).toHaveText('Add Project');
  });

  test('should have allocation form on Allocations tab', async ({ page }) => {
    await page.click('[data-tab="allocations"]');
    
    // Check form elements exist
    await expect(page.locator('#personSelect')).toBeVisible();
    await expect(page.locator('#projectSelect')).toBeVisible();
    await expect(page.locator('#pmInput')).toBeVisible();
    await expect(page.locator('#startMonthInput')).toBeVisible();
    await expect(page.locator('#endMonthInput')).toBeVisible();
    await expect(page.locator('#addAllocationBtn')).toBeVisible();
  });

  test('should have report controls on Results tab', async ({ page }) => {
    await page.click('[data-tab="results"]');
    
    // Monthly report controls
    await expect(page.locator('#monthInput')).toBeVisible();
    await expect(page.locator('#calculateBtn')).toBeVisible();
    
    // Yearly report controls
    await expect(page.locator('#yearInput')).toBeVisible();
    await expect(page.locator('#calculateYearBtn')).toBeVisible();
    
    // Timeline controls
    await expect(page.locator('#timelineYearInput')).toBeVisible();
    await expect(page.locator('#showTimelineBtn')).toBeVisible();
  });
});
