# Contributing to Resource Allocation App

Thank you for your interest in contributing to the Resource Allocation App! This document provides guidelines for contributing to the project, including how to work effectively with GitHub Copilot.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Working with GitHub Copilot](#working-with-github-copilot)
- [Testing](#testing)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, or Safari)
- Node.js and npm (for running tests)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/pancetta/resource-allocation-app.git
   cd resource-allocation-app
   ```

2. Install test dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browsers (for E2E tests):
   ```bash
   npx playwright install chromium
   ```

4. Open `index.html` in your browser to run the application locally, or use a local web server:
   ```bash
   python -m http.server 8080
   # or
   npx http-server -p 8080
   ```

## Development Workflow

1. **Create a branch** for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Run tests before making changes** to establish a baseline:
   ```bash
   npm test
   npm run test:e2e
   ```

3. **Make your changes** following the [code standards](#code-standards)

4. **Run tests after changes** to ensure no regressions:
   ```bash
   npm test
   npm run test:e2e
   ```

5. **Add or update tests** for new functionality or bug fixes

6. **Commit your changes** with clear, descriptive commit messages

7. **Push your branch** and create a pull request

## Working with GitHub Copilot

This repository is optimized for GitHub Copilot coding agent. Here's how to work effectively with Copilot:

### Using Copilot Coding Agent

GitHub Copilot coding agent can help with various tasks:

- Fixing bugs
- Adding new features
- Improving test coverage
- Updating documentation
- Addressing technical debt
- Improving accessibility

### Copilot Test Environment

**Important:** Copilot now runs the same tests as the main CI workflow to ensure consistency and prevent issues where internal tests pass but CI tests fail.

The `copilot-setup-steps.yml` workflow:
- Runs automatically when Copilot creates or modifies PRs
- Executes the same unit and integration tests as the main CI (`npm test`)
- Executes the same E2E tests as the main CI (`npm run test:e2e`)
- Uses the exact same Node.js version (20) and environment as CI
- Reports coverage and test results just like the main CI workflow

This means:
- ✅ No more manual workflow approvals needed
- ✅ Copilot sees the same test results as your CI
- ✅ Failures are caught early, before creating PRs
- ✅ Consistent test environment across all workflows

### Assigning Issues to Copilot

When creating issues for Copilot to work on, make them clear and well-scoped:

1. **Provide a clear description** of the problem or feature
2. **Include acceptance criteria** on what a good solution looks like
3. **Mention which files** need to be changed (if known)
4. **Specify testing requirements** (e.g., "Add unit tests for new functionality")

**Example of a well-scoped issue:**

```markdown
Title: Add filter by active status in People view

Description:
Currently, the People view shows all people (both active and inactive). 
Add a filter dropdown to show only active, only inactive, or all people.

Acceptance Criteria:
- [ ] Add a dropdown/toggle UI element above the people table
- [ ] Filter updates the table in real-time
- [ ] Default to showing all people
- [ ] Add unit tests for the filter logic
- [ ] Add E2E tests for the filter UI interaction
- [ ] Maintain existing functionality

Files to modify:
- js/views/peopleView.js
- css/components.css (if needed for styling)
```

### Custom Instructions

This repository includes custom instructions for Copilot in:

- `.github/copilot-instructions.md` - General project guidelines and conventions
- `.github/instructions/playwright-tests.instructions.md` - Guidelines for E2E tests
- `.github/instructions/vitest-tests.instructions.md` - Guidelines for unit/integration tests

These instructions help Copilot understand the project structure, coding conventions, and testing requirements.

### Reviewing Copilot's Work

When Copilot creates a pull request:

1. **Review the code** just as you would for any PR
2. **Run the tests** to verify functionality
3. **Test manually** in the browser if needed
4. **Provide feedback** by mentioning `@copilot` in PR comments
5. **Request changes** if needed - Copilot can iterate on its work

## Testing

This project has comprehensive test coverage:

### CI/CD Workflows

The project uses GitHub Actions for continuous integration:

**Main CI Workflow** (`.github/workflows/tests.yml`):
- Triggers on: Push to `main`/`develop` branches, pull requests
- **Uses `pull_request_target` trigger** to avoid manual approval requirements for PRs from GitHub Apps (like Copilot)
- Two parallel jobs:
  1. **Unit Tests**: Runs Vitest with coverage reporting
  2. **E2E Tests**: Runs Playwright browser tests
- Node.js version: 20
- Uploads coverage reports and test artifacts

**Copilot Setup Workflow** (`.github/workflows/copilot-setup-steps.yml`):
- Triggers on: 
  - Pull requests that modify the workflow file itself
  - Push events that modify the workflow file
  - Manual workflow dispatch
  - Automatically when Copilot creates/modifies PRs
- Runs the exact same tests as the main CI workflow
- Ensures Copilot uses the same environment and catches issues early
- **Uses `pull_request_target` trigger**: This runs workflows in the context of the base branch, avoiding GitHub's security restrictions that require manual approval for PRs from GitHub Apps. The workflow explicitly checks out the PR code using `ref: ${{ github.event.pull_request.head.sha || github.sha }}` to test the actual changes (with a fallback to `github.sha` for push events) while maintaining security.

Both workflows use identical:
- Node.js version (20)
- Dependencies (`npm ci`)
- Test commands (`npm test`, `npm run test:e2e`)
- Browser setup (Chromium with Playwright)

### Unit & Integration Tests

Run with Vitest:

```bash
# Run once
npm test

# Watch mode (re-runs on changes)
npm run test:watch

# With UI
npm run test:ui
```

### End-to-End Tests

Run with Playwright:

```bash
# Run E2E tests
npm run test:e2e

# With UI (interactive mode)
npm run test:e2e:ui
```

### Run All Tests

```bash
npm run test:all
```

### Writing Tests

- **Unit tests** go in `tests/unit/`
- **Integration tests** go in `tests/integration/`
- **E2E tests** go in `tests/e2e/`

See the test-specific instruction files for detailed guidelines:
- [Playwright E2E Test Guidelines](.github/instructions/playwright-tests.instructions.md)
- [Vitest Unit/Integration Test Guidelines](.github/instructions/vitest-tests.instructions.md)

## Code Standards

### JavaScript

- Use ES6 modules (`import`/`export`)
- Use `async`/`await` for asynchronous operations
- Follow descriptive naming conventions
- Maintain separation between data layer (`data/database.js`) and view layer (`views/`)

### HTML

- Use semantic HTML5 elements
- Use data attributes for DOM manipulation (`data-id`, `data-field`)
- Content editable cells for inline editing

### CSS

- Two-file structure: `base.css` and `components.css`
- Use class-based styling
- Dynamic classes: `correct` (green) and `warning` (red) for validation feedback

### Database

- Database name: `resource-planning`
- Object stores: `people`, `projects`, `defaultAllocations`
- All CRUD operations use async/await
- Person IDs: `p001`, `p002`, etc.
- Project IDs: `proj001`, `proj002`, etc.

## Pull Request Process

1. **Ensure all tests pass** before creating a PR
2. **Update documentation** if needed (README.md, TESTING.md, etc.)
3. **Describe your changes** clearly in the PR description
4. **Link related issues** using keywords like "Fixes #123"
5. **Request review** from maintainers
6. **Address feedback** promptly

### PR Checklist

- [ ] Tests pass locally (`npm run test:all`)
- [ ] New tests added for new functionality
- [ ] Documentation updated if needed
- [ ] Code follows existing style and conventions
- [ ] No build/bundling required - runs in browser directly
- [ ] Manually tested in browser

## Questions?

If you have questions or need help, feel free to:

- Open an issue for discussion
- Ask in PR comments
- Review existing documentation in the repository

Thank you for contributing!
