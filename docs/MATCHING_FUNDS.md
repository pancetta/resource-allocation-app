# Matching Funds and Base Funding Deductions

## Overview

This document explains how the matching funds feature works in the resource allocation app, specifically how allocations to projects with matching funds are deducted from base funding.

## What are Matching Funds?

Matching funds are external funding sources (grants, contracts, etc.) that require institutional cost-sharing or matching contributions. When staff work on these projects, their time is charged both to:
1. The matching funds project itself
2. The corresponding institutional base funding pool

## How It Works

### Setup

1. **Base Funding Projects**: Create base funding projects for each funding type (210, 220, 230, etc.)
   - Navigate to Projects tab
   - Click "Add Base Funding"
   - Specify the type (210, 220, etc.) and planned person-months

2. **Matching Funds Projects**: When creating a regular project that requires matching:
   - Create the project normally
   - Check the "Matching funds" checkbox (only available when creating new projects)
   - The system will ask which base funding type to deduct from

3. **People**: Assign each person a type (210, 220, 230, etc.) that indicates their funding source

### Allocation and Deduction Logic

When you allocate a person to a matching funds project:

1. **Project Allocation**: The allocation appears in the matching funds project's "Allocated PM" column
2. **Base Funding Deduction**: The allocation is ALSO deducted from the corresponding base funding
   - **Only if** the person's type matches the base funding type linked to the project
   - Example: If Alice (type 210) is allocated 0.5 PM to "Project A" (matching funds, linked to type 210), then:
     - Project A shows 0.5 PM allocated
     - Base Funding 210 shows 0.5 PM deducted

### Reports

All three main reports show base funding deductions:

#### Monthly Report
- Shows person allocations across all projects
- Shows project allocations and planned vs actual
- **Base Funding Summary table** shows:
  - Planned PM (from budget values)
  - Deductions (sum of matching funds allocations for that month)
  - Net Available (Planned - Deductions)
  - Status (OK if net ≥ 0, Over-allocated if net < 0)

#### Yearly Report
- Shows person and project allocations across 12 months
- **Base Funding Summary table** shows:
  - Planned PM (sum of 12 months)
  - Deductions (sum of matching funds allocations for the year)
  - Net Available (Planned - Deductions)
  - Status

#### Project Overview
- Shows project allocations across 12 months
- **Base Funding Summary table** shows yearly totals (same as yearly report)

## Example Scenario

### Setup:
- Base Funding 210: 10 PM/month planned (120 PM/year)
- Project A: Matching funds project, linked to type 210
- Alice: Type 210 person, 1.0 FTE
- Allocation: Alice allocated 0.5 PM to Project A for full year

### Monthly Report (June 2024):
```
Projects Table:
- Base Funding 210: Allocated 0.00 PM, Planned 10.00 PM, Delta -10.00
- Project A: Allocated 0.50 PM, Planned 0.00 PM, Delta 0.50

Base Funding Summary:
- Base Funding 210: Planned 10.00, Deductions 0.50, Net 9.50, Status ✓ OK
```

### Yearly Report (2024):
```
Base Funding Summary:
- Base Funding 210: Planned 120.00, Deductions 6.00, Net 114.00, Status ✓ OK
  (6.00 = 0.50 PM/month × 12 months)
```

## Important Rules

1. **Person Type Matching**: Only allocations from people whose type matches the base funding type are deducted
   - Alice (type 210) allocated to Project A (links to 210) → deducts from Base Funding 210 ✓
   - Bob (type 220) allocated to Project A (links to 210) → does NOT deduct from Base Funding 210 ✗

2. **Matching Funds Flag**: The `deductsFromBaseFunding` flag can only be set when creating a new project
   - Once set, it becomes read-only to prevent accidental changes
   - This ensures data integrity and prevents retroactive changes to base funding calculations

3. **Base Funding Type Link**: The `baseFundingTypeId` field must match an existing base funding type
   - Valid types: 210, 220, 230, 240, 250 (or whatever types you've configured)

## Testing

The feature is comprehensively tested at multiple levels:

1. **Unit Tests**: `tests/integration/baseFundingCalculations.test.js`
   - Tests the `calculateBaseFundingDeductions` function
   - Tests the `calculateNetBaseFunding` function

2. **Integration Tests**:
   - `tests/integration/yearlyBaseFundingDeductions.test.js` - Yearly report
   - `tests/integration/monthlyReportMatchingFunds.test.js` - Monthly report

3. **E2E Tests**: `tests/e2e/yearlyBaseFundingReport.spec.js`
   - Tests the full user workflow from UI

## Troubleshooting

### Deductions not showing up?
1. Verify the project has `deductsFromBaseFunding` = true
2. Verify the project has `baseFundingTypeId` set to a valid type
3. Verify the person's type matches the base funding type
4. Check that the allocation dates overlap with the report period

### Over-allocated base funding?
If the Base Funding Summary shows "⚠ Over-allocated":
- Total deductions exceed planned base funding for that type
- Review matching funds allocations for that type
- Consider increasing base funding budget or reducing matching funds allocations

## Code Reference

### Key Functions:
- `calculateBaseFundingDeductions()` in `js/helpers/allocationHelper.js`
- `calculateNetBaseFunding()` in `js/helpers/allocationHelper.js`

### Data Model:
- Project fields:
  - `deductsFromBaseFunding`: Boolean flag
  - `baseFundingTypeId`: String (e.g., "210", "220")
  - `isBaseFunding`: Boolean (identifies base funding projects)
  - `baseFundingType`: String (only for base funding projects)

- Person fields:
  - `type`: String (e.g., "210", "220")

## Conclusion

The matching funds feature ensures accurate tracking of institutional cost-sharing by automatically deducting matching funds allocations from the appropriate base funding pools. This provides visibility into how base funding is being consumed and helps prevent over-allocation.
