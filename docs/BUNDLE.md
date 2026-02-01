# Bundle.js - Fallback for Non-ES6 Module Environments

## Purpose

`bundle.js` serves as a fallback for environments where ES6 modules are not supported, such as:
- Opening the app with `file://` protocol (double-clicking index.html)
- Older browsers without ES6 module support
- Environments where module loading fails

## When is it used?

The fallback is automatically triggered by `index.html`:

```javascript
setTimeout(function() {
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab && !window.modulesLoaded) {
        console.warn('ES6 modules failed to load, loading fallback bundle');
        const script = document.createElement('script');
        script.src = 'js/bundle.js';
        document.body.appendChild(script);
    }
}, 1000);
```

If ES6 modules don't load within 1 second, bundle.js is loaded instead.

## How to regenerate bundle.js

Whenever you update the application code (any `.js` files in `js/` directory), you should regenerate bundle.js:

```bash
npm run build:bundle
```

This runs: `esbuild js/main.js --bundle --outfile=js/bundle.js --format=iife --global-name=App`

### When to regenerate:
- After adding new features
- After fixing bugs
- After modifying any module in `js/` directory
- Before releasing a new version
- Before merging PRs that change JavaScript code

## Technical details

- **Bundler**: esbuild (fast, zero-config)
- **Format**: IIFE (Immediately Invoked Function Expression)
- **Entry point**: `js/main.js`
- **Output**: `js/bundle.js`
- **Size**: ~43KB (as of last build)

## Testing

Test the bundle.js fallback:

```bash
# Run fallback-specific E2E tests
npx playwright test tests/e2e/fallback.spec.js

# Or run all tests
npm run test:e2e
```

Manually test by opening `test-fallback.html` in a browser (or use file:// protocol with index.html).

## Important Notes

1. **bundle.js must be kept in sync** with the ES6 module code
2. **Do not edit bundle.js directly** - it's auto-generated
3. **Always regenerate after code changes** to avoid issues like #32
4. **Test both ES6 modules and bundle.js** to ensure feature parity
5. **Coverage excludes bundle.js** (configured in vitest.config.js)

## Why not use bundle.js as primary?

This project follows modern JavaScript best practices:
- No build step for development
- Direct browser module loading
- Faster development iteration
- Easier debugging with source maps
- bundle.js is only for compatibility, not the primary delivery method
