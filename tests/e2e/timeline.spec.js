import { test, expect } from '@playwright/test';

test.describe('Timeline Button Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Navigate to Results tab
    await page.click('[data-tab="results"]');
    await expect(page.locator('#results')).toBeVisible();
  });

  test('should toggle timeline visibility when clicking Show/Hide Timeline button', async ({ page }) => {
    const timelineOutput = page.locator('#timelineOutput');
    const showTimelineBtn = page.locator('#showTimelineBtn');
    
    // Verify button exists
    await expect(showTimelineBtn).toBeVisible();
    await expect(showTimelineBtn).toHaveText('Show/Hide Timeline');
    
    // Click to show timeline
    await showTimelineBtn.click();
    await page.waitForTimeout(500);
    
    // Timeline should now be visible
    const displayAfterShow = await timelineOutput.evaluate(el => el.style.display);
    const contentAfterShow = await timelineOutput.innerHTML();
    
    expect(displayAfterShow).toBe('block');
    expect(contentAfterShow.trim().length).toBeGreaterThan(0);
    
    // Click again to hide timeline
    await showTimelineBtn.click();
    await page.waitForTimeout(500);
    
    // Timeline should now be hidden
    const displayAfterHide = await timelineOutput.evaluate(el => el.style.display);
    expect(displayAfterHide).toBe('none');
    
    // Click again to show timeline
    await showTimelineBtn.click();
    await page.waitForTimeout(500);
    
    // Timeline should be visible again
    const displayAfterSecondShow = await timelineOutput.evaluate(el => el.style.display);
    expect(displayAfterSecondShow).toBe('block');
  });

  test('should show timeline with year from input', async ({ page }) => {
    const timelineYearInput = page.locator('#timelineYearInput');
    const showTimelineBtn = page.locator('#showTimelineBtn');
    const timelineOutput = page.locator('#timelineOutput');
    
    // Year input should have a default value set by smartDefaults
    const defaultYear = await timelineYearInput.inputValue();
    expect(defaultYear).toBeTruthy();
    
    // Set a specific year
    await timelineYearInput.fill('2025');
    
    // Click to show timeline
    await showTimelineBtn.click();
    await page.waitForTimeout(500);
    
    // Timeline should render (either with allocations or "no allocations" message)
    const content = await timelineOutput.innerHTML();
    const display = await timelineOutput.evaluate(el => el.style.display);
    
    expect(display).toBe('block');
    expect(content.trim().length).toBeGreaterThan(0);
  });
});
