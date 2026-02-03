import { test } from '@playwright/test';

test('Visual test of timeline button', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('h1', { timeout: 5000 });
  
  // Navigate to Results tab
  await page.click('[data-tab="results"]');
  await page.waitForSelector('#results', { state: 'visible' });
  
  // Wait for page to settle
  await page.waitForTimeout(500);
  
  // Take screenshot before clicking
  await page.screenshot({ path: '/tmp/timeline-before-click.png', fullPage: true });
  console.log('Screenshot saved: /tmp/timeline-before-click.png');
  
  // Fill in the year input
  await page.fill('#timelineYearInput', '2025');
  
  // Click the timeline button
  await page.click('#showTimelineBtn');
  
  // Wait for rendering
  await page.waitForTimeout(1000);
  
  // Take screenshot after clicking
  await page.screenshot({ path: '/tmp/timeline-after-click.png', fullPage: true });
  console.log('Screenshot saved: /tmp/timeline-after-click.png');
  
  // Click again to toggle
  await page.click('#showTimelineBtn');
  await page.waitForTimeout(500);
  
  // Take screenshot after second click (hidden)
  await page.screenshot({ path: '/tmp/timeline-after-second-click.png', fullPage: true });
  console.log('Screenshot saved: /tmp/timeline-after-second-click.png');
});
