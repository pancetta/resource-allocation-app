import { test, expect } from '@playwright/test';

test.describe('Timeline Button Edge Cases', () => {
  test('should work on first click after page load', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Navigate to Results tab
    await page.click('[data-tab="results"]');
    await expect(page.locator('#results')).toBeVisible();
    
    const timelineOutput = page.locator('#timelineOutput');
    
    // Check initial state - display style should be empty string, not 'none'
    const initialDisplay = await timelineOutput.evaluate(el => el.style.display);
    const initialInnerHTML = await timelineOutput.innerHTML();
    
    console.log('Initial display style:', JSON.stringify(initialDisplay));
    console.log('Initial innerHTML:', JSON.stringify(initialInnerHTML));
    console.log('Initial innerHTML length:', initialInnerHTML.length);
    console.log('Initial innerHTML trimmed length:', initialInnerHTML.trim().length);
    
    // First click - should show timeline
    await page.click('#showTimelineBtn');
    await page.waitForTimeout(500);
    
    const afterFirstClick = await timelineOutput.evaluate(el => el.style.display);
    const contentAfterFirstClick = await timelineOutput.innerHTML();
    
    console.log('After first click display:', JSON.stringify(afterFirstClick));
    console.log('After first click content length:', contentAfterFirstClick.length);
    
    // Should be visible now
    expect(afterFirstClick).not.toBe('none');
    expect(contentAfterFirstClick.trim().length).toBeGreaterThan(0);
  });

  test('should hide timeline on second click', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 5000 });
    
    await page.click('[data-tab="results"]');
    await expect(page.locator('#results')).toBeVisible();
    
    const timelineOutput = page.locator('#timelineOutput');
    
    // First click - show
    await page.click('#showTimelineBtn');
    await page.waitForTimeout(500);
    
    const afterFirstClick = await timelineOutput.evaluate(el => el.style.display);
    console.log('After first click:', afterFirstClick);
    expect(afterFirstClick).toBe('block');
    
    // Second click - hide
    await page.click('#showTimelineBtn');
    await page.waitForTimeout(500);
    
    const afterSecondClick = await timelineOutput.evaluate(el => el.style.display);
    console.log('After second click:', afterSecondClick);
    expect(afterSecondClick).toBe('none');
  });

  test('should show timeline again on third click', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 5000 });
    
    await page.click('[data-tab="results"]');
    await expect(page.locator('#results')).toBeVisible();
    
    // Click 1: show
    await page.click('#showTimelineBtn');
    await page.waitForTimeout(500);
    
    // Click 2: hide
    await page.click('#showTimelineBtn');
    await page.waitForTimeout(500);
    
    // Click 3: show again
    await page.click('#showTimelineBtn');
    await page.waitForTimeout(500);
    
    const timelineOutput = page.locator('#timelineOutput');
    const finalDisplay = await timelineOutput.evaluate(el => el.style.display);
    
    console.log('After third click:', finalDisplay);
    expect(finalDisplay).toBe('block');
  });
});
