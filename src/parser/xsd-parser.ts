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
  const xsd = parsed['xs:schema'] || parsed['xsd:schema'] || parsed['schema'] || parsed;

  const elements = parseElements(xsd);
  const complexTypes = parseComplexTypes(xsd);
  const simpleTypes = parseSimpleTypes(xsd);

  const annotation = xsd.annotation || xsd['xsd:annotation'];
  const annotationSimpleTypes = annotation ? parseSimpleTypesFromAnnotation(annotation) : [];
  simpleTypes.push(...annotationSimpleTypes);

  const referencedElements = collectReferencedElements(complexTypes);
  elements.push(...referencedElements);

  return {
    targetNamespace: xsd.targetNamespace,
    elementFormDefault: xsd.elementFormDefault,
    elements,
    complexTypes,
    simpleTypes
  };
}

function parseSimpleTypesFromAnnotation(annotation: any): XsdSimpleType[] {
  const types: XsdSimpleType[] = [];
  
  const documentation = annotation.documentation || annotation['xsd:documentation'];

  if (documentation) {
    const simpleTypeArray = Array.isArray(documentation.simpleType) ? documentation.simpleType :
                           Array.isArray(documentation['xsd:simpleType']) ? documentation['xsd:simpleType'] :
                           Array.isArray(documentation['simpleType']) ? documentation['simpleType'] :
                           Array.isArray(documentation['simpleType']) ? documentation['simpleType'] :
                           documentation.simpleType ? [documentation.simpleType] :
                           documentation['xsd:simpleType'] ? [documentation['xsd:simpleType']] :
                           documentation['simpleType'] ? [documentation['simpleType']] : [];
    
    for (const st of simpleTypeArray) {
      const simpleType = parseSimpleType(st, st.name);
      if (simpleType) {
        types.push(simpleType);
      }
    }
  }
  
  return types;
}

function collectReferencedElements(complexTypes: XsdComplexType[]): XsdElement[] {
  const referencedElements: XsdElement[] = [];

  function collectFromElements(elements: XsdElement[]) {
    for (const el of elements) {
      if (el.isRef) {
        const refElement: XsdElement = {
          name: el.ref || el.name || '',
          type: el.type,
          complexType: el.complexType,
          simpleType: el.simpleType,
          attributes: el.attributes,
          minOccurs: el.minOccurs,
          maxOccurs: el.maxOccurs,
          isRef: true,
          ref: el.ref
        };
        referencedElements.push(refElement);
      }
      if (el.complexType) {
        collectFromComplexType(el.complexType);
      }
    }
  }

  function collectFromComplexType(ct: XsdComplexType) {
    if (ct.sequence) {
      collectFromElements(ct.sequence);
    }
    if (ct.choice) {
      collectFromElements(ct.choice);
    }
    if (ct.all) {
      collectFromElements(ct.all);
    }
    if (ct.extension) {
      if (ct.extension.sequence) {
        collectFromElements(ct.extension.sequence);
      }
    }
  }

  for (const ct of complexTypes) {
    collectFromComplexType(ct);
  }

  return referencedElements;
}

function parseElements(xsd: any): XsdElement[] {
  const elements: XsdElement[] = [];

  const elementArray = Array.isArray(xsd.element) ? xsd.element :
                     Array.isArray(xsd['xs:element']) ? xsd['xs:element'] :
                     Array.isArray(xsd['xsd:element']) ? xsd['xsd:element'] :
                     xsd.element ? [xsd.element] :
                     xsd['xs:element'] ? [xsd['xs:element']] :
                     xsd['xsd:element'] ? [xsd['xsd:element']] : [];

  const complexTypes = parseComplexTypes(xsd);

  for (const el of elementArray) {
      let element = parseElement(el);

    if (element && element.type) {
      const complexType = complexTypes.find(ct => ct.name === element.type);
      if (complexType) {
        element.attributes = [...complexType.attributes];
      }
    }

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
    isRef: !!el.ref,
    ref: el.ref,
    nillable: el.nillable === 'true' || el.nillable === true
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
                     Array.isArray(xsd['xsd:complexType']) ? xsd['xsd:complexType'] :
                     xsd.complexType ? [xsd.complexType] :
                     xsd['xs:complexType'] ? [xsd['xs:complexType']] :
                     xsd['xsd:complexType'] ? [xsd['xsd:complexType']] : [];

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

  if (ct.sequence || ct['xs:sequence'] || ct['xsd:sequence']) {
    const seq = ct.sequence || ct['xs:sequence'] || ct['xsd:sequence'];
    const parsedSeq = parseNestedElements(seq, complexType);
    complexType.sequence = parsedSeq;
    complexType.content.push(...parsedSeq);
  }

  if (ct.choice || ct['xs:choice'] || ct['xsd:choice']) {
    const ch = ct.choice || ct['xs:choice'] || ct['xsd:choice'];
    const parsedChoice = parseNestedElements(ch, complexType);
    complexType.choice = parsedChoice;
    complexType.content.push(...parsedChoice);
  }

  if (ct.all || ct['xs:all'] || ct['xsd:all']) {
    const a = ct.all || ct['xs:all'] || ct['xsd:all'];
    const parsedAll = parseNestedElements(a, complexType);
    complexType.all = parsedAll;
    complexType.content.push(...parsedAll);
  }

  if (!!(ct.complexContent?.extension || ct['xs:complexContent']?.['xs:extension'] || ct['xsd:complexContent']?.['xsd:extension'] || ct.simpleContent?.extension || ct['xs:simpleContent']?.['xs:extension'] || ct['xsd:simpleContent']?.['xsd:extension'])) {
    const complexContent = ct.complexContent || ct['xs:complexContent'] || ct['xsd:complexContent'];
    const simpleContent = ct.simpleContent || ct['xs:simpleContent'] || ct['xsd:simpleContent'];
    const ext = complexContent?.extension || complexContent?.['xs:extension'] || complexContent?.['xsd:extension'] || simpleContent?.extension || simpleContent?.['xs:extension'] || simpleContent?.['xsd:extension'];
    const extAttributes = parseAttributes(ext || {});
    complexType.extension = {
      base: ext?.base,
      sequence: (ext?.sequence || ext?.['xs:sequence'] || ext?.['xsd:sequence']) ? parseNestedElements(ext.sequence || ext['xs:sequence'] || ext['xsd:sequence'], complexType) : undefined,
      attributes: extAttributes
    };
    if (complexType.extension?.sequence) {
      complexType.content.push(...complexType.extension.sequence);
    }
    complexType.attributes.push(...extAttributes);
  }

  return complexType;
}

function parseNestedElements(container: any, parentComplexType?: XsdComplexType): XsdElement[] {
  const elements: XsdElement[] = [];
  const elementArray = Array.isArray(container.element) ? container.element :
                     Array.isArray(container['xs:element']) ? container['xs:element'] :
                     Array.isArray(container['xsd:element']) ? container['xsd:element'] :
                     container.element ? [container.element] :
                     container['xs:element'] ? [container['xs:element']] :
                     container['xsd:element'] ? [container['xsd:element']] : [];

  for (const el of elementArray) {  
    const element = parseElement(el);
    if (element) {
      elements.push(element);
    }
  }

  const choiceArray = Array.isArray(container.choice) ? container.choice :
                     Array.isArray(container['xs:choice']) ? container['xs:choice'] :
                     Array.isArray(container['xsd:choice']) ? container['xsd:choice'] :
                     container.choice ? [container.choice] :
                     container['xs:choice'] ? [container['xs:choice']] :
                     container['xsd:choice'] ? [container['xsd:choice']] : [];

  for (const ch of choiceArray) {
    if (parentComplexType && !parentComplexType.choice) {
      parentComplexType.choice = [];
    }
    const choiceElements = parseNestedElements(ch);
    for (const choiceElement of choiceElements) {
      if (choiceElement.complexType && Object.keys(choiceElement.complexType).length > 1) {
        elements.push(choiceElement);
      }
      if (parentComplexType && parentComplexType.choice) {
        parentComplexType.choice.push(choiceElement);
      }
    }
  }

  return elements;
}

function parseSimpleTypes(xsd: any): XsdSimpleType[] {
  const types: XsdSimpleType[] = [];

  const typeArray = Array.isArray(xsd.simpleType) ? xsd.simpleType :
                     Array.isArray(xsd['xs:simpleType']) ? xsd['xs:simpleType'] :
                     Array.isArray(xsd['xsd:simpleType']) ? xsd['xsd:simpleType'] :
                     xsd.simpleType ? [xsd.simpleType] :
                     xsd['xs:simpleType'] ? [xsd['xs:simpleType']] :
                     xsd['xsd:simpleType'] ? [xsd['xsd:simpleType']] : [];

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

  const restriction = st.restriction || st['xs:restriction'] || st['xsd:restriction'] || {};

  return {
    name,
    restriction: {
      base: restriction.base || restriction['xsd:base'] || restriction['xs:base'],
      enumerations: parseEnumerations(restriction),
      minLength: (restriction.minLength?.value || restriction['xs:minLength']?.value || restriction['xsd:minLength']?.value) ? parseInt(restriction.minLength?.value || restriction['xs:minLength']?.value || restriction['xsd:minLength']?.value) : undefined,
      maxLength: (restriction.maxLength?.value || restriction['xs:maxLength']?.value || restriction['xsd:maxLength']?.value) ? parseInt(restriction.maxLength?.value || restriction['xs:maxLength']?.value || restriction['xsd:maxLength']?.value) : undefined,
      pattern: restriction.pattern?.value || restriction['xs:pattern']?.value,
      minInclusive: (restriction.minInclusive?.value || restriction['xs:minInclusive']?.value || restriction['xsd:minInclusive']?.value) ? parseFloat(restriction.minInclusive?.value || restriction['xs:minInclusive']?.value || restriction['xsd:minInclusive']?.value) : undefined,
      maxInclusive: (restriction.maxInclusive?.value || restriction['xs:maxInclusive']?.value || restriction['xsd:maxInclusive']?.value) ? parseFloat(restriction.maxInclusive?.value || restriction['xs:maxInclusive']?.value || restriction['xsd:maxInclusive']?.value) : undefined,
      minExclusive: (restriction.minExclusive?.value || restriction['xs:minExclusive']?.value || restriction['xsd:minExclusive']?.value) ? parseFloat(restriction.minExclusive?.value || restriction['xs:minExclusive']?.value || restriction['xsd:minExclusive']?.value) : undefined,
      maxExclusive: (restriction.maxExclusive?.value || restriction['xs:maxExclusive']?.value || restriction['xsd:maxExclusive']?.value) ? parseFloat(restriction.maxExclusive?.value || restriction['xsd:maxExclusive']?.value || restriction['xsd:maxExclusive']?.value) : undefined,
      totalDigits: (restriction.totalDigits?.value || restriction['xs:totalDigits']?.value || restriction['xsd:totalDigits']?.value) ? parseInt(restriction.totalDigits?.value || restriction['xs:totalDigits']?.value || restriction['xsd:totalDigits']?.value) : undefined,
      fractionDigits: (restriction.fractionDigits?.value || restriction['xs:fractionDigits']?.value || restriction['xsd:fractionDigits']?.value) ? parseInt(restriction.fractionDigits?.value || restriction['xs:fractionDigits']?.value || restriction['xsd:fractionDigits']?.value) : undefined,
      length: (restriction.length?.value || restriction['xs:length']?.value || restriction['xsd:length']?.value) ? parseInt(restriction.length?.value || restriction['xs:length']?.value || restriction['xsd:length']?.value) : undefined,
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

  if (!parent.attribute && !parent['xs:attribute'] && !parent['xsd:attribute']) return attributes;

  const attrArray = Array.isArray(parent.attribute) ? parent.attribute :
                     Array.isArray(parent['xs:attribute']) ? parent['xs:attribute'] :
                     Array.isArray(parent['xsd:attribute']) ? parent['xsd:attribute'] :
                     parent.attribute ? [parent.attribute] :
                     parent['xs:attribute'] ? [parent['xs:attribute']] :
                     parent['xsd:attribute'] ? [parent['xsd:attribute']] : [];

  for (const attr of attrArray) {
    attributes.push({
      name: attr.name,
      type: attr.type,
      use: attr.use || 'optional',
      default: attr.default,
      fixed: attr.fixed,
      simpleType: (attr.simpleType || attr['xs:simpleType'] || attr['xsd:simpleType']) ? (parseSimpleType(attr.simpleType || attr['xs:simpleType'] || attr['xsd:simpleType']) ?? undefined) : undefined
    });
  }

  return attributes;
}
