# Extensibility Guide

## Overview

The Resource Allocation App now supports extensible entity schemas, making it easy to add custom attributes to people and projects without modifying core code.

## Schema Configuration

Entity schemas are defined in `/js/config/entitySchemas.js`. This file contains:

- Field definitions (name, type, validation)
- UI rendering instructions (input type, dropdown options)
- Validation rules
- Default values

## Adding New Fields to People

To add a new field to the People entity:

1. Open `/js/config/entitySchemas.js`
2. Add a new field object to `peopleSchema.fields`:

```javascript
{
    key: 'fieldName',          // Database field name
    label: 'Field Label',      // Display label in UI
    type: 'text',              // Field type: text, number, checkbox, select
    required: true,            // Whether field is required
    editable: true,            // Whether field can be edited
    showInTable: true,         // Show in table view
    order: 4,                  // Display order in table
    defaultValue: 'default',   // Default value for new records
    validate: (value) => {     // Optional validation function
        if (!value) {
            return { valid: false, message: 'Field is required' };
        }
        return { valid: true, message: '' };
    }
}
```

3. Update the `getDefaults()` function to include your new field:

```javascript
getDefaults: () => ({
    name: '',
    type: '210',
    active: true,
    yourNewField: 'default value'
})
```

4. Update the database version in `/js/data/database.js`:
   - Increment `DB_VERSION` constant
   - Add migration logic to set default values for existing records

## Field Types

### Text Field
```javascript
{
    key: 'description',
    label: 'Description',
    type: 'text',
    required: false,
    editable: true,
    showInTable: true,
    order: 5
}
```

### Number Field
```javascript
{
    key: 'age',
    label: 'Age',
    type: 'number',
    required: false,
    editable: true,
    showInTable: true,
    order: 6,
    validate: (value) => {
        if (value < 0 || value > 150) {
            return { valid: false, message: 'Age must be between 0 and 150' };
        }
        return { valid: true, message: '' };
    }
}
```

### Checkbox Field
```javascript
{
    key: 'certified',
    label: 'Certified',
    type: 'checkbox',
    required: false,
    editable: true,
    showInTable: true,
    order: 7,
    defaultValue: false
}
```

### Dropdown (Select) Field
```javascript
{
    key: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    editable: true,
    showInTable: true,
    order: 2,
    options: [
        { value: '210', label: '210' },
        { value: '220', label: '220' },
        { value: '230', label: '230' },
        { value: '240', label: '240' },
        { value: '250', label: '250' }
    ],
    defaultValue: '210',
    validate: (value) => {
        const validValues = ['210', '220', '230', '240', '250'];
        if (!validValues.includes(value)) {
            return { 
                valid: false, 
                message: `Type must be one of: ${validValues.join(', ')}` 
            };
        }
        return { valid: true, message: '' };
    }
}
```

## Adding New Fields to Projects

The same approach works for projects. Edit `projectsSchema` in `/js/config/entitySchemas.js`:

```javascript
export const projectsSchema = {
    fields: [
        {
            key: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            editable: true,
            showInTable: true,
            order: 1
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            editable: true,
            showInTable: true,
            order: 2,
            options: [
                { value: 'active', label: 'Active' },
                { value: 'on-hold', label: 'On Hold' },
                { value: 'completed', label: 'Completed' }
            ],
            defaultValue: 'active'
        }
    ],
    getDefaults: () => ({
        name: '',
        status: 'active'
    })
};
```

## Database Migration

When adding new fields, you must:

1. **Increment DB_VERSION** in `/js/data/database.js`
2. **Add migration logic** in the `onupgradeneeded` handler:

```javascript
// Version 6 migration - add new field to people
if (oldVersion < 6) {
    const peopleStore = transaction.objectStore("people");
    const peopleRequest = peopleStore.getAll();
    
    peopleRequest.onsuccess = () => {
        const people = peopleRequest.result;
        const defaults = peopleSchema.getDefaults();
        
        people.forEach(person => {
            // Add new field if it doesn't exist
            if (!person.yourNewField) {
                person.yourNewField = defaults.yourNewField;
                peopleStore.put(person);
            }
        });
    };
}
```

## Example: The Type Field

The "type" field for people was added as follows:

1. **Schema Definition** (`js/config/entitySchemas.js`):
```javascript
{
    key: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    editable: true,
    showInTable: true,
    order: 2,
    options: [
        { value: '210', label: '210' },
        { value: '220', label: '220' },
        { value: '230', label: '230' },
        { value: '240', label: '240' },
        { value: '250', label: '250' }
    ],
    defaultValue: '210',
    validate: (value) => {
        const validValues = ['210', '220', '230', '240', '250'];
        if (!validValues.includes(value)) {
            return { valid: false, message: `Type must be one of: ${validValues.join(', ')}` };
        }
        return { valid: true, message: '' };
    }
}
```

2. **Database Migration** (`js/data/database.js`):
```javascript
// Version 5 migration - add type field to people
if (oldVersion < 5) {
    const peopleStore = transaction.objectStore("people");
    const peopleRequest = peopleStore.getAll();
    
    peopleRequest.onsuccess = () => {
        const people = peopleRequest.result;
        const defaults = peopleSchema.getDefaults();
        
        people.forEach(person => {
            if (!person.type) {
                person.type = defaults.type;
                peopleStore.put(person);
            }
        });
    };
}
```

3. **No changes needed** in UI code - it automatically renders based on schema!

## Testing

When adding new fields:

1. **Update unit tests** to include the new field in test data
2. **Add schema validation tests** in `tests/unit/entitySchemas.test.js`
3. **Add E2E tests** to verify UI rendering and interaction
4. **Test data migration** by using data exported before the change

## Benefits

- **Centralized configuration**: All field definitions in one place
- **Automatic UI rendering**: No need to modify view code
- **Consistent validation**: Validation rules defined with field
- **Easy maintenance**: Adding fields doesn't require touching multiple files
- **Type safety**: Schema provides clear contract for data structure

## Future Enhancements

Potential improvements to the schema system:

- Support for more field types (date, time, rich text)
- Conditional field visibility
- Field dependencies (show field B only if field A has certain value)
- Custom rendering functions for complex fields
- Schema versioning and automatic migration
- Export schema to JSON for external tools
