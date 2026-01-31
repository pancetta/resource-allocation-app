---
applyTo: "**/tests/{unit,integration}/*.test.js"
---

# Vitest Unit and Integration Test Guidelines

When writing or modifying Vitest tests for this application, follow these guidelines:

## Test Structure

1. **Organize with describe blocks**:
   ```javascript
   import { describe, it, expect, beforeEach } from 'vitest';
   
   describe('Module Name', () => {
     describe('functionName', () => {
       it('should do something specific', () => {
         // test implementation
       });
     });
   });
   ```

2. **Use clear, descriptive test names**:
   - Start with "should" to describe expected behavior
   - Be specific about what is being tested
   - Include edge cases in the description

3. **File naming convention**:
   - `*.test.js` for all test files
   - Match the source file name (e.g., `database.js` → `database.test.js`)

## Database Testing

This application uses IndexedDB. For testing:

1. **Use fake-indexeddb**:
   - Already configured in vitest.config.js
   - Provides a fast, in-memory IndexedDB implementation
   - No additional setup needed in test files

2. **Test database operations**:
   ```javascript
   import { describe, it, expect, beforeEach } from 'vitest';
   import * as db from '../../js/data/database.js';
   
   beforeEach(async () => {
     // Database is automatically initialized
     // Add test data as needed
   });
   
   it('should add a person', async () => {
     const person = await db.addPerson('Alice', 1.0);
     expect(person.id).toBe('p001');
     expect(person.name).toBe('Alice');
   });
   ```

3. **Database patterns**:
   - All database operations are async - use `async/await`
   - IDs are auto-generated with specific prefixes (p001, proj001)
   - Test both success and error cases
   - Verify data persistence by reading back after writes

## Testing Conventions

1. **Async/Await Pattern**:
   - All database operations return Promises
   - Use `async` test functions with `await`
   - Always `await` database operations in tests

2. **Assertions**:
   - Use `expect()` for all assertions
   - Chain matchers for clarity: `expect(value).toBe(expected)`
   - Common matchers:
     - `.toBe()` for primitives and reference equality
     - `.toEqual()` for deep equality of objects/arrays
     - `.toHaveLength()` for arrays
     - `.toBeCloseTo()` for floating-point numbers
     - `.toBeTruthy()`, `.toBeFalsy()` for boolean coercion

3. **Test Data**:
   - Use realistic but minimal data
   - Person IDs: `p001`, `p002`, etc.
   - Project IDs: `proj001`, `proj002`, etc.
   - FTE values: 0.0 to 1.0
   - Allocation percentages: 0 to 100

## Integration Testing

Integration tests verify that multiple modules work together correctly.

1. **Test real workflows**:
   - Database → View calculations
   - Multiple allocations → Report generation
   - Data validation → UI feedback

2. **Common patterns**:
   ```javascript
   it('should calculate monthly allocations correctly', async () => {
     // Setup: Add test data
     await db.addPerson('Alice', 1.0);
     await db.addProject('Project A', 12);
     await db.addAllocation('p001', 'proj001', 50, '2024-01', '2024-06');
     
     // Execute: Run calculation
     const result = await calculateMonthlyAllocations('2024-01');
     
     // Verify: Check results
     expect(result.personAllocations['p001']).toBe(0.5);
   });
   ```

3. **Edge cases to test**:
   - Zero FTE persons
   - Missing end dates (ongoing allocations)
   - No allocations
   - Partial date ranges
   - Overlapping allocations
   - Invalid data

## Calculation Testing

This app has calculation-heavy logic. When testing calculations:

1. **Use precise values**:
   - For FTE and percentages, use exact decimal values
   - Use `.toBeCloseTo()` for floating-point comparisons if needed

2. **Test formulas**:
   - Person allocation = (FTE * allocation percentage) / 100
   - Project totals = sum of all allocations
   - Delta = actual - planned

3. **Validate edge cases**:
   - Zero values
   - Boundary conditions (0%, 100%)
   - Negative deltas (over-allocation)

## Module System

1. **ES6 Modules**:
   - Use `import` for dependencies
   - Tests can import directly from source: `import * as db from '../../js/data/database.js'`
   - No build step required

2. **Module paths**:
   - Relative paths from test file to source
   - Unit tests: `../../js/` 
   - Integration tests: `../../js/`

## Performance

- Tests should run fast (< 1 second per test typically)
- Use `beforeEach` for setup, not `beforeAll` (ensures isolation)
- Avoid unnecessary async operations
- Focus on testing behavior, not implementation details

## Coverage

- Aim for high code coverage of critical paths
- Database CRUD operations should be fully tested
- Calculation logic should be thoroughly tested
- Helper utilities should be tested with edge cases
- Don't test framework code or third-party libraries
