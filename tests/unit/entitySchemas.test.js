import { describe, it, expect } from 'vitest';
import { 
    peopleSchema, 
    projectsSchema, 
    validateEntity, 
    getTableHeaders, 
    getEditableFields 
} from '../../js/config/entitySchemas.js';

describe('Entity Schemas', () => {
    describe('peopleSchema', () => {
        it('should have correct default values', () => {
            const defaults = peopleSchema.getDefaults();
            expect(defaults).toEqual({
                name: '',
                type: '210',
                active: true
            });
        });

        it('should have name, type, and active fields', () => {
            const fieldKeys = peopleSchema.fields.map(f => f.key);
            expect(fieldKeys).toContain('name');
            expect(fieldKeys).toContain('type');
            expect(fieldKeys).toContain('active');
        });

        it('should have type field with dropdown options', () => {
            const typeField = peopleSchema.fields.find(f => f.key === 'type');
            expect(typeField.type).toBe('select');
            expect(typeField.options).toHaveLength(5);
            expect(typeField.options.map(o => o.value)).toEqual(['210', '220', '230', '240', '250']);
        });

        it('should validate type field correctly', () => {
            const typeField = peopleSchema.fields.find(f => f.key === 'type');
            
            // Valid values
            expect(typeField.validate('210').valid).toBe(true);
            expect(typeField.validate('220').valid).toBe(true);
            expect(typeField.validate('230').valid).toBe(true);
            expect(typeField.validate('240').valid).toBe(true);
            expect(typeField.validate('250').valid).toBe(true);
            
            // Invalid values
            expect(typeField.validate('100').valid).toBe(false);
            expect(typeField.validate('260').valid).toBe(false);
            expect(typeField.validate('').valid).toBe(false);
        });
    });

    describe('projectsSchema', () => {
        it('should have correct default values', () => {
            const defaults = projectsSchema.getDefaults();
            expect(defaults).toEqual({
                name: '',
                isBaseFunding: false,
                baseFundingType: null,
                deductsFromBaseFunding: false,
                baseFundingTypeId: null
            });
        });

        it('should have name field', () => {
            const fieldKeys = projectsSchema.fields.map(f => f.key);
            expect(fieldKeys).toContain('name');
        });
        
        it('should have base funding fields', () => {
            const fieldKeys = projectsSchema.fields.map(f => f.key);
            expect(fieldKeys).toContain('isBaseFunding');
            expect(fieldKeys).toContain('baseFundingType');
            expect(fieldKeys).toContain('deductsFromBaseFunding');
            expect(fieldKeys).toContain('baseFundingTypeId');
        });
    });

    describe('validateEntity', () => {
        it('should validate valid person entity', () => {
            const person = {
                name: 'John Doe',
                type: '210',
                active: true
            };
            
            const result = validateEntity(person, peopleSchema);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject person with invalid type', () => {
            const person = {
                name: 'John Doe',
                type: '999',
                active: true
            };
            
            const result = validateEntity(person, peopleSchema);
            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].field).toBe('type');
        });

        it('should reject person with missing required field', () => {
            const person = {
                type: '210',
                active: true
            };
            
            const result = validateEntity(person, peopleSchema);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'name')).toBe(true);
        });

        it('should accept person with all valid fields', () => {
            const person = {
                name: 'Jane Smith',
                type: '230',
                active: false
            };
            
            const result = validateEntity(person, peopleSchema);
            expect(result.valid).toBe(true);
        });
    });

    describe('getTableHeaders', () => {
        it('should return headers from people schema', () => {
            const headers = getTableHeaders(peopleSchema);
            expect(headers).toEqual(['Name', 'Type', 'Active']);
        });

        it('should return headers from projects schema', () => {
            const headers = getTableHeaders(projectsSchema);
            expect(headers).toEqual(['Name', 'Base Funding', 'BF Type', 'Deducts from BF']);
        });

        it('should order headers by order field', () => {
            const headers = getTableHeaders(peopleSchema);
            // Verify order is maintained (name=1, type=2, active=3)
            expect(headers[0]).toBe('Name');
            expect(headers[1]).toBe('Type');
            expect(headers[2]).toBe('Active');
        });
    });

    describe('getEditableFields', () => {
        it('should return editable fields from people schema', () => {
            const fields = getEditableFields(peopleSchema);
            expect(fields).toHaveLength(3);
            expect(fields.map(f => f.key)).toEqual(['name', 'type', 'active']);
        });

        it('should return editable fields from projects schema', () => {
            const fields = getEditableFields(projectsSchema);
            expect(fields).toHaveLength(1);
            expect(fields[0].key).toBe('name');
        });

        it('should order fields by order property', () => {
            const fields = getEditableFields(peopleSchema);
            expect(fields[0].key).toBe('name');
            expect(fields[1].key).toBe('type');
            expect(fields[2].key).toBe('active');
        });
    });
});
