import type { XsdSchema } from "../parser";
import {
  mapComplexType,
  mapEnumeration,
  applyFacets,
  mapPrimitiveType,
} from "../mappers";
import { getSchemaName, type NamingConvention } from "./naming";

export function generateValidators(
  schema: XsdSchema,
  naming: NamingConvention,
): string {
  const imports = `import { z } from 'zod';\n\n`;
  const comment = `// Generated Zod validators from XSD schema\n// Do not edit manually\n\n`;

  const sortedSimpleTypes = topologicalSortSimpleTypes(schema, naming);
  const sortedComplexTypes = topologicalSortComplexTypes(schema, naming);
  const simpleTypeValidators = generateSimpleTypeValidators(
    schema,
    naming,
    sortedSimpleTypes,
  );
  const complexTypeValidators = generateComplexTypeValidators(
    schema,
    naming,
    sortedComplexTypes,
  );
  const elementValidators = generateElementValidators(schema, naming);

  return `${imports}${comment}${simpleTypeValidators}\n\n${complexTypeValidators}\n\n${elementValidators}`;
}

function topologicalSortSimpleTypes(
  schema: XsdSchema,
  naming: NamingConvention,
): typeof schema.simpleTypes {
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

function topologicalSortComplexTypes(
  schema: XsdSchema,
  naming: NamingConvention,
): typeof schema.complexTypes {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const result: any[] = [];
  const nameToIndex = new Map<string, number>();

  schema.complexTypes.forEach((ct, idx) => {
    if (ct.name) nameToIndex.set(ct.name, idx);
  });

  function visit(complexType: any) {
    if (!complexType.name) return;

    if (visited.has(complexType.name)) return;
    if (visiting.has(complexType.name)) {
      console.warn(
        `Circular dependency detected involving ${complexType.name}`,
      );
      return;
    }

    visiting.add(complexType.name);

    const mapped = mapComplexType({ ...complexType }, naming, { ...schema });
    const currentSchemaName = getSchemaName(complexType.name, naming);

    const zodObject = mapped.zodObject;
    const schemaRegex = /([A-Z][a-zA-Z0-9]*)Schema/g;
    let match;

    const dependencies: string[] = [];
    while ((match = schemaRegex.exec(zodObject)) !== null) {
      const depName = match[1];
      if (depName !== currentSchemaName.replace("Schema", "")) {
        dependencies.push(depName);
      }
    }

    for (const depName of dependencies) {
      const depIndex = nameToIndex.get(depName);
      if (depIndex !== undefined) {
        visit(schema.complexTypes[depIndex]);
      }
    }

    visiting.delete(complexType.name);
    visited.add(complexType.name);
    result.push(complexType);
  }

  for (const complexType of schema.complexTypes) {
    visit(complexType);
  }

  return result;
}

function generateSimpleTypeValidators(
  schema: XsdSchema,
  naming: NamingConvention,
  sortedSimpleTypes?: typeof schema.simpleTypes,
): string {
  const validators: string[] = [];
  const simpleTypesToProcess = sortedSimpleTypes || schema.simpleTypes;

  for (const simpleType of simpleTypesToProcess) {
    if (!simpleType.name) continue;

    const schemaName = getSchemaName(simpleType.name, naming);

    if (simpleType.restriction.enumerations) {
      const mapped = mapEnumeration(simpleType, naming);
      validators.push(`export const ${schemaName} = ${mapped.zodValidator};`);
    } else if (simpleType.restriction.base) {
      const baseTypeName = simpleType.restriction.base;

      const customBaseType = schema.simpleTypes.find(
        (st) => st.name === baseTypeName,
      );

      if (customBaseType) {
        const baseSchemaName = getSchemaName(baseTypeName, naming);
        const facets = simpleType.restriction;
        let zodValidator = baseSchemaName;

        if (facets.minLength) {
          zodValidator = `${zodValidator}.min(${facets.minLength})`;
        }
        if (facets.maxLength) {
          zodValidator = `${zodValidator}.max(${facets.maxLength})`;
        }
        if (facets.length) {
          zodValidator = `${zodValidator}.length(${facets.length})`;
        }
        if (facets.pattern) {
          const escapedPattern = facets.pattern.replace(/\\/g, "\\\\");
          zodValidator = `${zodValidator}.regex(/${escapedPattern}/)`;
        }
        if (facets.minInclusive !== undefined) {
          zodValidator = `${zodValidator}.min(${facets.minInclusive})`;
        }
        if (facets.maxInclusive !== undefined) {
          zodValidator = `${zodValidator}.max(${facets.maxInclusive})`;
        }
        if (facets.minExclusive !== undefined) {
          zodValidator = `${zodValidator}.gt(${facets.minExclusive})`;
        }
        if (facets.maxExclusive !== undefined) {
          zodValidator = `${zodValidator}.lt(${facets.maxExclusive})`;
        }

        validators.push(`export const ${schemaName} = ${zodValidator};`);
      } else {
        const base = mapPrimitiveType(baseTypeName);
        const mapped = applyFacets(base, simpleType.restriction, naming);
        validators.push(`export const ${schemaName} = ${mapped.zodValidator};`);
      }
    }
  }

  return validators.join("\n");
}

function generateComplexTypeValidators(
  schema: XsdSchema,
  naming: NamingConvention,
  sortedComplexTypes?: typeof schema.complexTypes,
): string {
  const validators: string[] = [];
  const complexTypesToProcess = sortedComplexTypes || schema.complexTypes;

  for (const complexType of complexTypesToProcess) {
    if (!complexType.name) continue;

    const mapped = mapComplexType({ ...complexType }, naming, { ...schema });
    validators.push(`export const ${mapped.schemaName} = ${mapped.zodObject};`);
  }

  return validators.join("\n");
}

function generateElementValidators(
  schema: XsdSchema,
  naming: NamingConvention,
): string {
  const validators: string[] = [];
  const processedElements = new Set<string>();

  function processElement(element: any, depth: number = 0) {
    if (!element || !element.name || processedElements.has(element.name)) {
      return;
    }

    const schemaName = getSchemaName(element.name, naming);

    if (element.complexType) {
      processedElements.add(element.name);
      const mapped = mapComplexType({ ...element.complexType }, naming, {
        ...schema,
      });
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
      const customType =
        { ...schema }.complexTypes.find((ct) => ct.name === element.type) ||
        { ...schema }.simpleTypes.find((st) => st.name === element.type);

      if (customType && customType.name) {
        processedElements.add(element.name);
        const customSchemaName = getSchemaName(customType.name, naming);

        if (schemaName !== customSchemaName) {
          validators.push(`export const ${schemaName} = ${customSchemaName};`);
        }
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

  return validators.join("\n");
}
