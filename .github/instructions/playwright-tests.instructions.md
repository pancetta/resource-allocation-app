---
applyTo: "**/tests/e2e/*.spec.js"
---

# Playwright E2E Test Guidelines

When writing or modifying Playwright end-to-end tests for this application, follow these guidelines:

## Test Structure

1. **Use stable locators** - Prefer semantic selectors:
   - `page.locator('#element-id')` for IDs
   - `page.locator('button:has-text("Add Person")')` for text-based selection
   - `page.locator('table tbody tr')` for table rows
   - Avoid fragile CSS selectors when possible

2. **Write isolated tests** - Each test should:
   - Be independent and not rely on other tests' state
   - Clean up after itself (IndexedDB is reset between tests automatically)
   - Not assume specific order of execution

3. **Follow naming conventions**:
   - Use descriptive test names that explain what is being tested
   - Use `*.spec.js` file naming convention
   - Group related tests with `test.describe()`

## Application-Specific Patterns

1. **Tab Navigation**:
   - Always wait for tab to be visible after clicking: `await page.locator('#people-tab').click();`
   - Verify tab content is visible before interacting

2. **Table Interactions**:
   - Wait for tables to populate: `await page.waitForSelector('table tbody tr')`
   - Use data attributes when available: `data-id`, `data-field`
   - Handle contenteditable cells for inline editing

3. **IndexedDB Operations**:
   - Remember this is a client-side app using IndexedDB
   - Data persists in the browser during a test session
   - Each test gets a fresh database (cleaned automatically)

4. **Dynamic Content**:
   - Wait for data to load after database operations
   - Use `waitForSelector` for elements that appear after async operations
   - Check for both presence and visibility of elements

## Assertions

1. **Use specific matchers**:
   - `await expect(element).toBeVisible()` for visibility checks
   - `await expect(element).toHaveText(text)` for text content
   - `await expect(element).toHaveClass(className)` for CSS classes
   - `await expect(element).toHaveCount(n)` for counting elements

2. **Application-specific validations**:
   - Verify CSS classes for data validation: `.correct` (green) and `.warning` (red)
   - Check table row counts after add/delete operations
   - Validate calculated values in report tables

## Test Data

1. **Use realistic test data**:
   - Person IDs: `p001`, `p002`, etc.
   - Project IDs: `proj001`, `proj002`, etc.
   - FTE values: 0.0 to 1.0
   - Allocation percentages: 0 to 100

2. **Setup and cleanup**:
   - Use test hooks sparingly (Playwright's auto-cleanup is usually sufficient)
   - Create minimal test data needed for each test
   - Verify data state after operations

## CI/CD Integration

1. **Headless mode**: Tests run in headless mode in CI (already configured)
2. **Screenshots on failure**: Automatically captured (already configured)
3. **Single browser**: Only Chromium is used in CI for speed (already configured)
4. **Fast execution**: Keep tests focused and fast

## Common Patterns in This App

```javascript
// Navigate to a tab
await page.locator('#people-tab').click();
await expect(page.locator('#people')).toBeVisible();

// Add a person
await page.locator('#add-person-btn').click();
await page.locator('table tbody tr td[data-field="name"]').last().fill('John Doe');
await page.locator('table tbody tr td[data-field="fte"]').last().fill('1.0');

// Verify table row count
const rows = await page.locator('table tbody tr').count();
await expect(rows).toBe(expectedCount);

// Check validation classes
await expect(page.locator('.correct')).toBeVisible();
await expect(page.locator('.warning')).toBeVisible();
```

## Performance Considerations

- Keep tests focused on user workflows, not implementation details
- Avoid testing the same functionality multiple times
- Use `page.locator()` instead of `page.$()` for better auto-waiting
- Leverage Playwright's built-in waiting - avoid manual `setTimeout()`
