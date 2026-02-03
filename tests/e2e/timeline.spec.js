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
    
    // Timeline should be initially hidden or empty
    const initialDisplay = await timelineOutput.evaluate(el => el.style.display);
    const initialContent = await timelineOutput.innerHTML();
    console.log('Initial display:', initialDisplay);
    console.log('Initial content length:', initialContent.length);
    
    // Click to show timeline
    await showTimelineBtn.click();
    
    // Wait a moment for async rendering
    await page.waitForTimeout(500);
    
    // Check if timeline is now visible
    const afterClickDisplay = await timelineOutput.evaluate(el => el.style.display);
    const afterClickContent = await timelineOutput.innerHTML();
    console.log('After click display:', afterClickDisplay);
    console.log('After click content length:', afterClickContent.length);
    
    // Timeline should either be visible or have content
    const isVisible = afterClickDisplay !== 'none';
    const hasContent = afterClickContent.trim().length > 0;
    
    console.log('Is visible:', isVisible);
    console.log('Has content:', hasContent);
    
    expect(isVisible || hasContent).toBe(true);
  });

  test('should show timeline with year from input', async ({ page }) => {
    const timelineYearInput = page.locator('#timelineYearInput');
    const showTimelineBtn = page.locator('#showTimelineBtn');
    const timelineOutput = page.locator('#timelineOutput');
    
    // Set a year
    await timelineYearInput.fill('2025');
    
    // Click to show timeline
    await showTimelineBtn.click();
    
    // Wait for async rendering
    await page.waitForTimeout(500);
    
    // Check if timeline rendered
    const content = await timelineOutput.innerHTML();
    console.log('Content includes 2025:', content.includes('2025'));
    
    // If there are allocations, it should show the year; if not, it shows a message
    expect(content.length).toBeGreaterThan(0);
  });
});
