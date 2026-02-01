# GitHub Actions Workflow Approvals Troubleshooting Guide

## Problem

When Copilot (or other GitHub Apps) creates pull requests, GitHub Actions workflows may show status `action_required` and require manual approval before running tests. This creates friction in the development workflow.

## Root Cause

GitHub has security measures to prevent malicious code execution in CI/CD workflows. Even when using `pull_request_target` (which this repository uses), workflows may still require manual approval due to repository settings.

The key setting is: **"Approval for running fork pull request workflows from contributors"**

## Why `pull_request_target` Alone Isn't Enough

While `pull_request_target` runs workflows in the context of the base branch (avoiding some security restrictions), GitHub still applies approval policies based on:

1. **The PR author's status** - Is this a first-time contributor?
2. **The event trigger** - Who triggered the workflow?
3. **Repository settings** - What approval policy is configured?

Copilot (as a GitHub App) may be treated as an external contributor requiring approval, depending on these settings.

## Solution: Configure Repository Settings

To allow workflows to run automatically for Copilot PRs, the repository owner needs to adjust the approval settings:

### Step-by-Step Instructions

1. **Navigate to Repository Settings**
   - Go to your repository on GitHub
   - Click **Settings** (you need admin/owner access)

2. **Open Actions Settings**
   - In the left sidebar, click **Actions**
   - Click **General**

3. **Configure Approval Policy**
   - Scroll to **"Approval for running fork pull request workflows from contributors"**
   - You have several options:

   **Option A: Require approval for first-time contributors who are new to GitHub** (Recommended)
   - Only brand new GitHub users need approval
   - Copilot has commits merged, so it won't require approval
   - Good security balance

   **Option B: Require approval for first-time contributors**
   - Only users who have never contributed to this repo need approval
   - After Copilot's first merged commit, no more approvals needed
   - More permissive than Option A

   **Option C: Require approval for all external contributors**
   - All non-members need approval every time
   - Most restrictive option
   - Not recommended if you want automated Copilot workflows

4. **Click Save**

### Recommendation

Use **Option A** ("Require approval for first-time contributors who are new to GitHub"):
- ✅ Copilot can run workflows automatically after first contribution
- ✅ Maintains security against truly new/untrusted accounts
- ✅ Allows automation while protecting against abuse

## What Our Workflows Do (Security Context)

Both workflows (`.github/workflows/tests.yml` and `.github/workflows/copilot-setup-steps.yml`) are designed with security in mind:

### Safe Operations Only
- ✅ Run tests only (`npm test`, `npm run test:e2e`)
- ✅ No code compilation or deployment
- ✅ No execution of arbitrary code from PRs
- ✅ No modification of repository content

### Minimal Permissions
```yaml
permissions:
  contents: read        # Can only read code
  pull-requests: write  # Only for coverage reports
```

- ✅ No access to repository secrets
- ✅ No write access to repository
- ✅ Cannot push code or modify branches

### Controlled Dependencies
- ✅ Uses `npm ci` which installs from locked dependencies (`package-lock.json`)
- ✅ No dynamic dependency installation from PR
- ✅ Dependencies are verified before installation

### Explicit Code Checkout
```yaml
- uses: actions/checkout@v4
  with:
    ref: ${{ github.event.pull_request.head.sha || github.sha }}
```

- ✅ Tests the actual PR code
- ✅ Explicit ref prevents code injection
- ✅ Fallback to `github.sha` for push events

## Alternative: One-Time Approval

If you cannot change repository settings (e.g., organization policy), you can:

1. **Approve Copilot's first workflow run manually**
   - Go to the PR
   - Click "Approve and run" for the workflow
   - After this first approval, subsequent runs may not need approval (depending on settings)

2. **Add Copilot as a repository contributor**
   - This may bypass "external contributor" restrictions
   - Note: This depends on organization settings

## Verifying the Fix

After changing settings:

1. Have Copilot create a new PR
2. Check the workflow status in the PR
3. Workflows should start automatically without "action_required"
4. Status should show "queued" → "in_progress" → "completed"

## Test Environment Consistency

The `copilot-setup-steps.yml` workflow ensures Copilot sees the same test results as the main CI:

- ✅ Same Node.js version (20)
- ✅ Same dependencies (`npm ci`)
- ✅ Same test commands (`npm test`, `npm run test:e2e`)
- ✅ Same browser setup (Chromium with Playwright)
- ✅ Same coverage reporting

This means when Copilot runs tests in its environment, the results match what the PR workflow will show. No more surprises!

## Still Having Issues?

If workflows still require approval after following these steps:

1. **Check organization-level settings** - Organization policies may override repository settings
2. **Verify Copilot has merged commits** - Copilot needs at least one merged PR to be considered a "contributor"
3. **Review workflow permissions** - Ensure permissions are set correctly in workflow files
4. **Check for CodeQL alerts** - While these are false positives (see `.github/SECURITY.md`), they don't block workflows

## Security Concerns?

See `.github/SECURITY.md` for a detailed explanation of why our use of `pull_request_target` with these workflows is safe, and why CodeQL warnings about "untrusted code execution" and "cache poisoning" are false positives in our context.

## References

- [GitHub Docs: Approving workflow runs from forks](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/approving-workflow-runs-from-public-forks)
- [GitHub Docs: Managing GitHub Actions settings for a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)
- [GitHub Docs: pull_request_target event](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target)
- [GitHub Docs: Security hardening for GitHub Actions](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
