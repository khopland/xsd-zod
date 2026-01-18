import type { XsdSchema } from '../parser';
import { mapComplexType, mapPrimitiveType } from '../mappers';
import { getTypeName, type NamingConvention } from './naming';

export function generateTypes(schema: XsdSchema, naming: NamingConvention): string {
  const imports = `// Generated TypeScript types from XSD schema\n// Do not edit manually\n\n`;

  const simpleTypes = generateSimpleTypes(schema, naming);
  const complexTypes = generateComplexTypes(schema, naming);
  const elementTypes = generateElementTypes(schema, naming);

  return `${imports}${simpleTypes}\n\n${complexTypes}\n\n${elementTypes}`;
}

function generateSimpleTypes(schema: XsdSchema, naming: NamingConvention): string {
  const types: string[] = [];

  for (const simpleType of schema.simpleTypes) {
    if (!simpleType.name) continue;

    const typeName = getTypeName(simpleType.name, naming);

    if (simpleType.restriction.enumerations) {
      const values = simpleType.restriction.enumerations.map(v => `'${v}'`).join(' | ');
      types.push(`export type ${typeName} = ${values};`);
    } else if (simpleType.restriction.base) {
      const base = simpleType.restriction.base;
      const mapping = mapPrimitiveType(base);
      types.push(`export type ${typeName} = ${mapping.tsType};`);
    }
  }

  return types.join('\n');
}

function generateComplexTypes(schema: XsdSchema, naming: NamingConvention): string {
  const types: string[] = [];
  
  for (const complexType of schema.complexTypes) {
    if (!complexType.name) continue;
    
    const mapped = mapComplexType({ ...complexType }, naming, { ...schema });
    types.push(`export interface ${mapped.typeName} ${mapped.tsInterface}`);
  }
  
  return types.join('\n');
}

function generateElementTypes(schema: XsdSchema, naming: NamingConvention): string {
  const types: string[] = [];
  const processedElements = new Set<string>();

  function processElement(element: any, depth: number = 0) {
    if (!element || !element.name || processedElements.has(element.name)) {
      return;
    }

    if (element.complexType) {
      processedElements.add(element.name);
      const mapped = mapComplexType({ ...element.complexType }, naming, { ...schema });
      const typeName = getTypeName(element.name, naming);
      types.push(`export interface ${typeName} ${mapped.tsInterface}`);

      if (element.complexType.content) {
        for (const childElement of element.complexType.content) {
          processElement(childElement, depth + 1);
        }
      }
    } else if (element.simpleType) {
      processedElements.add(element.name);
      const st = { ...element.simpleType };
      const typeName = getTypeName(element.name, naming);

      if (st.restriction.enumerations) {
        const values = st.restriction.enumerations.map((v: string) => `'${v}'`).join(' | ');
        types.push(`export type ${typeName} = ${values};`);
      } else {
        const base = st.restriction.base;
        if (base.includes('int') || base.includes('decimal')) {
          types.push(`export type ${typeName} = number;`);
        } else if (base === 'xs:boolean') {
          types.push(`export type ${typeName} = boolean;`);
        } else {
          types.push(`export type ${typeName} = string;`);
        }
      }
    } else if (element.type) {
      const customType = { ...schema }.complexTypes.find(ct => ct.name === element.type) ||
                        { ...schema }.simpleTypes.find(st => st.name === element.type);

      if (customType && customType.name) {
        processedElements.add(element.name);
        const typeName = getTypeName(element.name, naming);
        const customTypeName = getTypeName(customType.name, naming);
        types.push(`export type ${typeName} = ${customTypeName};`);
      } else {
        processedElements.add(element.name);
        const typeName = getTypeName(element.name, naming);
        const base = element.type;
        if (base.includes('int') || base.includes('decimal')) {
          types.push(`export type ${typeName} = number;`);
        } else if (base === 'xs:boolean') {
          types.push(`export type ${typeName} = boolean;`);
        } else {
          types.push(`export type ${typeName} = string;`);
        }
      }
    }
  }

  for (const element of schema.elements) {
    processElement(element);
  }

  for (const complexType of schema.complexTypes) {
    if (complexType.content) {
      for (const element of complexType.content) {
        processElement(element);
      }
    }
  }

  return types.join('\n');
}
