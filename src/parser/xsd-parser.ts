import { XMLParser } from 'fast-xml-parser';
import type { XsdSchema, XsdElement, XsdComplexType, XsdSimpleType, XsdAttribute } from './types';
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    parseAttributeValue: false,
    trimValues: true,
    textNodeName: '_text'
  });
export function parseXsd(xsdContent: string): XsdSchema {


  const parsed = parser.parse(xsdContent);
  const xsd = parsed['xs:schema'] || parsed['schema'] || parsed;

  return {
    targetNamespace: xsd.targetNamespace,
    elementFormDefault: xsd.elementFormDefault,
    elements: parseElements(xsd),
    complexTypes: parseComplexTypes(xsd),
    simpleTypes: parseSimpleTypes(xsd)
  };
}

function parseElements(xsd: any): XsdElement[] {
  const elements: XsdElement[] = [];

  const elementArray = Array.isArray(xsd.element) ? xsd.element : 
                     Array.isArray(xsd['xs:element']) ? xsd['xs:element'] : 
                     xsd.element ? [xsd.element] : 
                     xsd['xs:element'] ? [xsd['xs:element']] : [];

  for (const el of elementArray) {
    const element = parseElement(el);
    if (element) {
      elements.push(element);
    }
  }

  return elements;
}

function parseElement(el: any): XsdElement | null {
  if (!el) return null;

  const element: XsdElement = {
    name: el.name,
    type: el.type,
    attributes: parseAttributes(el),
    minOccurs: el.minOccurs !== undefined ? parseInt(el.minOccurs) : undefined,
    maxOccurs: el.maxOccurs === 'unbounded' ? 'unbounded' : el.maxOccurs !== undefined ? parseInt(el.maxOccurs) : undefined,
    isRef: !!el.ref
  };

  if (el.complexType || el['xs:complexType']) {
    element.complexType = parseComplexType(el.complexType || el['xs:complexType'], el.name) ?? undefined;
  }

  if (el.simpleType || el['xs:simpleType']) {
    element.simpleType = parseSimpleType(el.simpleType || el['xs:simpleType'], el.name) ?? undefined;
  }

  return element;
}

function parseComplexTypes(xsd: any): XsdComplexType[] {
  const types: XsdComplexType[] = [];

  const typeArray = Array.isArray(xsd.complexType) ? xsd.complexType : 
                     Array.isArray(xsd['xs:complexType']) ? xsd['xs:complexType'] :
                     xsd.complexType ? [xsd.complexType] : 
                     xsd['xs:complexType'] ? [xsd['xs:complexType']] : [];

  for (const ct of typeArray) {
    const complexType = parseComplexType(ct, ct.name);
    if (complexType) {
      types.push(complexType);
    }
  }

  return types;
}

function parseComplexType(ct: any, name?: string): XsdComplexType | null {
  if (!ct) return null;

  const complexType: XsdComplexType = {
    name,
    attributes: parseAttributes(ct),
    content: []
  };

  if (ct.sequence || ct['xs:sequence']) {
    const seq = ct.sequence || ct['xs:sequence'];
    complexType.sequence = parseNestedElements(seq);
    complexType.content.push(...complexType.sequence);
  }

  if (ct.choice || ct['xs:choice']) {
    const ch = ct.choice || ct['xs:choice'];
    complexType.choice = parseNestedElements(ch);
    complexType.content.push(...complexType.choice);
  }

  if (ct.all || ct['xs:all']) {
    const a = ct.all || ct['xs:all'];
    complexType.all = parseNestedElements(a);
    complexType.content.push(...complexType.all);
  }

  if (!!(ct.complexContent?.extension || ct['xs:complexContent']?.['xs:extension'])) {
    const complexContent = ct.complexContent || ct['xs:complexContent'];
    const ext = complexContent?.extension || complexContent?.['xs:extension'];
    complexType.extension = {
      base: ext?.base,
      sequence: (ext?.sequence || ext?.['xs:sequence']) ? parseNestedElements(ext.sequence || ext['xs:sequence']) : undefined,
      attributes: parseAttributes(ext || {})
    };
    if (complexType.extension?.sequence) {
      complexType.content.push(...complexType.extension.sequence);
    }
  }

  return complexType;
}

function parseNestedElements(container: any): XsdElement[] {
  const elements: XsdElement[] = [];
  const elementArray = Array.isArray(container.element) ? container.element : 
                     Array.isArray(container['xs:element']) ? container['xs:element'] :
                     container.element ? [container.element] : 
                     container['xs:element'] ? [container['xs:element']] : [];

  for (const el of elementArray) {
    const element = parseElement(el);
    if (element) {
      elements.push(element);
    }
  }

  return elements;
}

function parseSimpleTypes(xsd: any): XsdSimpleType[] {
  const types: XsdSimpleType[] = [];

  const typeArray = Array.isArray(xsd.simpleType) ? xsd.simpleType : 
                     Array.isArray(xsd['xs:simpleType']) ? xsd['xs:simpleType'] :
                     xsd.simpleType ? [xsd.simpleType] : 
                     xsd['xs:simpleType'] ? [xsd['xs:simpleType']] : [];

  for (const st of typeArray) {
    const simpleType = parseSimpleType(st, st.name);
    if (simpleType) {
      types.push(simpleType);
    }
  }

  return types;
}

function parseSimpleType(st: any, name?: string): XsdSimpleType | null {
  if (!st) return null;

  const restriction = st.restriction || st['xs:restriction'] || {};

  return {
    name,
    restriction: {
      base: restriction.base,
      enumerations: parseEnumerations(restriction),
      minLength: (restriction.minLength?.value || restriction['xs:minLength']?.value) ? parseInt(restriction.minLength?.value || restriction['xs:minLength']?.value) : undefined,
      maxLength: (restriction.maxLength?.value || restriction['xs:maxLength']?.value) ? parseInt(restriction.maxLength?.value || restriction['xs:maxLength']?.value) : undefined,
      pattern: restriction.pattern?.value || restriction['xs:pattern']?.value,
      minInclusive: (restriction.minInclusive?.value || restriction['xs:minInclusive']?.value) ? parseFloat(restriction.minInclusive?.value || restriction['xs:minInclusive']?.value) : undefined,
      maxInclusive: (restriction.maxInclusive?.value || restriction['xs:maxInclusive']?.value) ? parseFloat(restriction.maxInclusive?.value || restriction['xs:maxInclusive']?.value) : undefined,
      minExclusive: (restriction.minExclusive?.value || restriction['xs:minExclusive']?.value) ? parseFloat(restriction.minExclusive?.value || restriction['xs:minExclusive']?.value) : undefined,
      maxExclusive: (restriction.maxExclusive?.value || restriction['xs:maxExclusive']?.value) ? parseFloat(restriction.maxExclusive?.value || restriction['xs:maxExclusive']?.value) : undefined,
      totalDigits: (restriction.totalDigits?.value || restriction['xs:totalDigits']?.value) ? parseInt(restriction.totalDigits?.value || restriction['xs:totalDigits']?.value) : undefined,
      fractionDigits: (restriction.fractionDigits?.value || restriction['xs:fractionDigits']?.value) ? parseInt(restriction.fractionDigits?.value || restriction['xs:fractionDigits']?.value) : undefined,
      length: (restriction.length?.value || restriction['xs:length']?.value) ? parseInt(restriction.length?.value || restriction['xs:length']?.value) : undefined,
      whiteSpace: restriction.whiteSpace?.value || restriction['xs:whiteSpace']?.value
    }
  };
}

function parseEnumerations(restriction: any): string[] | undefined {
  if (!restriction.enumeration && !restriction['xs:enumeration']) return undefined;

  const enumArray = Array.isArray(restriction.enumeration) ? restriction.enumeration : 
                    Array.isArray(restriction['xs:enumeration']) ? restriction['xs:enumeration'] :
                    restriction.enumeration ? [restriction.enumeration] : 
                    restriction['xs:enumeration'] ? [restriction['xs:enumeration']] : [];
  return enumArray.map((e: any) => e.value || e);
}

function parseAttributes(parent: any): XsdAttribute[] {
  const attributes: XsdAttribute[] = [];

  if (!parent.attribute && !parent['xs:attribute']) return attributes;

  const attrArray = Array.isArray(parent.attribute) ? parent.attribute : 
                    Array.isArray(parent['xs:attribute']) ? parent['xs:attribute'] :
                    parent.attribute ? [parent.attribute] : 
                    parent['xs:attribute'] ? [parent['xs:attribute']] : [];

  for (const attr of attrArray) {
    attributes.push({
      name: attr.name,
      type: attr.type,
      use: attr.use || 'optional',
      default: attr.default,
      fixed: attr.fixed,
      simpleType: (attr.simpleType || attr['xs:simpleType']) ? (parseSimpleType(attr.simpleType || attr['xs:simpleType']) ?? undefined) : undefined
    });
  }

  return attributes;
}
