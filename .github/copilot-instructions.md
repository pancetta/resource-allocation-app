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
- This is a client-side app with no automated test suite
- Manual testing is done via browser (open `index.html` in browser)
- Test in Chrome/Edge (primary), Firefox, and Safari for compatibility
- Verify IndexedDB operations in browser DevTools

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
3. Test manually in browser after changes
4. Ensure changes work without a build step
5. Verify IndexedDB operations in browser console
