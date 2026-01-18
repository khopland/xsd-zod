import { describe, it, expect, afterEach } from 'vitest';
import { parseXsd, compileXsd } from '../src';
import { readFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Norwegian Tax Authority XSD (skatt-test.xsd)', () => {
  const outputDir = 'tests/output';

  afterEach(async () => {
    try {
      await rm(outputDir, { recursive: true, force: true });
    } catch {
    }
  });

  describe('Parser Tests', () => {
    it('should parse StandardAccounts root element', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xs:element name="StandardAccounts">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Account" maxOccurs="unbounded">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="AccountID" type="xs:string"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const schema = parseXsd(xsd);

      expect(schema.elements).toHaveLength(1);
      expect(schema.elements[0].name).toBe('StandardAccounts');
      expect(schema.elements[0].complexType).toBeDefined();
    });

    it('should parse Account with nested sequence', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xs:element name="StandardAccounts">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Account" maxOccurs="unbounded">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="AccountID" type="xs:string"/>
              <xs:element name="Description" type="xs:string" maxOccurs="unbounded"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const schema = parseXsd(xsd);

      const standardAccounts = schema.elements[0];
      expect(standardAccounts.complexType?.sequence).toHaveLength(1);
      
      const accountElement = standardAccounts.complexType?.sequence?.[0];
      expect(accountElement?.name).toBe('Account');
      expect(accountElement?.maxOccurs).toBe('unbounded');
      expect(accountElement?.complexType?.sequence).toHaveLength(2);
    });

    it('should parse AccountID with string constraints', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xs:element name="Account">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="AccountID">
          <xs:simpleType>
            <xs:restriction base="xs:string">
              <xs:minLength value="2"/>
              <xs:maxLength value="4"/>
            </xs:restriction>
          </xs:simpleType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const schema = parseXsd(xsd);

      const accountElement = schema.elements[0];
      expect(accountElement.complexType?.sequence?.[0].name).toBe('AccountID');
      expect(accountElement.complexType?.sequence?.[0].simpleType?.restriction.minLength).toBe(2);
      expect(accountElement.complexType?.sequence?.[0].simpleType?.restriction.maxLength).toBe(4);
    });

    it('should parse Description with ISOLanguageCode attribute', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xs:element name="Description" maxOccurs="unbounded">
    <xs:complexType>
      <xs:simpleContent>
        <xs:extension base="xs:string">
          <xs:attribute name="ISOLanguageCode">
            <xs:simpleType>
              <xs:restriction base="xs:string">
                <xs:length value="3"/>
              </xs:restriction>
            </xs:simpleType>
          </xs:attribute>
        </xs:extension>
      </xs:simpleContent>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const schema = parseXsd(xsd);

      const descriptionElement = schema.elements[0];
      expect(descriptionElement.name).toBe('Description');
      expect(descriptionElement.maxOccurs).toBe('unbounded');
      expect(descriptionElement.complexType).toBeDefined();
    });

    it('should parse ISOLanguageCode with length restriction', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Description">
    <xs:complexType>
      <xs:simpleContent>
        <xs:extension base="xs:string">
          <xs:attribute name="ISOLanguageCode">
            <xs:simpleType>
              <xs:restriction base="xs:string">
                <xs:length value="3"/>
              </xs:restriction>
            </xs:simpleType>
          </xs:attribute>
        </xs:extension>
      </xs:simpleContent>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

      const schema = parseXsd(xsd);

      const descriptionElement = schema.elements[0];
      expect(descriptionElement.complexType?.attributes).toBeDefined();
      const isoAttr = descriptionElement.complexType?.attributes[0];
      expect(isoAttr?.simpleType?.restriction.length).toBe(3);
    });
  });

  describe('Integration Tests', () => {
    it('should parse complete skatt-test.xsd file', async () => {
      const xsdContent = await readFile('tests/fixtures/skatt-test.xsd', 'utf-8');
      const schema = parseXsd(xsdContent);

      expect(schema.elements).toHaveLength(1);
      expect(schema.elements[0].name).toBe('StandardAccounts');
      expect(schema.elements[0].complexType?.sequence).toHaveLength(1);

      const account = schema.elements[0].complexType?.sequence?.[0];
      expect(account?.name).toBe('Account');
      expect(account?.maxOccurs).toBe('unbounded');
      expect(account?.complexType?.sequence).toHaveLength(2);

      const accountId = account?.complexType?.sequence?.[0];
      expect(accountId?.name).toBe('AccountID');
      expect(accountId?.simpleType?.restriction.minLength).toBe(2);
      expect(accountId?.simpleType?.restriction.maxLength).toBe(4);

      const description = account?.complexType?.sequence?.[1];
      expect(description?.name).toBe('Description');
      expect(description?.maxOccurs).toBe('unbounded');
    });

    it('should compile skatt-test.xsd to TypeScript and Zod files', async () => {
      await compileXsd({
        input: 'tests/fixtures/skatt-test.xsd',
        output: outputDir,
        naming: 'camel',
        separate: true,
        watch: false
      });

      const typesPath = join(outputDir, 'skatt-test.types.ts');
      const validatorsPath = join(outputDir, 'skatt-test.validators.ts');

      expect(existsSync(typesPath)).toBe(true);
      expect(existsSync(validatorsPath)).toBe(true);

      const types = await readFile(typesPath, 'utf-8');
      const validators = await readFile(validatorsPath, 'utf-8');

      expect(types).toContain('StandardAccounts');
      expect(types).toContain('Account');
      expect(types).toContain('Description');
      
      expect(validators).toContain("import { z } from 'zod'");
      expect(validators).toContain('StandardAccountsSchema');
      expect(validators).toContain('AccountSchema');
      expect(validators).toContain('.min(2)');
      expect(validators).toContain('.max(4)');
    });
  });
});
