# Resource Allocation App

A client-side resource allocation web application built with vanilla JavaScript (ES6 modules), HTML, and CSS. It helps manage people, projects, and resource allocations across time periods.

## Features

- **People Management**: Add, edit, and delete team members with FTE tracking
- **Project Management**: Create and manage projects with planned PM (Person-Months)
- **Allocations**: Assign people to projects with percentage allocations and date ranges
- **Reports**:
  - Monthly reports showing person and project allocations
  - Yearly overview with month-by-month breakdown
  - Project overview across months

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6 modules), HTML5, CSS3
- **Data Storage**: IndexedDB (browser-based)
- **No build system**: Direct browser module loading
- **No package manager required for runtime**: Runs in any modern browser

## Running the Application

### Option 1: Direct File Access
Simply open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari).

### Option 2: Local Web Server
For better module loading reliability:

```bash
# Using Python
python -m http.server 8080

# Using Node.js http-server (if installed)
npx http-server -p 8080
```

Then navigate to `http://localhost:8080` in your browser.

## Testing

This application includes comprehensive test coverage with automated regression prevention.

### Coverage Status

Current coverage: **~78%** overall
- Statements: 77.87%
- Branches: 85.88%
- Functions: 76.11%
- Lines: 77.87%

Coverage reports are automatically generated and posted to pull requests.

### Coverage Requirements

The test suite enforces minimum coverage thresholds to prevent regression:
- **Statements**: 75%
- **Branches**: 80%
- **Functions**: 70%
- **Lines**: 75%

If coverage falls below these thresholds, the test suite will fail. This ensures that new code is properly tested and existing coverage doesn't decrease.

### Viewing Coverage Reports

After running tests, coverage reports are available in multiple formats:

1. **Terminal**: Displayed after running `npm test`
2. **HTML Report**: Open `coverage/index.html` in a browser for an interactive report
3. **JSON**: `coverage/coverage-summary.json` for programmatic access
4. **Pull Requests**: Coverage summary is automatically posted as a comment on PRs

### Prerequisites

Install Node.js and npm, then install test dependencies:

```bash
npm install
```

### Unit Tests

Unit tests verify individual functions and modules work correctly.

```bash
# Run unit tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI
npm run test:ui
```

Tests include:
- Database CRUD operations
- ID generation
- Helper utilities
- Calculation logic

### Integration Tests

Integration tests verify that modules work together correctly.

```bash
npm test
```

Tests include:
- Monthly calculation accuracy
- Yearly calculation accuracy
- Data flow between database and views
- Edge cases (zero FTE, missing data, etc.)

### End-to-End (E2E) Tests

E2E tests verify the full application workflow in a real browser.

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

E2E tests include:
- Tab navigation
- Adding/editing/deleting people and projects
- Creating allocations
- Generating reports
- UI validation classes (correct/warning)

### Run All Tests

```bash
npm run test:all
```

### Coverage Reports

To view detailed coverage information:

```bash
# Run tests with coverage (default)
npm test

# Open HTML coverage report in browser
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

The HTML report shows:
- Line-by-line coverage for each file
- Which lines are covered/uncovered
- Coverage percentages by file and directory
- Filtering and search capabilities

## Test Coverage

The test suite covers:

1. **Data Layer** (`js/data/database.js`)
   - All CRUD operations for people, projects, and allocations
   - ID generation algorithms
   - IndexedDB transactions

2. **Business Logic** (`js/views/*.js`)
   - Monthly allocation calculations
   - Yearly allocation calculations
   - Project overview calculations
   - FTE calculations

3. **Helper Utilities** (`js/helpers/*.js`)
   - CSS class utilities
   - Data validation

4. **User Interface**
   - Tab navigation
   - Form interactions
   - Table rendering
   - Inline editing
   - Report generation

## Continuous Integration

Tests run automatically on GitHub Actions for:
- Pull requests to `main` or `develop` branches
- Pushes to `main` or `develop` branches

See `.github/workflows/tests.yml` for CI configuration.

## Development

### Project Structure

```
/
├── index.html          # Main application entry point
├── css/
│   ├── base.css        # Base styles
│   └── components.css  # Component-specific styles
├── js/
│   ├── main.js         # Application initialization
│   ├── data/
│   │   └── database.js # IndexedDB layer
│   ├── helpers/
│   │   └── classUtil.js # Utility functions
│   ├── ui/
│   │   └── tabs.js     # Tab navigation
│   └── views/
│       ├── peopleView.js
│       ├── projectsView.js
│       ├── allocationsView.js
│       ├── monthlyReport.js
│       ├── yearlyReport.js
│       └── projectOverview.js
└── tests/
    ├── unit/           # Unit tests
    ├── integration/    # Integration tests
    └── e2e/            # End-to-end tests
```

### Testing Framework

- **Unit/Integration Tests**: [Vitest](https://vitest.dev/) - Fast, modern test runner with ES modules support
- **E2E Tests**: [Playwright](https://playwright.dev/) - Reliable browser automation
- **Mocking**: fake-indexeddb for simulating IndexedDB in tests
- **DOM**: happy-dom for lightweight DOM implementation in unit tests

### Adding New Tests

**Unit Test Example:**
```javascript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../js/myModule.js';

describe('My Module', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expectedValue);
  });
});
```

**E2E Test Example:**
```javascript
import { test, expect } from '@playwright/test';

test('should interact with UI', async ({ page }) => {
  await page.goto('/');
  await page.click('#myButton');
  await expect(page.locator('#result')).toBeVisible();
});
```

## License

MIT
