import { describe, it, expect } from 'vitest';
import { generateTypes, generateValidators } from '../src/generators';
import { parseXsd } from '../src/parser';

describe('Type Generator', () => {
  it('should generate simple type definition', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="Status">
    <xs:restriction base="xs:string">
      <xs:enumeration value="active"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const types = generateTypes(schema, 'camel');

    expect(types).toContain('export type Status');
    expect(types).toContain("'active'");
  });

  it('should generate interface for complex type', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="User">
    <xs:sequence>
      <xs:element name="name" type="xs:string"/>
      <xs:element name="age" type="xs:int"/>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const types = generateTypes(schema, 'camel');

     expect(types).toContain('export interface User');
     expect(types).toContain('name: string');
     expect(types).toContain('age: number');
   });

   it('should mark optional fields correctly', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="User">
    <xs:sequence>
      <xs:element name="name" type="xs:string" minOccurs="0"/>
      <xs:element name="age" type="xs:int"/>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const types = generateTypes(schema, 'camel');
    const validators = generateValidators(schema, 'camel');

    expect(types).toContain('name?: string');
    expect(types).toContain('age: number');
    expect(validators).toContain('name: z.string().optional()');
    expect(validators).toContain('age: z.number().int()');
  });

  it('should generate type for element', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="User">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const types = generateTypes(schema, 'camel');

    expect(types).toContain('export interface User');
    expect(types).toContain('name: string');
  });

  it('should generate array types for unbounded elements', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="List">
    <xs:sequence>
      <xs:element name="item" type="xs:string" maxOccurs="unbounded"/>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const types = generateTypes(schema, 'camel');

    expect(types).toContain('item: string[]');
  });

  it('should include attributes in interface', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="User">
    <xs:sequence>
      <xs:element name="name" type="xs:string"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
    <xs:attribute name="active" type="xs:boolean" use="optional"/>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const types = generateTypes(schema, 'camel');

    expect(types).toContain('id: string');
    expect(types).toContain('active?: boolean');
  });

  it('should use pascal case for type names', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="user_profile">
    <xs:sequence>
      <xs:element name="first_name" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const types = generateTypes(schema, 'camel');

    expect(types).toContain('export interface UserProfile');
  });

  it('should keep original names with original naming', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="UserProfile">
    <xs:sequence>
      <xs:element name="first_name" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const types = generateTypes(schema, 'original');

    expect(types).toContain('export interface UserProfile');
    expect(types).toContain('first_name: string');
  });

  it('should generate number type for integer restrictions', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="PositiveInt">
    <xs:restriction base="xs:integer">
      <xs:minInclusive value="1"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const types = generateTypes(schema, 'camel');

    expect(types).toContain('export type PositiveInt = number');
  });

  it('should generate boolean type', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="BooleanType">
    <xs:restriction base="xs:boolean"/>
  </xs:simpleType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const types = generateTypes(schema, 'camel');

    expect(types).toContain('export type BooleanType = boolean');
  });

  it('should include comment header', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Test" type="xs:string"/>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const types = generateTypes(schema, 'camel');

    expect(types).toContain('// Generated TypeScript types from XSD schema');
    expect(types).toContain('// Do not edit manually');
  });
});

describe('Validator Generator', () => {
  it('should generate zod schema for simple type', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="Email">
    <xs:restriction base="xs:string">
      <xs:minLength value="5"/>
      <xs:maxLength value="255"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const validators = generateValidators(schema, 'camel');

    expect(validators).toContain("import { z } from 'zod'");
    expect(validators).toContain('export const EmailSchema');
    expect(validators).toContain('.min(5)');
    expect(validators).toContain('.max(255)');
  });

  it('should generate zod object for complex type', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="User">
    <xs:sequence>
      <xs:element name="name" type="xs:string"/>
      <xs:element name="age" type="xs:int"/>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

     const schema = parseXsd(xsd);
     const validators = generateValidators(schema, 'camel');

     expect(validators).toContain('export const UserSchema');
     expect(validators).toContain('z.object({');
     expect(validators).toContain('name: z.string()');
     expect(validators).toContain('age: z.number().int()');
   });

  it('should generate zod enum for enumeration', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="Status">
    <xs:restriction base="xs:string">
      <xs:enumeration value="active"/>
      <xs:enumeration value="inactive"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const validators = generateValidators(schema, 'camel');

    expect(validators).toContain('export const StatusSchema');
    expect(validators).toContain("z.enum(['active', 'inactive'])");
  });

  it('should mark optional fields with .optional()', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="User">
    <xs:sequence>
      <xs:element name="name" type="xs:string" minOccurs="1"/>
      <xs:element name="age" type="xs:int" minOccurs="0"/>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const validators = generateValidators(schema, 'camel');

    expect(validators).toContain('name: z.string()');
    expect(validators).toContain('age: z.number().int().optional()');
  });

  it('should generate array schemas for unbounded elements', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="List">
    <xs:sequence>
      <xs:element name="item" type="xs:string" maxOccurs="unbounded"/>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const validators = generateValidators(schema, 'camel');

    expect(validators).toContain('item: z.array(z.string())');
  });

 it('should include attributes in zod object', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="User">
    <xs:sequence>
      <xs:element name="name" type="xs:string"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
    <xs:attribute name="active" type="xs:boolean" use="optional"/>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const validators = generateValidators(schema, 'camel');

    expect(validators).toContain('id: z.string()');
    expect(validators).toContain('active: z.boolean().optional()');
  });

  it('should apply regex pattern facet', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="Email">
    <xs:restriction base="xs:string">
      <xs:pattern value="[^@]+@[^@]+\\.[^@]+"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const validators = generateValidators(schema, 'camel');

    expect(validators).toContain('.regex(/');
  });

  it('should use camel case for schema names', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="UserProfile">
    <xs:sequence>
      <xs:element name="firstName" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const validators = generateValidators(schema, 'camel');

    expect(validators).toContain('export const UserProfileSchema');
    expect(validators).toContain('firstName:');
  });

  it('should use pascal case for schema names', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="UserProfile">
    <xs:sequence>
      <xs:element name="firstName" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const validators = generateValidators(schema, 'pascal');

    expect(validators).toContain('export const UserProfileSchema');
  });

  it('should generate validator for element', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="User">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const validators = generateValidators(schema, 'camel');

    expect(validators).toContain('export const UserSchema');
    expect(validators).toContain('z.object({');
  });

  it('should include comment header', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Test" type="xs:string"/>
</xs:schema>`;

    const schema = parseXsd(xsd);
    const validators = generateValidators(schema, 'camel');

    expect(validators).toContain('// Generated Zod validators from XSD schema');
    expect(validators).toContain('// Do not edit manually');
  });
});
