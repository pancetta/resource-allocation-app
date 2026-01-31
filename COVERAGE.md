# Test Coverage Guide

## Overview

This project maintains high test coverage to ensure code quality and prevent regressions. Coverage is automatically measured, reported, and enforced through our CI/CD pipeline.

## Current Coverage

As of the latest test run:
- **Overall**: 77.87%
- **Statements**: 77.87%
- **Branches**: 85.88%
- **Functions**: 76.11%
- **Lines**: 77.87%

## Coverage by Module

| Module | Coverage | Status |
|--------|----------|--------|
| `js/data/database.js` | 94.44% | ✅ Excellent |
| `js/helpers/` | 100% | ✅ Complete |
| `js/ui/tabs.js` | 100% | ✅ Complete |
| `js/views/peopleView.js` | 97.97% | ✅ Excellent |
| `js/views/projectsView.js` | 97.59% | ✅ Excellent |
| `js/views/monthlyReport.js` | 93.9% | ✅ Excellent |
| `js/views/yearlyReport.js` | 96.15% | ✅ Excellent |
| `js/views/allocationsView.js` | 0% | ⚠️ Needs tests |
| `js/views/projectOverview.js` | 0% | ⚠️ Needs tests |
| `js/main.js` | 0% | ⚠️ Needs tests |

## Coverage Thresholds

The project enforces minimum coverage thresholds to prevent regression:

```javascript
{
  statements: 75,
  branches: 80,
  functions: 70,
  lines: 75
}
```

These thresholds are configured in `vitest.config.js` and are checked on every test run.

### What Happens When Coverage Falls Below Thresholds?

- Tests will **fail** if coverage drops below any threshold
- CI/CD pipeline will **block** the pull request
- You must add tests to bring coverage back above thresholds

## Viewing Coverage Reports

### 1. Command Line

Run tests to see coverage summary in terminal:

```bash
npm test
```

Output shows coverage percentages for each file and overall totals.

### 2. HTML Report

For detailed, interactive coverage report:

```bash
npm test
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

The HTML report provides:
- **File Explorer**: Navigate through the codebase
- **Line-by-Line Coverage**: See exactly which lines are covered
- **Color Coding**: Green (covered), Red (uncovered), Yellow (partially covered)
- **Branch Coverage**: See which conditional paths are tested
- **Search & Filter**: Find specific files or uncovered areas

### 3. JSON Reports

Programmatic access to coverage data:

- **Summary**: `coverage/coverage-summary.json`
- **Detailed**: `coverage/coverage-final.json`

### 4. Pull Request Comments

On GitHub Pull Requests, coverage is automatically:
- Calculated during CI/CD
- Posted as a comment on the PR
- Shows coverage changes (increase/decrease)
- Highlights newly uncovered lines

## Coverage in CI/CD

### GitHub Actions Workflow

The `.github/workflows/tests.yml` workflow:

1. Runs all unit and integration tests
2. Generates coverage reports
3. Uploads coverage artifacts
4. Posts coverage summary to PR (if applicable)
5. Fails if coverage is below thresholds

### PR Coverage Comments

Pull requests automatically receive coverage comments showing:
- Overall coverage percentage
- Coverage change vs. base branch
- Files with changed coverage
- Links to detailed reports

## Adding Tests to Improve Coverage

### Finding Uncovered Code

1. Run tests: `npm test`
2. Open HTML report: `coverage/index.html`
3. Navigate to files with low coverage
4. Red lines indicate uncovered code

### Writing Tests for Uncovered Code

Follow these guidelines:

#### Unit Tests

Located in `tests/unit/`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { myFunction } from '../../js/myModule.js';

describe('My Module', () => {
  beforeEach(async () => {
    // Setup (e.g., initialize database)
    await openDatabase();
    clearCache();
  });

  it('should handle edge case', () => {
    const result = myFunction(edgeCaseInput);
    expect(result).toBe(expectedValue);
  });
});
```

#### Integration Tests

Located in `tests/integration/`:

```javascript
import { describe, it, expect } from 'vitest';
import { moduleA } from '../../js/moduleA.js';
import { moduleB } from '../../js/moduleB.js';

describe('Integration: Module A and B', () => {
  it('should work together correctly', async () => {
    const dataFromA = await moduleA.getData();
    const result = await moduleB.process(dataFromA);
    expect(result).toMatchObject(expectedShape);
  });
});
```

#### E2E Tests

Located in `tests/e2e/`:

```javascript
import { test, expect } from '@playwright/test';

test('should complete user workflow', async ({ page }) => {
  await page.goto('/');
  await page.click('#button');
  await expect(page.locator('#result')).toBeVisible();
});
```

### Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Cover Edge Cases**: Test boundary conditions, null values, empty arrays, etc.
3. **One Assertion Per Test**: Keep tests focused and easy to debug
4. **Descriptive Test Names**: Use "should..." format describing expected behavior
5. **Setup/Teardown**: Use `beforeEach`/`afterEach` for test isolation
6. **Avoid Testing Third-Party Code**: Don't test framework/library internals

## Coverage Goals

### Short-term (Current Sprint)

- ✅ Achieve 75%+ overall coverage
- ✅ Set up coverage thresholds
- ✅ Add PR coverage reporting
- ⚠️ Add tests for `allocationsView.js`
- ⚠️ Add tests for `projectOverview.js`
- ⚠️ Add tests for `main.js`

### Mid-term

- Reach 85%+ overall coverage
- 100% coverage for critical modules (database, calculations)
- Add mutation testing

### Long-term

- Maintain 90%+ coverage
- Zero tolerance for coverage regression
- Regular coverage audits

## Troubleshooting

### Coverage Not Generated

```bash
# Ensure coverage is enabled
npm test  # Should include --coverage flag

# Check vitest.config.js has coverage.provider set
```

### Thresholds Failing Locally But Passing in CI

```bash
# Clear coverage cache
rm -rf coverage/
npm test
```

### HTML Report Not Opening

```bash
# Ensure tests have been run first
npm test

# Check coverage/ directory exists
ls coverage/

# Manually navigate to coverage/index.html in browser
```

## Resources

- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage.html)
- [Istanbul Coverage](https://istanbul.js.org/)
- [V8 Coverage](https://v8.dev/blog/javascript-code-coverage)
- Project test documentation: `TESTING.md`

## Questions?

If you have questions about coverage or testing:
1. Check this guide and `TESTING.md`
2. Review existing tests for patterns
3. Ask in pull request comments
4. Open an issue with "testing" label
