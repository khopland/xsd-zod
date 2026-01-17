import type { XsdSchema } from '../parser';
import { mapComplexType } from '../mappers';
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
      if (base.includes('int') || base.includes('decimal') || base.includes('float') || base.includes('double')) {
        types.push(`export type ${typeName} = number;`);
      } else if (base === 'xs:boolean') {
        types.push(`export type ${typeName} = boolean;`);
      } else {
        types.push(`export type ${typeName} = string;`);
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
  
  for (const element of schema.elements) {
    if (element.complexType) {
      const mapped = mapComplexType({ ...element.complexType }, naming, { ...schema });
      const typeName = getTypeName(element.name, naming);
      types.push(`export interface ${typeName} ${mapped.tsInterface}`);
    } else if (element.simpleType) {
      const st = { ...element.simpleType };
      const typeName = getTypeName(element.name, naming);
      
      if (st.restriction.enumerations) {
        const values = st.restriction.enumerations.map(v => `'${v}'`).join(' | ');
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
        const typeName = getTypeName(element.name, naming);
        const customTypeName = getTypeName(customType.name, naming);
        types.push(`export type ${typeName} = ${customTypeName};`);
      } else {
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
  
  return types.join('\n');
}
