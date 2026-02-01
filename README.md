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
- **Data Management & Backup**:
  - Export data to JSON files for permanent storage
  - Import data from JSON files
  - **Automatic JSON backup preparation** - one-click download of latest data
  - Automatic backups to browser localStorage (up to 10 recent versions)
  - Manual backup creation and restoration

## Data Safety & Backup

### Understanding Data Storage

This application uses two types of data storage:

1. **IndexedDB** (Primary Storage)
   - Stores all your current data (people, projects, allocations)
   - Persists in your browser
   - **Can be lost** if you clear browser data or reinstall the browser

2. **localStorage** (Automatic Backups)
   - Stores up to 10 recent automatic backups
   - Also stores an auto-prepared JSON backup for instant download
   - **Can be lost** when you clear browser cache/browsing data
   - Only accessible in the same browser where created
   - Good for quick recovery from accidental changes

### Protecting Your Data

**⚠️ IMPORTANT: To prevent data loss, you MUST save your data regularly!**

#### Recommended Data Safety Practices:

1. **Use the Automatic JSON Backup** (Easiest!)
   - Click the "⚡ Download Latest Auto-Backup" button regularly
   - This downloads a JSON file instantly (no preparation needed)
   - The backup is automatically kept up-to-date as you work
   - **Best practice**: Download at the end of each work session
   
2. **Regular Exports** (Also Important!)
   - Manually export your data to a JSON file at least weekly
   - Store exported files in a safe location:
     - Cloud storage (Google Drive, Dropbox, OneDrive, etc.)
     - External hard drive
     - Network backup system
     - Version control (if appropriate)

3. **Before Major Changes**
   - Export data before making significant updates
   - Download the auto-prepared backup
   - Keep the exported file until you're satisfied with changes

4. **After Important Updates**
   - Export data after adding critical information
   - Store in multiple locations if data is mission-critical

#### What Affects localStorage?

localStorage (where automatic backups are stored) is cleared when:
- ✗ You clear browser cache/browsing data
- ✗ You use browser's "Clear all data" option
- ✗ You clear site data in browser settings
- ✗ You uninstall/reinstall the browser
- ✗ You use browser in incognito/private mode (data not saved at all)
- ✓ Normal browsing does NOT clear it
- ✓ Closing the browser does NOT clear it

#### Accessing localStorage Outside the Browser

You cannot directly access localStorage files from your file system, but you can:

1. **Via Browser Developer Tools:**
   - Press F12 to open Developer Tools
   - Go to Application tab (Chrome/Edge) or Storage tab (Firefox)
   - Navigate to Local Storage → Your site URL
   - Find keys starting with "resource-planning-backup-"
   - Copy values manually and save to a file

2. **Via Export Feature (Recommended):**
   - Use the "Export All Data" button in the Data tab
   - This creates a downloadable JSON file
   - Save this file anywhere you want (computer, cloud, etc.)
   - This is the PROPER way to backup data outside the browser

#### Recovery Scenarios:

- **Accidental deletion**: Restore from localStorage backup (Data tab)
- **Browser cache cleared**: Import from exported JSON file
- **Browser crash/reinstall**: Import from exported JSON file
- **Moving to different browser**: Import from exported JSON file
- **Moving to different computer**: Import from exported JSON file

### How to Export Data

1. Click the "Data" tab
2. Click "📥 Export All Data"
3. Save the JSON file to a safe location
4. Recommended filename format: `resource-allocation-YYYY-MM-DD.json`

### How to Import Data

1. Click the "Data" tab
2. Click "📤 Import Data"
3. Select a previously exported JSON file
4. Confirm (this will replace ALL current data)
5. Page will refresh with imported data

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

### Fallback for Non-ES6 Module Environments

The application includes an automatic fallback (`js/bundle.js`) that loads when ES6 modules are not supported (e.g., when using `file://` protocol or older browsers).

**For Developers**: After making code changes, regenerate the bundle:

```bash
npm run build:bundle
```

See [docs/BUNDLE.md](docs/BUNDLE.md) for detailed information about the bundle.js fallback mechanism.

## Testing

This application includes comprehensive test coverage with automated regression prevention.

### Coverage Status

Current coverage: **~94%** overall
- Statements: 94.02%
- Branches: 89.67%
- Functions: 82.85%
- Lines: 94.02%

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
