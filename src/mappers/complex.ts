import type { XsdComplexType, XsdElement, XsdAttribute } from "../parser/types";
import {
  mapPrimitiveType,
  applyFacets,
  mapEnumeration,
  type TypeMapping,
} from "./primitive";
import {
  applyNaming,
  getTypeName,
  getSchemaName,
  type NamingConvention,
} from "../generators/naming";

interface MappedElement {
  name: string;
  tsType: string;
  zodValidator: string;
  optional: boolean | undefined;
  isArray: boolean;
}

interface MappedAttribute {
  name: string;
  tsType: string;
  zodValidator: string;
  optional: boolean;
}

export function mapComplexType(
  complexType: XsdComplexType,
  naming: NamingConvention,
  schema: any,
): {
  typeName: string;
  schemaName: string;
  tsInterface: string;
  zodObject: string;
} {
  const elements = mapElements(complexType.content, naming, schema);
  const attributes = mapAttributes(complexType.attributes, naming, schema);

  const typeName = complexType.name
    ? getTypeName(complexType.name, naming)
    : "AnonymousType";
  const schemaName = complexType.name
    ? getSchemaName(complexType.name, naming)
    : "anonymousSchema";

  const allFields = [...elements, ...attributes];

  const tsInterface =
    allFields.length > 0
      ? `{\n${allFields.map((f) => `  ${f.name}${f.optional ? "?" : ""}: ${f.tsType}`).join(",\n")}\n}`
      : "{}";

  const zodObject =
    allFields.length > 0
      ? `z.object({\n${allFields.map((f) => `  ${f.name}: ${f.zodValidator}${f.optional ? ".optional()" : ""}`).join(",\n")}\n})`
      : "z.object({})";

  return { typeName, schemaName, tsInterface, zodObject };
}

export function mapElement(
  element: XsdElement,
  naming: NamingConvention,
  schema: any,
): MappedElement {
  const name = applyNaming(element.name, naming);
  const optional = element.minOccurs === 0;
  const isArray =
    element.maxOccurs === "unbounded" ||
    (typeof element.maxOccurs === "number" && element.maxOccurs > 1);

  let typeMapping: TypeMapping;

  if (element.complexType) {
    const complex = mapComplexType(element.complexType, naming, schema);
    typeMapping = {
      tsType: complex.typeName,
      zodValidator: complex.schemaName,
    };
  } else if (element.simpleType) {
    if (element.simpleType.restriction.enumerations) {
      typeMapping = mapEnumeration(element.simpleType, naming);
    } else {
      const base = mapPrimitiveType(element.simpleType.restriction.base);
      typeMapping = applyFacets(base, element.simpleType.restriction, naming);
    }
  } else if (element.type) {
    const customType = findCustomType(element.type, schema);
    if (customType) {
      typeMapping = {
        tsType: getTypeName(customType.name, naming),
        zodValidator: getSchemaName(customType.name, naming),
      };
    } else {
      typeMapping = mapPrimitiveType(element.type);
    }
  } else {
    typeMapping = { tsType: "any", zodValidator: "z.any()" };
  }

  if (isArray) {
    typeMapping.tsType = `${typeMapping.tsType}[]`;
    typeMapping.zodValidator = `z.array(${typeMapping.zodValidator})`;
  }

  return {
    name,
    tsType: typeMapping.tsType,
    zodValidator: typeMapping.zodValidator,
    optional,
    isArray,
  };
}

export function mapElements(
  elements: XsdElement[],
  naming: NamingConvention,
  schema: any,
): MappedElement[] {
  return elements.map((el) => mapElement(el, naming, schema));
}

export function mapAttribute(
  attribute: XsdAttribute,
  naming: NamingConvention,
  schema: any,
): MappedAttribute {
  const name = applyNaming(attribute.name, naming);
  const optional = attribute.use === undefined || attribute.use === "optional";

  let typeMapping: TypeMapping;

  if (attribute.simpleType) {
    if (attribute.simpleType.restriction.enumerations) {
      typeMapping = mapEnumeration(attribute.simpleType, naming);
    } else {
      const base = mapPrimitiveType(attribute.simpleType.restriction.base);
      typeMapping = applyFacets(base, attribute.simpleType.restriction, naming);
    }
  } else if (attribute.type) {
    const customType = findCustomType(attribute.type, schema);
    if (customType) {
      typeMapping = {
        tsType: getTypeName(customType.name, naming),
        zodValidator: getSchemaName(customType.name, naming),
      };
    } else {
      typeMapping = mapPrimitiveType(attribute.type);
    }
  } else {
    typeMapping = { tsType: "string", zodValidator: "z.string()" };
  }

  return {
    name,
    tsType: typeMapping.tsType,
    zodValidator: typeMapping.zodValidator,
    optional,
  };
}

export function mapAttributes(
  attributes: XsdAttribute[],
  naming: NamingConvention,
  schema: any,
): MappedAttribute[] {
  return attributes.map((attr) => mapAttribute(attr, naming, schema));
}

function findCustomType(typeName: string, schema: any): any {
  const complexType = schema.complexTypes.find(
    (ct: any) => ct.name === typeName,
  );
  if (complexType) return complexType;

  const simpleType = schema.simpleTypes.find((st: any) => st.name === typeName);
  if (simpleType) return simpleType;

  return null;
}
