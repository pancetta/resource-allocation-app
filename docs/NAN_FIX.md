# NaN Data Migration Fix

## Problem

Users were experiencing NaN (Not a Number) values in their database after importing old backup files. This occurred when:

1. A user had data from before version 5 of the database schema
2. The data was exported with allocations using the old `pct` (percentage) format
3. The data was imported into a newer version expecting `pm` (person-months) format
4. Calculations that used `allocation.pm` would get `undefined`, resulting in NaN values

## Root Cause

The database migration from version 4 to 5 converted allocations from percentage-based (`pct`) to person-month-based (`pm`) format. This migration only occurred during database upgrade, not during data import. When users imported old backup files:

1. Allocations still had `pct` field instead of `pm` field
2. Code expecting `pm` would get `undefined`
3. Mathematical operations like `sum + allocation.pm` would result in `NaN`

Example problematic allocation from exported data:
```json
{
  "personId": "p001",
  "projectId": "proj001",
  "pct": 0.9,          // Old format: percentage
  "startMonth": "2025-01",
  "endMonth": null,
  "id": 1
}
```

Expected format:
```json
{
  "personId": "p001",
  "projectId": "proj001",
  "pm": 0.9,           // New format: person-months (pct * fte)
  "startMonth": "2025-01",
  "endMonth": null,
  "id": 1
}
```

## Solution

Added automatic migration during data import to convert old format to new format:

### 1. Import-Time Conversion (`database.js`)

Two helper functions were added:

**`convertAllocationToPm(allocation, fteValues)`**
- Checks if allocation already has `pm` field (returns as-is)
- If it has `pct` field, converts it: `pm = pct * fte`
- Finds the effective FTE for the person at the allocation start date
- Removes the old `pct` field
- Defaults to `pm: 0` if neither field exists

**`convertOverrideToPm(override, fteValues, allocations)`**
- Similar logic for allocation overrides
- Looks up the allocation to find the person ID
- Converts `pct` to `pm` using effective FTE

### 2. Import Order Changes

The import process was reorganized:
1. Import people
2. Import projects
3. **Import FTE values FIRST** (needed for conversion)
4. Import budget values
5. Import allocations (with conversion)
6. Import allocation overrides (with conversion)

### 3. NaN Protection (`allocationHelper.js`)

Added safeguards in calculation code:
```javascript
// Before
return sum + pm;

// After
const safePm = (pm !== undefined && pm !== null && !isNaN(pm)) ? pm : 0;
return sum + safePm;
```

This ensures that even if a value slips through, it won't cause NaN in calculations.

## Testing

Added comprehensive tests in `tests/unit/database.test.js`:

1. **Convert old pct format** - Verifies `pct` is converted to `pm` during import
2. **Handle different FTE values** - Verifies conversion uses correct FTE (e.g., pct=0.8, fte=0.5 → pm=0.4)
3. **Preserve pm format** - Verifies new format data is not modified
4. **Handle malformed data** - Verifies missing fields default to 0 instead of causing NaN

All tests pass successfully:
- ✓ 585 unit/integration tests pass
- ✓ 36 E2E tests pass

## Prevention Measures

1. **Import-time validation** - All imports now convert old format automatically
2. **NaN safeguards** - Calculation code protects against undefined/NaN values
3. **Comprehensive tests** - Prevent regression of this issue
4. **Updated documentation** - JSDoc comments now correctly reflect `pm` format

## User Impact

Users can now:
- ✅ Import old backup files without NaN issues
- ✅ Safely restore data from any version
- ✅ Mix old and new format data in imports
- ✅ Get automatic conversion without manual intervention

## Migration Path

For users currently experiencing NaN values:

1. **Export your data** - Go to Data Management tab, click "Export Data"
2. **The fix will automatically apply** when you import the data back
3. **No manual intervention needed** - The conversion happens transparently

## Technical Details

### Conversion Formula

```javascript
pm = pct * effectiveFTE

Where:
- pct: allocation percentage (0-1 range, e.g., 0.5 = 50%)
- effectiveFTE: person's FTE at allocation start date
- pm: person-months allocated
```

### Example Calculations

| Person FTE | Allocation % (pct) | Person-Months (pm) |
|------------|-------------------|-------------------|
| 1.0        | 0.5 (50%)         | 0.5              |
| 0.5        | 0.8 (80%)         | 0.4              |
| 1.0        | 0.9 (90%)         | 0.9              |

### Files Modified

1. `js/data/database.js` - Added conversion functions and updated import logic
2. `js/helpers/allocationHelper.js` - Added NaN safeguards
3. `tests/unit/database.test.js` - Added migration tests
4. `js/bundle.js` - Rebuilt with fixes

## Related Issues

- Database version 5 migration (initial pct → pm conversion)
- FTE values migration (version 4)
- Export/import functionality
