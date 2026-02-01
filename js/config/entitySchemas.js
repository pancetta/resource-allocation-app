/**
 * Entity Schema Configuration
 * 
 * This file defines the schema for entities (people, projects) including:
 * - Field definitions (name, type, validation)
 * - UI rendering (input type, dropdown options)
 * - Validation rules
 * 
 * This makes it easy to add new attributes without modifying core code.
 */

/**
 * Field types supported:
 * - text: Text input
 * - number: Number input
 * - checkbox: Checkbox input
 * - select: Dropdown select with predefined options
 */

/**
 * Schema for People entity
 * Defines all fields that a person can have
 */
export const peopleSchema = {
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
        },
        {
            key: 'active',
            label: 'Active',
            type: 'checkbox',
            required: false,
            editable: true,
            showInTable: true,
            order: 3,
            defaultValue: true
        }
    ],
    // Default values for new person
    getDefaults: () => ({
        name: '',
        type: '210',
        active: true
    })
};

/**
 * Schema for Projects entity
 * Defines all fields that a project can have
 */
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
        }
    ],
    // Default values for new project
    getDefaults: () => ({
        name: ''
    })
};

/**
 * Validate an entity against its schema
 * @param {Object} entity - Entity to validate
 * @param {Object} schema - Schema definition
 * @returns {{valid: boolean, errors: Array}} Validation result
 */
export function validateEntity(entity, schema) {
    const errors = [];
    
    schema.fields.forEach(field => {
        const value = entity[field.key];
        
        // Check required fields
        if (field.required && (value === undefined || value === null || value === '')) {
            errors.push({ field: field.key, message: `${field.label} is required` });
        }
        
        // Run custom validation if present
        if (field.validate && value !== undefined && value !== null && value !== '') {
            const result = field.validate(value);
            if (!result.valid) {
                errors.push({ field: field.key, message: result.message });
            }
        }
    });
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Get table headers from schema
 * @param {Object} schema - Schema definition
 * @returns {Array<string>} Array of header labels
 */
export function getTableHeaders(schema) {
    return schema.fields
        .filter(f => f.showInTable)
        .sort((a, b) => a.order - b.order)
        .map(f => f.label);
}

/**
 * Get editable fields from schema
 * @param {Object} schema - Schema definition
 * @returns {Array} Array of editable field definitions
 */
export function getEditableFields(schema) {
    return schema.fields
        .filter(f => f.editable)
        .sort((a, b) => a.order - b.order);
}
