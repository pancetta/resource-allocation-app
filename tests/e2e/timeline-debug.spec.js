import { test, expect } from '@playwright/test';

test('Check timeline button behavior in detail', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('h1', { timeout: 5000 });
  
  // Navigate to Results tab
  await page.click('[data-tab="results"]');
  await expect(page.locator('#results')).toBeVisible();
  
  const timelineOutput = page.locator('#timelineOutput');
  const showTimelineBtn = page.locator('#showTimelineBtn');
  const timelineYearInput = page.locator('#timelineYearInput');
  
  console.log('\n=== BEFORE CLICK ===');
  console.log('Button text:', await showTimelineBtn.textContent());
  console.log('Button visible:', await showTimelineBtn.isVisible());
  console.log('Output display:', await timelineOutput.evaluate(el => el.style.display));
  console.log('Output innerHTML:', await timelineOutput.innerHTML());
  console.log('Year input value:', await timelineYearInput.inputValue());
  
  // Click button
  await showTimelineBtn.click();
  await page.waitForTimeout(1000);
  
  console.log('\n=== AFTER FIRST CLICK ===');
  console.log('Output display:', await timelineOutput.evaluate(el => el.style.display));
  console.log('Output innerHTML:', await timelineOutput.innerHTML());
  
  // Click button again to toggle
  await showTimelineBtn.click();
  await page.waitForTimeout(500);
  
  console.log('\n=== AFTER SECOND CLICK ===');
  console.log('Output display:', await timelineOutput.evaluate(el => el.style.display));
  console.log('Output innerHTML:', await timelineOutput.innerHTML());
  
  // Set year and try again
  await timelineYearInput.fill('2025');
  await showTimelineBtn.click();
  await page.waitForTimeout(500);
  
  console.log('\n=== AFTER THIRD CLICK (with year 2025) ===');
  console.log('Output display:', await timelineOutput.evaluate(el => el.style.display));
  console.log('Output innerHTML:', await timelineOutput.innerHTML());
});
