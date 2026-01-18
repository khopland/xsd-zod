import type { XsdSchema } from '../parser';
import { mapComplexType, mapEnumeration, applyFacets, mapPrimitiveType } from '../mappers';
import { getSchemaName, type NamingConvention } from './naming';

export function generateValidators(schema: XsdSchema, naming: NamingConvention): string {
  const imports = `import { z } from 'zod';\n\n`;
  const comment = `// Generated Zod validators from XSD schema\n// Do not edit manually\n\n`;
  
  const simpleTypeValidators = generateSimpleTypeValidators(schema, naming);
  const complexTypeValidators = generateComplexTypeValidators(schema, naming);
  const elementValidators = generateElementValidators(schema, naming);

  return `${imports}${comment}${simpleTypeValidators}\n\n${complexTypeValidators}\n\n${elementValidators}`;
}

function generateSimpleTypeValidators(schema: XsdSchema, naming: NamingConvention): string {
  const validators: string[] = [];

  for (const simpleType of schema.simpleTypes) {
    if (!simpleType.name) continue;

    const schemaName = getSchemaName(simpleType.name, naming);

    if (simpleType.restriction.enumerations) {
      const mapped = mapEnumeration(simpleType, naming);
      validators.push(`export const ${schemaName} = ${mapped.zodValidator};`);
    } else if (simpleType.restriction.base) {
      const base = mapPrimitiveType(simpleType.restriction.base);
      const mapped = applyFacets(base, simpleType.restriction, naming);
      validators.push(`export const ${schemaName} = ${mapped.zodValidator};`);
    }
  }

  return validators.join('\n');
}

function generateComplexTypeValidators(schema: XsdSchema, naming: NamingConvention): string {
  const validators: string[] = [];
  
  for (const complexType of schema.complexTypes) {
    if (!complexType.name) continue;
    
    const mapped = mapComplexType({ ...complexType }, naming, { ...schema });
    validators.push(`export const ${mapped.schemaName} = ${mapped.zodObject};`);
  }
  
  return validators.join('\n');
}

function generateElementValidators(schema: XsdSchema, naming: NamingConvention): string {
  const validators: string[] = [];
  const processedElements = new Set<string>();

  function processElement(element: any, depth: number = 0) {
    if (!element || !element.name || processedElements.has(element.name)) {
      return;
    }

    const schemaName = getSchemaName(element.name, naming);

    if (element.complexType) {
      processedElements.add(element.name);
      const mapped = mapComplexType({ ...element.complexType }, naming, { ...schema });
      validators.push(`export const ${schemaName} = ${mapped.zodObject};`);

      if (element.complexType.content) {
        for (const childElement of element.complexType.content) {
          processElement(childElement, depth + 1);
        }
      }
    } else if (element.simpleType) {
      processedElements.add(element.name);
      const st = { ...element.simpleType };

      if (st.restriction.enumerations) {
        const mapped = mapEnumeration(st, naming);
        validators.push(`export const ${schemaName} = ${mapped.zodValidator};`);
      } else if (st.restriction.base) {
        const base = mapPrimitiveType(st.restriction.base);
        const mapped = applyFacets(base, st.restriction, naming);
        validators.push(`export const ${schemaName} = ${mapped.zodValidator};`);
      }
    } else if (element.type) {
      const customType = { ...schema }.complexTypes.find(ct => ct.name === element.type) ||
                        { ...schema }.simpleTypes.find(st => st.name === element.type);

      if (customType && customType.name) {
        processedElements.add(element.name);
        const customSchemaName = getSchemaName(customType.name, naming);
        validators.push(`export const ${schemaName} = ${customSchemaName};`);
      } else {
        processedElements.add(element.name);
        const mapped = mapPrimitiveType(element.type);
        validators.push(`export const ${schemaName} = ${mapped.zodValidator};`);
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

  return validators.join('\n');
}
