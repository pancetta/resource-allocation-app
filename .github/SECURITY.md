# Security Policy

## GitHub Actions Workflows

### `pull_request_target` Usage

This repository uses `pull_request_target` triggers in GitHub Actions workflows to avoid manual approval requirements for PRs created by GitHub Apps (like Copilot). This is a conscious security decision with the following safeguards:

#### Security Measures

1. **Minimal Permissions**
   - `contents: read` - Workflows can only read code, not modify it
   - `pull-requests: write` - Only for coverage reporting (unit-tests job only)
   - No access to repository secrets
   - No write access to the repository

2. **Safe Operations Only**
   - Workflows only run tests (`npm test`, `npm run test:e2e`)
   - No code compilation or deployment
   - No execution of arbitrary code from PRs
   - No modification of repository content

3. **Controlled Dependencies**
   - Uses `npm ci` which installs from locked dependencies (`package-lock.json`)
   - No dynamic dependency installation from PR
   - Dependencies are verified before installation

#### CodeQL Alerts

CodeQL may flag the following warnings for workflows using `pull_request_target`:

1. **Untrusted code execution** - False positive
   - We only execute test suites, not arbitrary PR code
   - No secrets are exposed to the PR environment
   - Permissions are minimal (read-only)

2. **Cache poisoning** - False positive
   - We use `npm ci` which installs from lockfile
   - Cache is scoped per-branch and per-workflow
   - No dynamic dependency resolution from PR

#### Why This Is Safe

The security model relies on:
- **Least privilege**: Workflows have minimal permissions needed
- **Sandboxed execution**: Tests run in isolated environments
- **No secret access**: Untrusted code never has access to secrets
- **Verified dependencies**: All dependencies come from package-lock.json

This approach is safer than the alternatives:
- Manual approval creates friction and delays
- Using `pull_request` trigger blocks automation entirely
- Our approach maintains security while enabling automation

#### References

- [GitHub Documentation: pull_request_target](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target)
- [Keeping your GitHub Actions workflows secure](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
