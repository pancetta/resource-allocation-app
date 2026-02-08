# User Feedback Examples for Allocation Validation

## Example 1: Person Overallocation Warning

### Scenario
- **Person**: Alice Smith (FTE = 1.0)
- **Existing Allocations**: 0.6 PM on Project A
- **Attempting to Add**: 0.5 PM on Project B (would total 1.1 PM)

### User Sees This Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ OVERALLOCATION WARNING for Alice Smith                     │
│                                                                 │
│  Person would be overallocated in 12 month(s): 2025-01,        │
│  2025-02, 2025-03, and 9 more.                                 │
│                                                                 │
│  For example, in 2025-01:                                      │
│    FTE=1.00                                                    │
│    existing=0.60 PM                                            │
│    new allocation=0.50 PM                                      │
│    would exceed FTE by 0.10 PM.                                │
│                                                                 │
│  Do you want to proceed anyway?                                │
│  This may cause resource conflicts.                            │
│                                                                 │
│                    [OK]        [Cancel]                        │
└─────────────────────────────────────────────────────────────────┘
```

### User Actions
- **Click OK**: Allocation is added despite overallocation (intentional override)
- **Click Cancel**: Allocation is not added, form remains for editing

---

## Example 2: Project Budget Overallocation Warning

### Scenario
- **Project**: Website Redesign (Planned PM = 5.0)
- **Existing Allocations**: Alice (2.0 PM) + Bob (1.5 PM) = 3.5 PM
- **Attempting to Add**: Carol (2.0 PM) would total 5.5 PM

### User Sees This Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ OVERALLOCATION WARNING for Website Redesign                │
│                                                                 │
│  Project would be overallocated in 6 month(s): 2025-03,        │
│  2025-04, 2025-05, and 3 more.                                 │
│                                                                 │
│  For example, in 2025-03:                                      │
│    Planned=5.00 PM                                             │
│    existing=3.50 PM                                            │
│    new allocation=2.00 PM                                      │
│    would exceed budget by 0.50 PM.                             │
│                                                                 │
│  Do you want to proceed anyway?                                │
│  This may cause budget overruns.                               │
│                                                                 │
│                    [OK]        [Cancel]                        │
└─────────────────────────────────────────────────────────────────┘
```

### User Actions
- **Click OK**: Allocation is added (user acknowledges budget overrun)
- **Click Cancel**: Allocation is not added

---

## Example 3: Time-Based FTE Change Warning

### Scenario
- **Person**: David Lee
- **FTE**: 1.0 (Jan-Feb), then 0.5 (Mar onwards)
- **Attempting to Add**: 0.8 PM for Jan-Jun

### User Sees This Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ OVERALLOCATION WARNING for David Lee                       │
│                                                                 │
│  Person would be overallocated in 4 month(s): 2025-03,         │
│  2025-04, 2025-05, 2025-06.                                    │
│                                                                 │
│  For example, in 2025-03:                                      │
│    FTE=0.50                                                    │
│    existing=0.00 PM                                            │
│    new allocation=0.80 PM                                      │
│    would exceed FTE by 0.30 PM.                                │
│                                                                 │
│  Do you want to proceed anyway?                                │
│  This may cause resource conflicts.                            │
│                                                                 │
│                    [OK]        [Cancel]                        │
└─────────────────────────────────────────────────────────────────┘
```

### Key Feature
Notice how the warning only appears for March onwards, where the FTE drops to 0.5. The allocation is fine for Jan-Feb (FTE=1.0).

---

## Example 4: Update Existing Allocation

### Scenario
- **Existing**: Alice has 0.8 PM allocation
- **User Action**: Changes PM to 1.5 via inline edit
- **Validation**: Triggered on blur event

### User Sees This Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ OVERALLOCATION WARNING for Alice Smith                     │
│                                                                 │
│  Person would be overallocated in 12 month(s): 2025-01,        │
│  2025-02, 2025-03, and 9 more.                                 │
│                                                                 │
│  For example, in 2025-01:                                      │
│    FTE=1.00                                                    │
│    existing=0.00 PM                                            │
│    new allocation=1.50 PM                                      │
│    would exceed FTE by 0.50 PM.                                │
│                                                                 │
│  Do you want to proceed anyway?                                │
│  This may cause resource conflicts.                            │
│                                                                 │
│                    [OK]        [Cancel]                        │
└─────────────────────────────────────────────────────────────────┘
```

### User Actions
- **Click OK**: Value updates to 1.5
- **Click Cancel**: Value reverts to 0.8 (original value)

---

## Example 5: No Budget (Flexible Project)

### Scenario
- **Project**: Research & Development (No budget set, plannedPM = 0)
- **Attempting to Add**: Any allocation amount

### User Experience
```
✓ No warning shown - projects without budgets allow any allocation
```

This allows flexibility for projects where budget tracking isn't relevant.

---

## Summary of User Feedback Features

### ✅ What Makes Good Feedback

1. **Clear Subject**: "OVERALLOCATION WARNING for [Name]"
2. **Specific Numbers**: Shows exact values, not just "too much"
3. **Scope**: "X month(s)" tells user how widespread the problem is
4. **Example**: Concrete example with one month's numbers
5. **Consequence**: "may cause resource conflicts" or "budget overruns"
6. **Choice**: User can proceed or cancel

### 🎯 Design Principles

- **Visual**: ⚠️ emoji for immediate recognition
- **Informative**: All relevant numbers shown
- **Actionable**: Clear next steps (OK/Cancel)
- **Contextual**: Different messages for person vs project
- **Non-blocking**: User can override if intentional

### 📊 Information Hierarchy

1. **Who**: Person or Project name
2. **Scale**: How many months affected
3. **Example**: One specific month with all values
4. **Impact**: What could go wrong
5. **Decision**: Proceed or cancel

This approach ensures users have all the information they need to make informed decisions about their allocations!
