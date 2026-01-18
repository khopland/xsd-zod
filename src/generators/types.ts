import type { XsdSchema } from '../parser';
import { mapComplexType, mapPrimitiveType } from '../mappers';
import { getTypeName, type NamingConvention } from './naming';

export function generateTypes(schema: XsdSchema, naming: NamingConvention): string {
  const imports = `// Generated TypeScript types from XSD schema\n// Do not edit manually\n\n`;

  const sortedSimpleTypes = topologicalSortSimpleTypes(schema, naming);
  const simpleTypes = generateSimpleTypes(schema, naming, sortedSimpleTypes);
  const complexTypes = generateComplexTypes(schema, naming);
  const elementTypes = generateElementTypes(schema, naming);

  return `${imports}${simpleTypes}\n\n${complexTypes}\n\n${elementTypes}`;
}

function topologicalSortSimpleTypes(schema: XsdSchema, naming: NamingConvention): typeof schema.simpleTypes {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const result: any[] = [];
  const nameToIndex = new Map<string, number>();
  
  schema.simpleTypes.forEach((st, idx) => {
    if (st.name) nameToIndex.set(st.name, idx);
  });
  
  function visit(simpleType: any) {
    if (!simpleType.name) return;
    
    if (visited.has(simpleType.name)) return;
    if (visiting.has(simpleType.name)) {
      console.warn(`Circular dependency detected involving ${simpleType.name}`);
      return;
    }
    
    visiting.add(simpleType.name);
    
    const baseTypeName = simpleType.restriction?.base;
    if (baseTypeName) {
      const depIndex = nameToIndex.get(baseTypeName);
      if (depIndex !== undefined) {
        visit(schema.simpleTypes[depIndex]);
      }
    }
    
    visiting.delete(simpleType.name);
    visited.add(simpleType.name);
    result.push(simpleType);
  }
  
  for (const simpleType of schema.simpleTypes) {
    visit(simpleType);
  }
  
  return result;
}

function generateSimpleTypes(schema: XsdSchema, naming: NamingConvention, sortedSimpleTypes?: typeof schema.simpleTypes): string {
  const types: string[] = [];
  const simpleTypesToProcess = sortedSimpleTypes || schema.simpleTypes;

  for (const simpleType of simpleTypesToProcess) {
    if (!simpleType.name) continue;

    const typeName = getTypeName(simpleType.name, naming);

    if (simpleType.restriction.enumerations) {
      const values = simpleType.restriction.enumerations.map(v => `'${v}'`).join(' | ');
      types.push(`export type ${typeName} = ${values};`);
    } else if (simpleType.restriction.base) {
      const baseTypeName = simpleType.restriction.base;
      
      const customBaseType = schema.simpleTypes.find(st => st.name === baseTypeName);
      
      if (customBaseType) {
        const baseTypeNameResolved = getTypeName(baseTypeName, naming);
        types.push(`export type ${typeName} = ${baseTypeNameResolved};`);
      } else {
        const mapping = mapPrimitiveType(baseTypeName);
        types.push(`export type ${typeName} = ${mapping.tsType};`);
      }
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
        
        if (typeName !== customTypeName) {
          types.push(`export type ${typeName} = ${customTypeName};`);
        }
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
