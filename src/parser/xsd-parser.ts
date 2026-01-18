import { XMLParser } from 'fast-xml-parser';
import type { XsdSchema, XsdElement, XsdComplexType, XsdSimpleType, XsdAttribute } from './types';
import { extractNamespaces, stripNamespace, getAsArray, getTypeValue } from './namespace';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: false,
  trimValues: true,
  textNodeName: '_text'
});

export function parseXsd(xsdContent: string): XsdSchema {
  const parsed = parser.parse(xsdContent);

  const xsd = findSchemaElement(parsed);

  const namespaceContext = extractNamespaces(xsd);
  const { xsdPrefix } = namespaceContext;

  if (!xsdPrefix) {
    console.warn('Warning: Could not detect XSD namespace prefix. Schema parsing may fail.');
  }

  const elements = parseElements(xsd, xsdPrefix || undefined);
  const complexTypes = parseComplexTypes(xsd, xsdPrefix || undefined);
  const simpleTypes = parseSimpleTypes(xsd, xsdPrefix || undefined);

  const annotation = getTypeValue(xsd, 'annotation', xsdPrefix || undefined);
  const annotationSimpleTypes = annotation ? parseSimpleTypesFromAnnotation(annotation, xsdPrefix || undefined) : [];
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

function findSchemaElement(parsed: any): any {
  const schemaKeys = Object.keys(parsed).filter(k => k === 'schema' || k.endsWith(':schema'));
  if (schemaKeys.length === 1) {
    return parsed[schemaKeys[0]];
  }
  if (schemaKeys.length > 1) {
    console.warn(`Multiple schema elements found: ${schemaKeys.join(', ')}. Using first.`);
    return parsed[schemaKeys[0]];
  }
  return parsed;
}

function parseSimpleTypesFromAnnotation(annotation: any, xsdPrefix: string | undefined): XsdSimpleType[] {
  const types: XsdSimpleType[] = [];
  
  const documentation = getTypeValue(annotation, 'documentation', xsdPrefix);
  
  if (documentation) {
    const simpleTypeArray = getAsArray(documentation, 'simpleType', xsdPrefix);

    for (const st of simpleTypeArray) {
      const simpleType = parseSimpleType(st, xsdPrefix, st.name);
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
          ref: el.ref,
          nillable: el.nillable
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

function parseElements(xsd: any, xsdPrefix: string | undefined): XsdElement[] {
  const elements: XsdElement[] = [];

  const elementArray = getAsArray(xsd, 'element', xsdPrefix);
  const complexTypes = parseComplexTypes(xsd, xsdPrefix);

  for (const el of elementArray) {
      let element = parseElement(el, xsdPrefix);

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

function parseElement(el: any, xsdPrefix: string | undefined): XsdElement | null {
  if (!el) return null;

  const element: XsdElement = {
    name: el.name,
    type: el.type ? stripNamespace(el.type) : undefined,
    attributes: parseAttributes(el, xsdPrefix),
    minOccurs: el.minOccurs !== undefined ? parseInt(el.minOccurs) : undefined,
    maxOccurs: el.maxOccurs === 'unbounded' ? 'unbounded' : el.maxOccurs !== undefined ? parseInt(el.maxOccurs) : undefined,
    isRef: !!el.ref,
    ref: el.ref,
    nillable: el.nillable === 'true' || el.nillable === true
  };

  const complexType = getTypeValue(el, 'complexType', xsdPrefix);
  if (complexType) {
    element.complexType = parseComplexType(complexType, xsdPrefix, el.name) ?? undefined;
  }

  const simpleType = getTypeValue(el, 'simpleType', xsdPrefix);
  if (simpleType) {
    element.simpleType = parseSimpleType(simpleType, xsdPrefix, el.name) ?? undefined;
  }

  return element;
}

function parseComplexTypes(xsd: any, xsdPrefix: string | undefined): XsdComplexType[] {
  const types: XsdComplexType[] = [];

  const typeArray = getAsArray(xsd, 'complexType', xsdPrefix);

  for (const ct of typeArray) {
    const complexType = parseComplexType(ct, xsdPrefix, ct.name);
    if (complexType) {
      types.push(complexType);
    }
  }

  return types;
}

function parseComplexType(ct: any, xsdPrefix: string | undefined, name?: string): XsdComplexType | null {
  if (!ct) return null;

  const complexType: XsdComplexType = {
    name,
    attributes: parseAttributes(ct, xsdPrefix),
    content: []
  };

  const sequence = getTypeValue(ct, 'sequence', xsdPrefix);
  if (sequence) {
    const parsedSeq = parseNestedElements(sequence, complexType, xsdPrefix);
    complexType.sequence = parsedSeq;
    complexType.content.push(...parsedSeq);
  }

  const choice = getTypeValue(ct, 'choice', xsdPrefix);
  if (choice) {
    const parsedChoice = parseNestedElements(choice, complexType, xsdPrefix);
    complexType.choice = parsedChoice;
    complexType.content.push(...parsedChoice);
  }

  const all = getTypeValue(ct, 'all', xsdPrefix);
  if (all) {
    const parsedAll = parseNestedElements(all, complexType, xsdPrefix);
    complexType.all = parsedAll;
    complexType.content.push(...parsedAll);
  }

  const complexContent = getTypeValue(ct, 'complexContent', xsdPrefix);
  const simpleContent = getTypeValue(ct, 'simpleContent', xsdPrefix);

  if (complexContent || simpleContent) {
    const content = complexContent || simpleContent;
    const ext = getTypeValue(content, 'extension', xsdPrefix);

    if (ext) {
      const extAttributes = parseAttributes(ext, xsdPrefix);
      const extSequence = getTypeValue(ext, 'sequence', xsdPrefix);

      complexType.extension = {
        base: ext.base ? stripNamespace(ext.base) : undefined,
        sequence: extSequence ? parseNestedElements(extSequence, complexType, xsdPrefix) : undefined,
        attributes: extAttributes
      };
      if (complexType.extension?.sequence) {
        complexType.content.push(...complexType.extension.sequence);
      }
      complexType.attributes.push(...extAttributes);
    }
  }

  return complexType;
}

function parseNestedElements(container: any, parentComplexType?: XsdComplexType, xsdPrefix?: string): XsdElement[] {
  const elements: XsdElement[] = [];
  const elementArray = getAsArray(container, 'element', xsdPrefix);

  for (const el of elementArray) {
    const element = parseElement(el, xsdPrefix);
    if (element) {
      elements.push(element);
    }
  }

  const choiceArray = getAsArray(container, 'choice', xsdPrefix);

  for (const ch of choiceArray) {
    if (parentComplexType && !parentComplexType.choice) {
      parentComplexType.choice = [];
    }
    const choiceElements = parseNestedElements(ch, parentComplexType, xsdPrefix);
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

function parseSimpleTypes(xsd: any, xsdPrefix: string | undefined): XsdSimpleType[] {
  const types: XsdSimpleType[] = [];

  const typeArray = getAsArray(xsd, 'simpleType', xsdPrefix);

  for (const st of typeArray) {
    const simpleType = parseSimpleType(st, xsdPrefix, st.name);
    if (simpleType) {
      types.push(simpleType);
    }
  }

  return types;
}

function parseSimpleType(st: any, xsdPrefix: string | undefined, name?: string): XsdSimpleType | null {
  if (!st) return null;

  const restriction = getTypeValue(st, 'restriction', xsdPrefix) || {};

  return {
    name,
    restriction: {
      base: stripNamespace(restriction.base || ''),
      enumerations: parseEnumerations(restriction, xsdPrefix),
      minLength: parseFacetValue(restriction, 'minLength', parseInt, xsdPrefix),
      maxLength: parseFacetValue(restriction, 'maxLength', parseInt, xsdPrefix),
      pattern: parseFacetValue(restriction, 'pattern', (v) => v, xsdPrefix),
      minInclusive: parseFacetValue(restriction, 'minInclusive', parseFloat, xsdPrefix),
      maxInclusive: parseFacetValue(restriction, 'maxInclusive', parseFloat, xsdPrefix),
      minExclusive: parseFacetValue(restriction, 'minExclusive', parseFloat, xsdPrefix),
      maxExclusive: parseFacetValue(restriction, 'maxExclusive', parseFloat, xsdPrefix),
      totalDigits: parseFacetValue(restriction, 'totalDigits', parseInt, xsdPrefix),
      fractionDigits: parseFacetValue(restriction, 'fractionDigits', parseInt, xsdPrefix),
      length: parseFacetValue(restriction, 'length', parseInt, xsdPrefix),
      whiteSpace: parseFacetValue(restriction, 'whiteSpace', (v) => v, xsdPrefix)
    }
  };
}

function parseFacetValue(restriction: any, facetName: string, parser: (v: any) => any, xsdPrefix: string | undefined): any {
  const facet = getTypeValue(restriction, facetName, xsdPrefix);
  if (facet) {
    const value = facet.value;
    return value !== undefined ? parser(value) : undefined;
  }
  return undefined;
}

function parseEnumerations(restriction: any, xsdPrefix: string | undefined): string[] | undefined {
  const enumerationArray = getAsArray(restriction, 'enumeration', xsdPrefix);
  
  if (enumerationArray.length === 0) return undefined;
  
  return enumerationArray.map((e: any) => e.value || e);
}

function parseAttributes(parent: any, xsdPrefix: string | undefined): XsdAttribute[] {
  const attributes: XsdAttribute[] = [];

  const attrArray = getAsArray(parent, 'attribute', xsdPrefix);

  for (const attr of attrArray) {
    const simpleTypeValue = getTypeValue(attr, 'simpleType', xsdPrefix);
    
    attributes.push({
      name: attr.name,
      type: attr.type,
      use: attr.use || 'optional',
      default: attr.default,
      fixed: attr.fixed,
      simpleType: simpleTypeValue ? (parseSimpleType(simpleTypeValue, xsdPrefix, attr.name) ?? undefined) : undefined
    });
  }

  return attributes;
}
