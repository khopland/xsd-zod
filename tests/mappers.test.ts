import { describe, it, expect } from 'vitest';
import { mapPrimitiveType, applyFacets, mapEnumeration } from '../src/mappers/primitive';
import { mapComplexType, mapElement, mapAttribute } from '../src/mappers/complex';
import type { XsdSchema } from '../src/parser';

describe('Primitive Type Mapper', () => {
  it('should map xs:string to string and z.string()', () => {
    const result = mapPrimitiveType('xs:string');
    expect(result.tsType).toBe('string');
    expect(result.zodValidator).toBe('z.string()');
  });

  it('should map xs:int to number and z.number().int()', () => {
    const result = mapPrimitiveType('xs:int');
    expect(result.tsType).toBe('number');
    expect(result.zodValidator).toBe('z.number().int()');
  });

  it('should map xs:boolean to boolean and z.boolean()', () => {
    const result = mapPrimitiveType('xs:boolean');
    expect(result.tsType).toBe('boolean');
    expect(result.zodValidator).toBe('z.boolean()');
  });

  it('should map xs:dateTime to string and z.string().datetime()', () => {
    const result = mapPrimitiveType('xs:dateTime');
    expect(result.tsType).toBe('string');
    expect(result.zodValidator).toBe('z.string().datetime()');
  });

  it('should map xs:anyURI to string and z.string().url()', () => {
    const result = mapPrimitiveType('xs:anyURI');
    expect(result.tsType).toBe('string');
    expect(result.zodValidator).toBe('z.string().url()');
  });

  it('should map xs:decimal to number and z.number()', () => {
    const result = mapPrimitiveType('xs:decimal');
    expect(result.tsType).toBe('number');
    expect(result.zodValidator).toBe('z.number()');
  });

  it('should map xs:positiveInteger to number and z.number().int().positive()', () => {
    const result = mapPrimitiveType('xs:positiveInteger');
    expect(result.tsType).toBe('number');
    expect(result.zodValidator).toBe('z.number().int().positive()');
  });

  it('should map xs:anyType to any and z.any()', () => {
    const result = mapPrimitiveType('xs:anyType');
    expect(result.tsType).toBe('any');
    expect(result.zodValidator).toBe('z.any()');
  });

  it('should handle type without xs: prefix', () => {
    const result = mapPrimitiveType('string');
    expect(result.tsType).toBe('string');
    expect(result.zodValidator).toBe('z.string()');
  });

  it('should return any for unknown types', () => {
    const result = mapPrimitiveType('unknown:type');
    expect(result.tsType).toBe('any');
    expect(result.zodValidator).toBe('z.any()');
  });
});

describe('Type Facets', () => {
  it('should apply minLength facet', () => {
    const base = mapPrimitiveType('xs:string');
    const result = applyFacets(base, { base: 'xs:string', minLength: 5 }, 'camel');
    expect(result.zodValidator).toContain('.min(5)');
  });

  it('should apply maxLength facet', () => {
    const base = mapPrimitiveType('xs:string');
    const result = applyFacets(base, { base: 'xs:string', maxLength: 255 }, 'camel');
    expect(result.zodValidator).toContain('.max(255)');
  });

  it('should apply length facet', () => {
    const base = mapPrimitiveType('xs:string');
    const result = applyFacets(base, { base: 'xs:string', length: 10 }, 'camel');
    expect(result.zodValidator).toContain('.length(10)');
  });

  it('should apply pattern facet', () => {
    const base = mapPrimitiveType('xs:string');
    const result = applyFacets(base, { base: 'xs:string', pattern: '[a-z]+' }, 'camel');
    expect(result.zodValidator).toContain('.regex(/[a-z]+/)');
  });

  it('should escape backslashes in pattern', () => {
    const base = mapPrimitiveType('xs:string');
    const result = applyFacets(base, { base: 'xs:string', pattern: '\\d+' }, 'camel');
    expect(result.zodValidator).toContain('.regex(/\\\\d+/)');
  });

  it('should apply minInclusive facet', () => {
    const base = mapPrimitiveType('xs:int');
    const result = applyFacets(base, { base: 'xs:int', minInclusive: 0 }, 'camel');
    expect(result.zodValidator).toContain('.min(0)');
  });

  it('should apply maxInclusive facet', () => {
    const base = mapPrimitiveType('xs:int');
    const result = applyFacets(base, { base: 'xs:int', maxInclusive: 100 }, 'camel');
    expect(result.zodValidator).toContain('.max(100)');
  });

  it('should apply minExclusive facet', () => {
    const base = mapPrimitiveType('xs:int');
    const result = applyFacets(base, { base: 'xs:int', minExclusive: 0 }, 'camel');
    expect(result.zodValidator).toContain('.gt(0)');
  });

  it('should apply maxExclusive facet', () => {
    const base = mapPrimitiveType('xs:int');
    const result = applyFacets(base, { base: 'xs:int', maxExclusive: 100 }, 'camel');
    expect(result.zodValidator).toContain('.lt(100)');
  });

  it('should apply multiple facets', () => {
    const base = mapPrimitiveType('xs:string');
    const result = applyFacets(base, {
      base: 'xs:string',
      minLength: 5,
      maxLength: 255,
      pattern: '[a-z]+'
    }, 'camel');
    expect(result.zodValidator).toContain('.min(5)');
    expect(result.zodValidator).toContain('.max(255)');
    expect(result.zodValidator).toContain('.regex(/[a-z]+/)');
  });
});

describe('Enumeration Mapper', () => {
  it('should map simple type with enumeration', () => {
    const simpleType = {
      name: 'Status',
      restriction: {
        base: 'xs:string',
        enumerations: ['active', 'inactive', 'pending']
      }
    };

    const result = mapEnumeration(simpleType, 'camel');

    expect(result.tsType).toBe("'active' | 'inactive' | 'pending'");
    expect(result.zodValidator).toBe("z.enum(['active', 'inactive', 'pending'])");
  });

  it('should handle single value enumeration', () => {
    const simpleType = {
      name: 'SingleEnum',
      restriction: {
        base: 'xs:string',
        enumerations: ['only']
      }
    };

    const result = mapEnumeration(simpleType, 'camel');

    expect(result.tsType).toBe("'only'");
    expect(result.zodValidator).toBe("z.enum(['only'])");
  });
});

describe('Complex Type Mapper', () => {
  const mockSchema: XsdSchema = {
    complexTypes: [],
    simpleTypes: [],
    elements: []
  };

  it('should map complex type with elements', () => {
    const complexType = {
      name: 'User',
      content: [
        {
          name: 'firstName',
          type: 'xs:string',
          minOccurs: 1,
          maxOccurs: 1,
          attributes: []
        },
        {
          name: 'lastName',
          type: 'xs:string',
          minOccurs: 1,
          maxOccurs: 1,
          attributes: []
        }
      ],
      attributes: []
    };

    const result = mapComplexType(complexType, 'camel', mockSchema);

    expect(result.typeName).toBe('User');
    expect(result.schemaName).toBe('UserSchema');
    expect(result.tsInterface).toContain('firstName: string');
    expect(result.tsInterface).toContain('lastName: string');
    expect(result.zodObject).toContain('firstName: z.string()');
    expect(result.zodObject).toContain('lastName: z.string()');
  });

  it('should map complex type with attributes', () => {
    const complexType = {
      name: 'User',
      content: [],
      attributes: [
        {
          name: 'id',
          type: 'xs:string',
          use: 'required' as const
        },
        {
          name: 'active',
          type: 'xs:boolean',
          use: 'optional' as const
        }
      ]
    };

    const result = mapComplexType(complexType, 'camel', mockSchema);

    expect(result.tsInterface).toContain('id: string');
    expect(result.tsInterface).toContain('active?: boolean');
    expect(result.zodObject).toContain('id: z.string()');
    expect(result.zodObject).toContain('active: z.boolean().optional()');
  });

  it('should map element with optional minOccurs', () => {
    const element = {
      name: 'middleName',
      type: 'xs:string',
      minOccurs: 0,
      maxOccurs: 1,
      attributes: []
    };

    const result = mapElement(element, 'camel', mockSchema);

    expect(result.optional).toBe(true);
  });

  it('should map element with array maxOccurs', () => {
    const element = {
      name: 'items',
      type: 'xs:string',
      minOccurs: 0,
      maxOccurs: 'unbounded' as const,
      attributes: []
    };

    const result = mapElement(element, 'camel', mockSchema);

    expect(result.isArray).toBe(true);
    expect(result.tsType).toBe('string[]');
    expect(result.zodValidator).toContain('z.array(');
  });

  it('should map element with complex type', () => {
    const element = {
      name: 'address',
      complexType: {
        name: 'AddressType',
        content: [
          {
            name: 'street',
            type: 'xs:string',
            attributes: []
          }
        ],
        attributes: []
      },
      attributes: []
    };

    const result = mapElement(element, 'camel', mockSchema);

    expect(result.tsType).toBe('AddressType');
    expect(result.zodValidator).toBe('AddressTypeSchema');
  });

  it('should map attribute with use required', () => {
    const attribute = {
      name: 'id',
      type: 'xs:string',
      use: 'required' as const
    };

    const result = mapAttribute(attribute, 'camel', mockSchema);

    expect(result.optional).toBe(false);
  });

  it('should map attribute with use optional', () => {
    const attribute = {
      name: 'id',
      type: 'xs:string',
      use: 'optional' as const
    };

    const result = mapAttribute(attribute, 'camel', mockSchema);

    expect(result.optional).toBe(true);
  });

  it('should apply naming convention to element', () => {
    const element = {
      name: 'first_name',
      type: 'xs:string',
      minOccurs: 1,
      maxOccurs: 1,
      attributes: []
    };

    const camelResult = mapElement(element, 'camel', mockSchema);
    expect(camelResult.name).toBe('firstName');

    const pascalResult = mapElement(element, 'pascal', mockSchema);
    expect(pascalResult.name).toBe('FirstName');

    const originalResult = mapElement(element, 'original', mockSchema);
    expect(originalResult.name).toBe('first_name');
  });
});

describe('Array Occurrence Handling', () => {
  const mockSchema: XsdSchema = {
    complexTypes: [],
    simpleTypes: [],
    elements: []
  };

  it('should treat maxOccurs > 1 as array', () => {
    const element = {
      name: 'items',
      type: 'xs:string',
      minOccurs: 1,
      maxOccurs: 5,
      attributes: []
    };

    const result = mapElement(element, 'camel', mockSchema);

    expect(result.isArray).toBe(true);
    expect(result.tsType).toBe('string[]');
    expect(result.zodValidator).toContain('z.array(');
  });

  it('should treat maxOccurs unbounded as array', () => {
    const element = {
      name: 'items',
      type: 'xs:string',
      minOccurs: 1,
      maxOccurs: 'unbounded' as const,
      attributes: []
    };

    const result = mapElement(element, 'camel', mockSchema);

    expect(result.isArray).toBe(true);
    expect(result.tsType).toBe('string[]');
    expect(result.zodValidator).toContain('z.array(');
  });

  it('should treat maxOccurs 1 as single element', () => {
    const element = {
      name: 'item',
      type: 'xs:string',
      minOccurs: 1,
      maxOccurs: 1,
      attributes: []
    };

    const result = mapElement(element, 'camel', mockSchema);

    expect(result.isArray).toBe(false);
    expect(result.tsType).toBe('string');
    expect(result.zodValidator).not.toContain('z.array(');
  });

  it('should treat undefined maxOccurs as single element', () => {
    const element = {
      name: 'item',
      type: 'xs:string',
      minOccurs: 1,
      attributes: []
    };

    const result = mapElement(element, 'camel', mockSchema);

    expect(result.isArray).toBe(false);
    expect(result.tsType).toBe('string');
    expect(result.zodValidator).not.toContain('z.array(');
  });

  it('should handle optional array (minOccurs 0, maxOccurs unbounded)', () => {
    const element = {
      name: 'items',
      type: 'xs:string',
      minOccurs: 0,
      maxOccurs: 'unbounded' as const,
      attributes: []
    };

    const result = mapElement(element, 'camel', mockSchema);

    expect(result.isArray).toBe(true);
    expect(result.optional).toBe(true);
    expect(result.tsType).toBe('string[]');
  });
});

describe('Additional Primitive Types', () => {
  it('should map xs:date', () => {
    const result = mapPrimitiveType('xs:date');
    expect(result.tsType).toBe('string');
    expect(result.zodValidator).toBe('z.string().date()');
  });

  it('should map xs:time', () => {
    const result = mapPrimitiveType('xs:time');
    expect(result.tsType).toBe('string');
    expect(result.zodValidator).toBe('z.string().time()');
  });

  it('should map xs:duration', () => {
    const result = mapPrimitiveType('xs:duration');
    expect(result.tsType).toBe('string');
    expect(result.zodValidator).toBe('z.string()');
  });

  it('should map xs:ID', () => {
    const result = mapPrimitiveType('xs:ID');
    expect(result.tsType).toBe('string');
    expect(result.zodValidator).toBe('z.string()');
  });

  it('should map xs:IDREF', () => {
    const result = mapPrimitiveType('xs:IDREF');
    expect(result.tsType).toBe('string');
    expect(result.zodValidator).toBe('z.string()');
  });

  it('should map xs:ENTITY', () => {
    const result = mapPrimitiveType('xs:ENTITY');
    expect(result.tsType).toBe('string');
    expect(result.zodValidator).toBe('z.string()');
  });

  it('should map xs:NMTOKEN', () => {
    const result = mapPrimitiveType('xs:NMTOKEN');
    expect(result.tsType).toBe('string');
    expect(result.zodValidator).toBe('z.string()');
  });

  it('should map xs:unsignedInt', () => {
    const result = mapPrimitiveType('xs:unsignedInt');
    expect(result.tsType).toBe('number');
    expect(result.zodValidator).toBe('z.number().int().nonnegative()');
  });

  it('should map xs:unsignedLong', () => {
    const result = mapPrimitiveType('xs:unsignedLong');
    expect(result.tsType).toBe('number');
    expect(result.zodValidator).toBe('z.number().int().nonnegative()');
  });

  it('should map xs:nonNegativeInteger', () => {
    const result = mapPrimitiveType('xs:nonNegativeInteger');
    expect(result.tsType).toBe('number');
    expect(result.zodValidator).toBe('z.number().int().nonnegative()');
  });

  it('should map xs:negativeInteger', () => {
    const result = mapPrimitiveType('xs:negativeInteger');
    expect(result.tsType).toBe('number');
    expect(result.zodValidator).toBe('z.number().int().negative()');
  });

  it('should map xs:nonPositiveInteger', () => {
    const result = mapPrimitiveType('xs:nonPositiveInteger');
    expect(result.tsType).toBe('number');
    expect(result.zodValidator).toBe('z.number().int().nonpositive()');
  });
});
