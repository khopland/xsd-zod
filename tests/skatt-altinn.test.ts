import { describe, it, expect, afterEach } from 'vitest';
import { parseXsd, compileXsd } from '../src';
import { readFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Norwegian Tax Authority XSD (skatt-altinn.xsd)', () => {
  const outputDir = 'tests/output';

  afterEach(async () => {
    try {
      await rm(outputDir, { recursive: true, force: true });
    } catch {
    }
  });

  describe('Parser Tests', () => {
    it('should parse custom namespace with skatt: prefix', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:skatt="http://www.skatteetaten.no/xsd" xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xsd:element name="melding" type="EgenerklaeringRegnskap"/>
  <xsd:complexType name="EgenerklaeringRegnskap">
    <xsd:sequence>
      <xsd:element name="oppgaveinformasjon" type="xsd:string"/>
    </xsd:sequence>
  </xsd:complexType>
</xsd:schema>`;

      const schema = parseXsd(xsd);
      expect(schema.elements).toHaveLength(1);
      expect(schema.complexTypes).toHaveLength(1);
    });

    it('should parse root element with type reference', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xsd:element name="melding" type="EgenerklaeringRegnskap"/>
  <xsd:complexType name="EgenerklaeringRegnskap">
    <xsd:sequence>
      <xsd:element name="oppgaveinformasjon" type="xsd:string"/>
    </xsd:sequence>
  </xsd:complexType>
</xsd:schema>`;

      const schema = parseXsd(xsd);
      expect(schema.elements[0].name).toBe('melding');
      expect(schema.elements[0].type).toBe('EgenerklaeringRegnskap');
    });

    it('should parse 3-level nested types', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xsd:element name="melding" type="EgenerklaeringRegnskap"/>
  <xsd:complexType name="EgenerklaeringRegnskap">
    <xsd:sequence>
      <xsd:element name="informasjon" type="InformasjonOmInnsender"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="InformasjonOmInnsender">
    <xsd:sequence>
      <xsd:element name="kontakt" type="Kontaktinformasjon"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:complexType name="Kontaktinformasjon">
    <xsd:sequence>
      <xsd:element name="navn" type="Navn"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="Navn">
    <xsd:restriction base="xsd:string"/>
  </xsd:simpleType>
</xsd:schema>`;

      const schema = parseXsd(xsd);
      expect(schema.complexTypes).toHaveLength(3);
      expect(schema.complexTypes[0].name).toBe('EgenerklaeringRegnskap');
      expect(schema.complexTypes[1].name).toBe('InformasjonOmInnsender');
      expect(schema.complexTypes[2].name).toBe('Kontaktinformasjon');
      expect(schema.simpleTypes).toHaveLength(1);
      expect(schema.simpleTypes[0].name).toBe('Navn');
    });

    it('should parse nillable elements', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xsd:complexType name="TestType">
    <xsd:sequence>
      <xsd:element name="field1" nillable="true" type="xsd:string"/>
      <xsd:element name="field2" type="xsd:string"/>
    </xsd:sequence>
  </xsd:complexType>
</xsd:schema>`;

      const schema = parseXsd(xsd);
      const sequence = schema.complexTypes[0].sequence;
      expect(sequence).toHaveLength(2);
      expect(sequence?.[0]).toHaveProperty('nillable');
    });

    it('should parse optional elements with minOccurs="0"', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xsd:complexType name="TestType">
    <xsd:sequence>
      <xsd:element minOccurs="0" name="optionalField" type="xsd:string"/>
      <xsd:element name="requiredField" type="xsd:string"/>
    </xsd:sequence>
  </xsd:complexType>
</xsd:schema>`;

      const schema = parseXsd(xsd);
      const sequence = schema.complexTypes[0].sequence;
      expect(sequence).toHaveLength(2);
      expect(sequence?.[0].minOccurs).toBe(0);
      expect(sequence?.[1].minOccurs).toBeUndefined();
    });

    it('should parse required attributes with use="required"', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xsd:complexType name="TestType">
    <xsd:attribute name="requiredAttr" type="xsd:string" use="required"/>
    <xsd:attribute name="optionalAttr" type="xsd:string" use="optional"/>
  </xsd:complexType>
  <xsd:element name="TestElement" type="TestType"/>
</xsd:schema>`;

      const schema = parseXsd(xsd);
      const testElement = schema.elements[0];
      expect(testElement.name).toBe('TestElement');
      expect(testElement.type).toBe('TestType');
      const testComplexType = schema.complexTypes[0];
      expect(testComplexType.name).toBe('TestType');
      const attributes = testComplexType.attributes;
      expect(attributes).toHaveLength(2);
      expect(attributes[0].use).toBe('required');
      expect(attributes[1].use).toBe('optional');
    });

    it('should parse fixed attribute values', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xsd:complexType name="TestType">
    <xsd:attribute name="fixedAttr" type="xsd:string" fixed="Skatt"/>
    <xsd:attribute name="fixedAttr2" type="xsd:string" fixed="RF-1363"/>
  </xsd:complexType>
  <xsd:element name="TestElement" type="TestType"/>
</xsd:schema>`;

      const schema = parseXsd(xsd);
      const testElement = schema.elements[0];
      expect(testElement.name).toBe('TestElement');
      expect(testElement.type).toBe('TestType');
      const attributes = schema.complexTypes[0].attributes;
      expect(attributes).toHaveLength(2);
      expect(attributes[0].fixed).toBe('Skatt');
      expect(attributes[1].fixed).toBe('RF-1363');
    });

    it('should parse simple type definitions with base restrictions', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <xsd:simpleType name="Tekst">
    <xsd:restriction base="xsd:string">
      <xsd:maxLength value="4000"/>
    </xsd:restriction>
  </xsd:simpleType>
  <xsd:simpleType name="Telefonnummer">
    <xsd:restriction base="Tekst"/>
  </xsd:simpleType>
</xsd:schema>`;

      const schema = parseXsd(xsd);
      expect(schema.simpleTypes).toHaveLength(2);
      expect(schema.simpleTypes[0].name).toBe('Tekst');
      expect(schema.simpleTypes[0].restriction.base).toBe('xsd:string');
      expect(schema.simpleTypes[0].restriction.maxLength).toBe(4000);
      expect(schema.simpleTypes[1].name).toBe('Telefonnummer');
      expect(schema.simpleTypes[1].restriction.base).toBe('Tekst');
    });

    it('should parse complex type sequences', () => {
      const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xsd:complexType name="Kontaktinformasjon">
    <xsd:sequence>
      <xsd:element name="navn" type="Navn"/>
      <xsd:element name="epostadresse" type="Epostadresse"/>
      <xsd:element name="mobiltelefonummer" type="Telefonnummer"/>
    </xsd:sequence>
  </xsd:complexType>
  <xsd:simpleType name="Navn">
    <xsd:restriction base="Tekst"/>
  </xsd:simpleType>
  <xsd:simpleType name="Epostadresse">
    <xsd:restriction base="Tekst"/>
  </xsd:simpleType>
  <xsd:simpleType name="Telefonnummer">
    <xsd:restriction base="Tekst"/>
  </xsd:simpleType>
</xsd:schema>`;

      const schema = parseXsd(xsd);
      const kontaktType = schema.complexTypes[0];
      expect(kontaktType.name).toBe('Kontaktinformasjon');
      expect(kontaktType.sequence).toHaveLength(3);
      expect(kontaktType.sequence?.[0].name).toBe('navn');
      expect(kontaktType.sequence?.[1].name).toBe('epostadresse');
      expect(kontaktType.sequence?.[2].name).toBe('mobiltelefonummer');
    });
  });

  describe('Integration Tests', () => {
    it('should compile skatt-altinn.xsd to TypeScript and Zod files', async () => {
      await compileXsd({
        input: 'tests/fixtures/skatt-altinn.xsd',
        output: outputDir,
        naming: 'camel',
        separate: true,
        watch: false
      });

      const typesPath = join(outputDir, 'skatt-altinn.types.ts');
      const validatorsPath = join(outputDir, 'skatt-altinn.validators.ts');

      expect(existsSync(typesPath)).toBe(true);
      expect(existsSync(validatorsPath)).toBe(true);

      const types = await readFile(typesPath, 'utf-8');
      const validators = await readFile(validatorsPath, 'utf-8');

      expect(types).toContain('Melding');
      expect(types).toContain('EgenerklaeringRegnskap');
      expect(types).toContain('InformasjonOmInnsender');
      expect(types).toContain('Kontaktinformasjon');
      expect(types).toContain('Oppgaveinformasjon');
      expect(types).toContain('Oppgaveinformasjon');

      expect(validators).toContain("import { z } from 'zod'");
      expect(validators).toContain('MeldingSchema');
      expect(validators).toContain('EgenerklaeringRegnskapSchema');
      expect(validators).toContain('InformasjonOmInnsenderSchema');
      expect(validators).toContain('KontaktinformasjonSchema');
      expect(validators).toContain('MobiltelefonummerSchema');
      expect(validators).toContain('TekstSchema');
      expect(validators).toContain('TelefonnummerSchema');
    });

    it('should handle optional fields correctly', async () => {
      await compileXsd({
        input: 'tests/fixtures/skatt-altinn.xsd',
        output: outputDir,
        naming: 'camel',
        separate: true,
        watch: false
      });

      const typesPath = join(outputDir, 'skatt-altinn.types.ts');
      const validatorsPath = join(outputDir, 'skatt-altinn.validators.ts');

      const types = await readFile(typesPath, 'utf-8');
      const validators = await readFile(validatorsPath, 'utf-8');

      expect(types).toContain('oppgaveinformasjon?:');
      expect(types).toContain('informasjonOmInnsender?:');
      expect(types).toContain('kontaktinformasjon?:');

      expect(validators).toContain('.optional()');
    });

    it('should handle required attributes correctly', async () => {
      await compileXsd({
        input: 'tests/fixtures/skatt-altinn.xsd',
        output: outputDir,
        naming: 'camel',
        separate: true,
        watch: false
      });

      const typesPath = join(outputDir, 'skatt-altinn.types.ts');

      const types = await readFile(typesPath, 'utf-8');

      expect(types).toContain('dataFormatProvider: string');
      expect(types).toContain('dataFormatId: string');
      expect(types).toContain('dataFormatVersion: string');
    });
  });
});
