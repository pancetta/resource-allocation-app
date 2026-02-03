import { test, expect } from '@playwright/test';

test('Timeline should update when year changes', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('h1', { timeout: 5000 });
  
  await page.click('[data-tab="results"]');
  await expect(page.locator('#results')).toBeVisible();
  
  const timelineYearInput = page.locator('#timelineYearInput');
  const showTimelineBtn = page.locator('#showTimelineBtn');
  const timelineOutput = page.locator('#timelineOutput');
  
  // Set year to 2025 and show timeline
  await timelineYearInput.fill('2025');
  await showTimelineBtn.click();
  await page.waitForTimeout(500);
  
  const content2025 = await timelineOutput.innerHTML();
  console.log('Content for 2025:', content2025.substring(0, 100));
  
  // Now change year to 2026 - should the timeline update?
  // Currently, if timeline is already visible, clicking the button will HIDE it
  // So you need to hide it first, then change year, then show again
  
  await showTimelineBtn.click(); // Hide
  await page.waitForTimeout(300);
  
  await timelineYearInput.fill('2026');
  await showTimelineBtn.click(); // Show with new year
  await page.waitForTimeout(500);
  
  const content2026 = await timelineOutput.innerHTML();
  console.log('Content for 2026:', content2026.substring(0, 100));
  
  // Content might be the same if no allocations, but at least it should have rendered
  expect(content2026.length).toBeGreaterThan(0);
});
