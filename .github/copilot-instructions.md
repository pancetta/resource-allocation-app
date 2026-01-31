# Copilot Instructions for Resource Allocation App

## Project Overview
This is a client-side resource allocation web application built with vanilla JavaScript (ES6 modules), HTML, and CSS. It helps manage people, projects, and resource allocations across time periods.

## Technology Stack
- **Frontend**: Vanilla JavaScript (ES6 modules), HTML5, CSS3
- **Data Storage**: IndexedDB (browser-based)
- **No build system**: Direct browser module loading
- **No package manager**: No npm, yarn, or other dependencies

## Project Structure
```
/
├── index.html          # Main application entry point
├── master.html         # Previous layout/master template file, not to be used for production (only to verify that original functionality is preserved)
├── css/
│   ├── base.css        # Base styles
│   └── components.css  # Component-specific styles
└── js/
    ├── main.js         # Application initialization
    ├── data/
    │   └── database.js # IndexedDB layer with CRUD operations
    ├── helpers/
    │   └── classUtil.js # Utility functions for CSS classes
    ├── ui/
    │   └── tabs.js     # Tab navigation logic
    └── views/
        ├── peopleView.js       # People management
        ├── projectsView.js     # Project management
        ├── allocationsView.js  # Allocation management
        ├── monthlyReport.js    # Monthly reporting
        ├── yearlyReport.js     # Yearly reporting
        └── projectOverview.js  # Project overview
```

## Coding Conventions

### JavaScript
- Use ES6 modules (`import`/`export`)
- Use `async`/`await` for asynchronous operations
- Follow clear naming: descriptive function and variable names
- Database IDs use specific prefixes:
  - People: `p001`, `p002`, etc.
  - Projects: `proj001`, `proj002`, etc.
- All database operations are in `data/database.js`
- View logic is separated into `views/` directory
- Each view handles its own rendering and event listeners

### HTML
- Use semantic HTML5 elements
- Data attributes for DOM manipulation (`data-id`, `data-field`, etc.)
- Content editable cells for inline editing in tables
- Module type for script loading: `<script type="module" src="js/main.js"></script>`

### CSS
- Two-file structure: `base.css` for foundational styles, `components.css` for components
- Use class-based styling
- Dynamic classes: `correct` and `warning` for data validation feedback

### Database (IndexedDB)
- Database name: `resource-planning`
- Object stores:
  - `people`: Stores person records (id, name, fte, active)
  - `projects`: Stores project records (id, name, plannedPM)
  - `defaultAllocations`: Stores allocation records (id, personId, projectId, pct, startMonth, endMonth)
- All CRUD operations use async/await patterns
- Transaction management handled within database.js

## Development Guidelines

### When Adding Features
1. Follow the existing modular pattern (view files for UI, database.js for data)
2. Use existing ID generation functions for new records
3. Maintain separation between data layer and view layer
4. Add event listeners in view-specific `init` functions
5. Re-render views after data changes

### When Modifying Database
1. Update the `DB_VERSION` constant in `database.js`
2. Add migration logic in `onupgradeneeded` handler
3. Ensure backward compatibility where possible

### When Adding UI Components
1. Add HTML structure in `index.html`
2. Add styles to appropriate CSS file (base vs. components)
3. Create/update view file in `js/views/`
4. Initialize in `main.js`

### Testing
- **Automated Test Suite**: Comprehensive tests using Vitest (unit/integration) and Playwright (E2E)
- **Run Tests Before Changes**: Always run `npm test` and `npm run test:e2e` before making changes to establish baseline
- **Run Tests After Changes**: Always test your changes with `npm test` for unit/integration tests
- **E2E Testing**: Run `npm run test:e2e` to verify UI workflows (requires Playwright browsers installed)
- **Test Commands**:
  - `npm test` - Run unit and integration tests
  - `npm run test:watch` - Run tests in watch mode during development
  - `npm run test:e2e` - Run end-to-end tests
  - `npm run test:all` - Run all tests (unit, integration, and E2E)
- **Manual Testing**: Can also test manually by opening `index.html` in browser
- **Browser Compatibility**: Test in Chrome/Edge (primary), Firefox, and Safari
- **IndexedDB Testing**: Unit tests use fake-indexeddb; verify IndexedDB operations in browser DevTools for manual testing
- **Test Coverage**: Maintain or improve test coverage when adding features
- **Test Location**: 
  - Unit tests: `tests/unit/`
  - Integration tests: `tests/integration/`
  - E2E tests: `tests/e2e/`

### Common Patterns
- **Rendering**: Async functions that query database and populate DOM
- **Event Handling**: Attach listeners after rendering DOM elements
- **Inline Editing**: Use `contenteditable` with `blur` event handlers
- **Data Updates**: Find record, modify fields, call update function, re-render

## Important Notes
- No transpilation or bundling - code runs directly in browser
- Must support modern browsers with ES6 module support
- All state is stored in IndexedDB - no server-side persistence
- Application is fully client-side and can run from file:// protocol or static hosting

## When Making Changes
1. Keep the modular structure intact
2. Maintain consistency with existing code style
3. **Run existing tests before making changes** to establish baseline: `npm test` and `npm run test:e2e`
4. Make your code changes
5. **Run tests after changes** to verify no regressions: `npm test` and `npm run test:e2e`
6. Add or update tests for new functionality or bug fixes
7. Ensure changes work without a build step (no transpilation/bundling)
8. Test manually in browser if needed
9. Verify IndexedDB operations in browser console for data layer changes
10. Check for failing tests in the linked CI pipeline after creating the PR and debug them.
