import { describe, it, expect } from 'vitest';
import { parseXsd } from '../src/parser';

describe('XSD Parser', () => {
  it('should parse simple XSD schema', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="User" type="xs:string"/>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema).toBeDefined();
    expect(schema.elements).toHaveLength(1);
    expect(schema.elements[0].name).toBe('User');
    expect(schema.elements[0].type).toBe('xs:string');
  });

  it('should parse simpleType with enumeration', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="StatusType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="active"/>
      <xs:enumeration value="inactive"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.simpleTypes).toHaveLength(1);
    expect(schema.simpleTypes[0].name).toBe('StatusType');
    expect(schema.simpleTypes[0].restriction.enumerations).toEqual(['active', 'inactive']);
  });

  it('should parse complexType with sequence', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="UserType">
    <xs:sequence>
      <xs:element name="firstName" type="xs:string"/>
      <xs:element name="lastName" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes).toHaveLength(1);
    expect(schema.complexTypes[0].name).toBe('UserType');
    expect(schema.complexTypes[0].sequence).toHaveLength(2);
    expect(schema.complexTypes[0].sequence![0].name).toBe('firstName');
    expect(schema.complexTypes[0].sequence![1].name).toBe('lastName');
  });

  it('should parse complexType with attributes', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="UserType">
    <xs:sequence>
      <xs:element name="name" type="xs:string"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
    <xs:attribute name="active" type="xs:boolean" use="optional"/>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes[0].attributes).toHaveLength(2);
    expect(schema.complexTypes[0].attributes[0].name).toBe('id');
    expect(schema.complexTypes[0].attributes[0].use).toBe('required');
    expect(schema.complexTypes[0].attributes[1].name).toBe('active');
    expect(schema.complexTypes[0].attributes[1].use).toBe('optional');
  });

  it('should parse simpleType with facets', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="EmailType">
    <xs:restriction base="xs:string">
      <xs:minLength value="5"/>
      <xs:maxLength value="255"/>
      <xs:pattern value="[^@]+@[^@]+\\.[^@]+"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>`;

    const schema = parseXsd(xsd);
    
    expect(schema.simpleTypes[0].restriction.minLength).toBe(5);
    expect(schema.simpleTypes[0].restriction.maxLength).toBe(255);
    expect(schema.simpleTypes[0].restriction.pattern).toBe('[^@]+@[^@]+\\.[^@]+');
  });

  it('should parse element with minOccurs and maxOccurs', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="items">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="item" type="xs:string" minOccurs="0" maxOccurs="unbounded"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.elements[0].complexType?.sequence![0].minOccurs).toBe(0);
    expect(schema.elements[0].complexType?.sequence![0].maxOccurs).toBe('unbounded');
  });

  it('should parse complexType with choice', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="ChoiceType">
    <xs:choice>
      <xs:element name="optionA" type="xs:string"/>
      <xs:element name="optionB" type="xs:string"/>
    </xs:choice>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes[0].choice).toHaveLength(2);
    expect(schema.complexTypes[0].choice![0].name).toBe('optionA');
    expect(schema.complexTypes[0].choice![1].name).toBe('optionB');
  });

  it('should parse complexType with all', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="AllType">
    <xs:all>
      <xs:element name="fieldA" type="xs:string"/>
      <xs:element name="fieldB" type="xs:string"/>
    </xs:all>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes[0].all).toHaveLength(2);
    expect(schema.complexTypes[0].all![0].name).toBe('fieldA');
    expect(schema.complexTypes[0].all![1].name).toBe('fieldB');
  });

  it('should parse number facets', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="PositiveInteger">
    <xs:restriction base="xs:integer">
      <xs:minInclusive value="1"/>
      <xs:maxInclusive value="100"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.simpleTypes[0].restriction.minInclusive).toBe(1);
    expect(schema.simpleTypes[0].restriction.maxInclusive).toBe(100);
  });

  it('should parse complexType with extension', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="BaseType">
    <xs:sequence>
      <xs:element name="baseField" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>
  <xs:complexType name="ExtendedType">
    <xs:complexContent>
      <xs:extension base="BaseType">
        <xs:sequence>
          <xs:element name="extendedField" type="xs:string"/>
        </xs:sequence>
      </xs:extension>
    </xs:complexContent>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes[1].extension?.base).toBe('BaseType');
    expect(schema.complexTypes[1].extension?.sequence).toHaveLength(1);
    expect(schema.complexTypes[1].extension?.sequence![0].name).toBe('extendedField');
  });

  it('should handle xs: namespace prefix', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Test" type="xs:string"/>
  <xs:simpleType name="TestType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="value1"/>
    </xs:restriction>
  </xs:simpleType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.elements).toHaveLength(1);
    expect(schema.simpleTypes).toHaveLength(1);
  });

  it('should handle no namespace prefix', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<schema xmlns="http://www.w3.org/2001/XMLSchema">
  <element name="Test" type="string"/>
</schema>`;

    const schema = parseXsd(xsd);

    expect(schema.elements).toHaveLength(1);
    expect(schema.elements[0].name).toBe('Test');
  });

  it('should parse attribute with default value', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="TestType">
    <xs:attribute name="status" type="xs:string" default="active"/>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes[0].attributes[0].default).toBe('active');
  });

  it('should parse attribute with fixed value', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="TestType">
    <xs:attribute name="version" type="xs:string" fixed="1.0"/>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes[0].attributes[0].fixed).toBe('1.0');
  });

  it('should parse inline simpleType in element', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="status">
    <xs:simpleType>
      <xs:restriction base="xs:string">
        <xs:enumeration value="on"/>
        <xs:enumeration value="off"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:element>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.elements[0].simpleType).toBeDefined();
    expect(schema.elements[0].simpleType?.restriction.enumerations).toEqual(['on', 'off']);
  });

  it('should parse inline complexType in element', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="user">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="name" type="xs:string"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.elements[0].complexType).toBeDefined();
    expect(schema.elements[0].complexType?.sequence).toHaveLength(1);
  });

  it('should parse targetNamespace', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="http://example.com/test">
  <xs:element name="Test" type="xs:string"/>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.targetNamespace).toBe('http://example.com/test');
  });

  it('should parse elementFormDefault', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xs:element name="Test" type="xs:string"/>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.elementFormDefault).toBe('qualified');
  });

  it('should handle empty schema', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.elements).toHaveLength(0);
    expect(schema.complexTypes).toHaveLength(0);
    expect(schema.simpleTypes).toHaveLength(0);
  });

  it('should handle schema with only comments', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <!-- This is a comment -->
  <!-- <xs:element name="CommentedOut" type="xs:string"/> -->
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.elements).toHaveLength(0);
  });

  it('should handle malformed XML gracefully', () => {
    const malformedXsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Test" type="xs:string">
</xs:schema>`;

    expect(() => parseXsd(malformedXsd)).not.toThrow();
  });

  it('should handle invalid XML structure', () => {
    const invalidXsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:invalidElement name="Test"/>
</xs:schema>`;

    expect(() => parseXsd(invalidXsd)).not.toThrow();
  });

  it('should handle schema without xmlns declaration', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema>
  <xs:element name="Test" type="xs:string"/>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.elements).toBeDefined();
  });

  it('should parse attribute with use required', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="TestType">
    <xs:attribute name="requiredField" type="xs:string" use="required"/>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes[0].attributes[0].use).toBe('required');
  });

  it('should parse attribute use optional as undefined', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="TestType">
    <xs:attribute name="optionalField" type="xs:string"/>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes[0].attributes[0].use).toBe('optional');
  });

  it('should parse complex type with multiple extensions', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="BaseType">
    <xs:sequence>
      <xs:element name="baseField" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>
  <xs:complexType name="MiddleType">
    <xs:complexContent>
      <xs:extension base="BaseType">
        <xs:sequence>
          <xs:element name="middleField" type="xs:int"/>
        </xs:sequence>
      </xs:extension>
    </xs:complexContent>
  </xs:complexType>
  <xs:complexType name="FinalType">
    <xs:complexContent>
      <xs:extension base="MiddleType">
        <xs:sequence>
          <xs:element name="finalField" type="xs:boolean"/>
        </xs:sequence>
      </xs:extension>
    </xs:complexContent>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes).toHaveLength(3);
    expect(schema.complexTypes[2].extension?.base).toBe('MiddleType');
  });

  it('should parse extension with additional attributes', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="BaseType">
    <xs:attribute name="baseAttr" type="xs:string"/>
  </xs:complexType>
  <xs:complexType name="ExtendedType">
    <xs:complexContent>
      <xs:extension base="BaseType">
        <xs:sequence>
          <xs:element name="newField" type="xs:int"/>
        </xs:sequence>
        <xs:attribute name="extendedAttr" type="xs:boolean"/>
      </xs:extension>
    </xs:complexContent>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    const extendedType = schema.complexTypes[1];
    expect(extendedType.extension?.base).toBe('BaseType');
    expect(extendedType.extension?.attributes).toHaveLength(1);
    expect(extendedType.attributes).toHaveLength(1);
  });

  it('should parse type reused by multiple elements', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="AddressType">
    <xs:sequence>
      <xs:element name="street" type="xs:string"/>
      <xs:element name="city" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>
  <xs:element name="shippingAddress" type="AddressType"/>
  <xs:element name="billingAddress" type="AddressType"/>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes).toHaveLength(1);
    expect(schema.elements).toHaveLength(2);
    expect(schema.elements[0].type).toBe('AddressType');
    expect(schema.elements[1].type).toBe('AddressType');
  });

  it('should parse complex type with nested inline complexType in choice', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="NestedChoiceType">
    <xs:sequence>
      <xs:element name="field1" type="xs:string"/>
      <xs:choice>
        <xs:element name="field2" type="xs:int"/>
        <xs:element name="field3">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="nested1" type="xs:boolean"/>
              <xs:element name="nested2" type="xs:dateTime"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:choice>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes[0].sequence).toHaveLength(2);
    expect(schema.complexTypes[0].sequence![1]).toHaveProperty('complexType');
    expect(schema.complexTypes[0].sequence![1].complexType?.sequence).toHaveLength(2);
  });

  it('should parse complex type with mixed sequence and choice', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="MixedType">
    <xs:sequence>
      <xs:element name="field1" type="xs:string"/>
      <xs:choice>
        <xs:element name="field2" type="xs:int"/>
        <xs:element name="field3" type="xs:boolean"/>
      </xs:choice>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes[0].sequence).toHaveLength(1);
    expect(schema.complexTypes[0].choice).toBeDefined();
  });

  it('should parse complex type with nested inline complexType in choice', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="NestedChoiceType">
    <xs:sequence>
      <xs:element name="field1" type="xs:string"/>
      <xs:choice>
        <xs:element name="field2" type="xs:int"/>
        <xs:element name="field3">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="nested1" type="xs:boolean"/>
              <xs:element name="nested2" type="xs:dateTime"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:choice>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes[0].sequence).toHaveLength(2);
    expect(schema.complexTypes[0].sequence![1]).toHaveProperty('complexType');
    expect(schema.complexTypes[0].sequence![1].complexType?.sequence).toHaveLength(2);
  });

  it('should parse complex type with nested inline complexType in choice', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="NestedChoiceType">
    <xs:sequence>
      <xs:element name="field1" type="xs:string"/>
      <xs:choice>
        <xs:element name="field2" type="xs:int"/>
        <xs:element name="field3">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="nested1" type="xs:boolean"/>
              <xs:element name="nested2" type="xs:dateTime"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:choice>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes[0].sequence).toHaveLength(2);
    expect(schema.complexTypes[0].sequence![1]).toHaveProperty('complexType');
    expect(schema.complexTypes[0].sequence![1].complexType?.sequence).toHaveLength(2);
  });

  it('should parse element with ref attribute', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="TestType">
    <xs:sequence>
      <xs:element name="field1" type="xs:string"/>
      <xs:element ref="globalElement" minOccurs="0"/>
    </xs:sequence>
  </xs:complexType>
  <xs:element name="globalElement" type="xs:int"/>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.elements).toHaveLength(2);
    expect(schema.elements[1].isRef).toBe(true);
    expect(schema.elements[1].name).toBe('globalElement');
  });

  it('should parse complex type with all', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="AllType">
    <xs:all>
      <xs:element name="field1" type="xs:string" minOccurs="0"/>
      <xs:element name="field2" type="xs:int" minOccurs="0"/>
      <xs:element name="field3" type="xs:boolean" minOccurs="0"/>
    </xs:all>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes[0].all).toHaveLength(3);
  });

  it('should parse complex type with all and sequence', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="MixedAllType">
    <xs:sequence>
      <xs:element name="seqField" type="xs:string"/>
    </xs:sequence>
    <xs:all>
      <xs:element name="allField1" type="xs:int" minOccurs="0"/>
      <xs:element name="allField2" type="xs:boolean" minOccurs="0"/>
    </xs:all>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    const complexType = schema.complexTypes[0];
    expect(complexType.sequence).toHaveLength(1);
    expect(complexType.all).toHaveLength(2);
  });

  it('should parse complex type with all', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="AllType">
    <xs:all>
      <xs:element name="field1" type="xs:string" minOccurs="0"/>
      <xs:element name="field2" type="xs:int" minOccurs="0"/>
      <xs:element name="field3" type="xs:boolean" minOccurs="0"/>
    </xs:all>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes[0].all).toHaveLength(3);
  });

  it('should parse complex type with all and sequence', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="MixedAllType">
    <xs:sequence>
      <xs:element name="seqField" type="xs:string"/>
    </xs:sequence>
    <xs:all>
      <xs:element name="allField1" type="xs:int" minOccurs="0"/>
      <xs:element name="allField2" type="xs:boolean" minOccurs="0"/>
    </xs:all>
  </xs:complexType>
</xs:schema>`;

    const schema = parseXsd(xsd);

    const complexType = schema.complexTypes[0];
    expect(complexType.sequence).toHaveLength(1);
    expect(complexType.all).toHaveLength(2);
  });

  it('should parse type reused by multiple elements', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="AddressType">
    <xs:sequence>
      <xs:element name="street" type="xs:string"/>
      <xs:element name="city" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>
  <xs:element name="shippingAddress" type="AddressType"/>
  <xs:element name="billingAddress" type="AddressType"/>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.complexTypes).toHaveLength(1);
    expect(schema.elements).toHaveLength(2);
    expect(schema.elements[0].type).toBe('AddressType');
    expect(schema.elements[1].type).toBe('AddressType');
  });

  it('should parse element with ref attribute', () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="TestType">
    <xs:sequence>
      <xs:element name="field1" type="xs:string"/>
      <xs:element ref="globalElement" minOccurs="0"/>
    </xs:sequence>
  </xs:complexType>
  <xs:element name="globalElement" type="xs:int"/>
</xs:schema>`;

    const schema = parseXsd(xsd);

    expect(schema.elements).toHaveLength(2);
    expect(schema.elements[1].isRef).toBe(true);
    expect(schema.elements[1].name).toBe('globalElement');
  });
});
