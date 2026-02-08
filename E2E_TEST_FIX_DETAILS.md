# E2E Test Fix Summary

## Problem
The allocation-validation.spec.js E2E tests were all failing with timeout errors because they used incorrect selectors that didn't match the actual HTML structure of the application.

## Test Results

### Before Fix
```
Running 49 tests using 1 worker
××F××F××F××F××F××F·························°·°···············

6 failed tests in allocation-validation.spec.js:
  ❌ should show warning when person would be overallocated
  ❌ should show warning when project would be overallocated
  ❌ should allow user to proceed with overallocation if confirmed
  ❌ should validate allocation updates
  ❌ should show specific conflict details in warning message
  ❌ should handle multiple months with varying FTE values

Error: TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log: waiting for locator('#people-tab') to be visible
```

### After Fix
```
Running 49 tests using 1 worker
·······························°·°···············

✅ 47 passed
⊘ 2 skipped
Duration: 49.6s
```

## Root Causes and Solutions

### 1. Incorrect Tab Selectors

**Problem:**
```javascript
await page.waitForSelector('#people-tab');
await page.click('#people-tab');
await page.click('#projects-tab');
await page.click('#allocations-tab');
```

**Actual HTML:**
```html
<button class="tab-button" data-tab="people">People</button>
<button class="tab-button" data-tab="projects">Projects</button>
<button class="tab-button" data-tab="allocations">Allocations</button>
```

**Solution:**
```javascript
await page.waitForSelector('[data-tab="people"]');
await page.click('[data-tab="people"]');
await page.click('[data-tab="projects"]');
await page.click('[data-tab="allocations"]');
```

### 2. Non-existent Sub-Tabs

**Problem:**
```javascript
await page.click('#fteValuesTab');
await page.click('#budgetValuesTab');
```

**Reality:** These IDs don't exist. FTE values and budget values are sections within the People and Projects tabs respectively, not separate clickable tabs.

**Solution:**
```javascript
// Remove these clicks entirely
// The sections are already visible when on the People/Projects tabs
```

### 3. Incorrect Input Field IDs

**Problem:**
```javascript
await page.fill('#person-name-input', 'Alice Smith');
await page.fill('#project-name-input', 'Project Alpha');
await page.fill('#fte-fte-input', '1.0');
await page.fill('#fte-start-month-input', '2025-01');
await page.fill('#budget-planned-pm-input', '5.0');
await page.fill('#budget-start-month-input', '2025-01');
```

**Actual HTML:**
```html
<!-- No dedicated name inputs - uses quick-add row pattern -->
<input type="number" id="fteValueInput" ...>
<input type="month" id="fteStartMonthInput" ...>
<input type="number" id="budgetValueInput" ...>
<input type="month" id="budgetStartMonthInput" ...>
```

**Solution:**
```javascript
// For adding people/projects - use quick-add row pattern
await page.click('#addPersonBtn');
await page.waitForSelector('.quick-add-row', { timeout: 5000 });
await page.fill('.quick-add-row input', 'Alice Smith');
await page.press('.quick-add-row input', 'Enter');

// For FTE/budget inputs - use correct IDs
await page.fill('#fteValueInput', '1.0');
await page.fill('#fteStartMonthInput', '2025-01');
await page.fill('#budgetValueInput', '5.0');
await page.fill('#budgetStartMonthInput', '2025-01');
```

### 4. Incorrect Button IDs

**Problem:**
```javascript
await page.click('#add-person-btn');
await page.click('#add-project-btn');
await page.click('#add-fte-btn');
await page.click('#add-budget-btn');
```

**Actual HTML:**
```html
<button id="addPersonBtn">Add Person</button>
<button id="addProjectBtn">Add Project</button>
<button id="addFteValueBtn">Add FTE Value</button>
<button id="addBudgetValueBtn">Add Budget Value</button>
```

**Solution:**
```javascript
await page.click('#addPersonBtn');
await page.click('#addProjectBtn');
await page.click('#addFteValueBtn');
await page.click('#addBudgetValueBtn');
```

### 5. Index Selector Issues

**Problem:**
```javascript
await page.selectOption('#personSelect', { index: 0 });
await page.selectOption('#projectSelect', { index: 0 });
```

**Issue:** The application auto-creates "Base Funding 210" and "Base Funding 220" projects, which appear first in the dropdown. Using `index: 0` selected these instead of "Project Alpha".

**Solution:**
```javascript
await page.selectOption('#personSelect', { label: 'Alice Smith' });
await page.selectOption('#projectSelect', { label: 'Project Alpha' });
```

### 6. Test Logic Issue - Project Overallocation Test

**Problem:**
The test tried to allocate 4.0 PM to a person with 1.0 FTE, triggering the person overallocation warning before the project overallocation warning could be tested.

```javascript
// This triggers person overallocation (4.0 > 1.0 FTE)
await page.fill('#pmInput', '4.0');
```

**Solution:**
Add a second person to properly test project budget overallocation:

```javascript
// First allocation: Alice with 0.3 PM (OK for person)
await page.selectOption('#personSelect', { label: 'Alice Smith' });
await page.fill('#pmInput', '0.3');
await page.click('#addAllocationBtn');

// Add second person (Bob Jones) with 1.0 FTE
// Then allocate Bob with 4.8 PM
// Total project allocation: 0.3 + 4.8 = 5.1 > 5.0 budget
// But both person allocations are within capacity
await page.selectOption('#personSelect', { label: 'Bob Jones' });
await page.fill('#pmInput', '4.8');
await page.click('#addAllocationBtn');
```

## Pattern Comparison

### Working Tests (app.spec.js, basic.spec.js)
```javascript
// Tab navigation
await page.click('[data-tab="people"]');

// Adding people
await page.click('#addPersonBtn');
await page.waitForSelector('.quick-add-row');
await page.fill('.quick-add-row input', 'Name');
await page.press('.quick-add-row input', 'Enter');

// Selecting by label
await page.selectOption('#personSelect', { label: 'Alice Smith' });
```

### Fixed Tests (allocation-validation.spec.js)
Now follows the same patterns as working tests.

## Lessons Learned

1. **Always check actual HTML structure** - Don't assume selector patterns
2. **Use label selectors** for dropdowns when possible (more reliable than index)
3. **Follow existing test patterns** - Reference working tests in the same suite
4. **Test data setup matters** - Ensure test scenario logic matches validation order
5. **Auto-created data affects tests** - Account for base funding projects in selectors

## Files Changed

- `tests/e2e/allocation-validation.spec.js` - Fixed all selectors and test logic (86 changes)
- `js/bundle.js` - Rebuilt after changes

## Verification

### Unit Tests
```
✅ Test Files: 38 passed (38)
✅ Tests: 639 passed (639)
```

### E2E Tests
```
✅ 47 passed
⊘ 2 skipped
Duration: 49.6s
```

## Conclusion

All E2E tests are now passing. The failures were entirely due to incorrect selectors in the newly added allocation-validation.spec.js file. The fixes align the test code with the actual application structure and follow the patterns used in other working E2E tests.
