import type { XsdSimpleType } from '../parser/types';
import type { NamingConvention } from '../generators/naming';

export interface TypeMapping {
  tsType: string;
  zodValidator: string;
}

const PRIMITIVE_TYPE_MAP: Record<string, TypeMapping> = {
  'xs:string': { tsType: 'string', zodValidator: 'z.string()' },
  'string': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:int': { tsType: 'number', zodValidator: 'z.number().int()' },
  'int': { tsType: 'number', zodValidator: 'z.number().int()' },
  'xs:integer': { tsType: 'number', zodValidator: 'z.number().int()' },
  'integer': { tsType: 'number', zodValidator: 'z.number().int()' },
  'xs:decimal': { tsType: 'number', zodValidator: 'z.number()' },
  'decimal': { tsType: 'number', zodValidator: 'z.number()' },
  'xs:float': { tsType: 'number', zodValidator: 'z.number()' },
  'float': { tsType: 'number', zodValidator: 'z.number()' },
  'xs:double': { tsType: 'number', zodValidator: 'z.number()' },
  'double': { tsType: 'number', zodValidator: 'z.number()' },
  'xs:boolean': { tsType: 'boolean', zodValidator: 'z.boolean()' },
  'boolean': { tsType: 'boolean', zodValidator: 'z.boolean()' },
  'xs:date': { tsType: 'string', zodValidator: 'z.string().date()' },
  'date': { tsType: 'string', zodValidator: 'z.string().date()' },
  'xs:dateTime': { tsType: 'string', zodValidator: 'z.string().datetime()' },
  'dateTime': { tsType: 'string', zodValidator: 'z.string().datetime()' },
  'xs:time': { tsType: 'string', zodValidator: 'z.string().time()' },
  'time': { tsType: 'string', zodValidator: 'z.string().time()' },
  'xs:anyURI': { tsType: 'string', zodValidator: 'z.string().url()' },
  'anyURI': { tsType: 'string', zodValidator: 'z.string().url()' },
  'xs:base64Binary': { tsType: 'string', zodValidator: 'z.string()' },
  'base64Binary': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:hexBinary': { tsType: 'string', zodValidator: 'z.string()' },
  'hexBinary': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:duration': { tsType: 'string', zodValidator: 'z.string()' },
  'duration': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:gDay': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:gMonth': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:gMonthDay': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:gYear': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:gYearMonth': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:ID': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:IDREF': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:ENTITY': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:NMTOKEN': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:normalizedString': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:token': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:language': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:Name': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:NCName': { tsType: 'string', zodValidator: 'z.string()' },
  'xs:anyType': { tsType: 'any', zodValidator: 'z.any()' },
  'anyType': { tsType: 'any', zodValidator: 'z.any()' },
  'xs:anySimpleType': { tsType: 'any', zodValidator: 'z.any()' },
  'anySimpleType': { tsType: 'any', zodValidator: 'z.any()' },
  'xs:positiveInteger': { tsType: 'number', zodValidator: 'z.number().int().positive()' },
  'positiveInteger': { tsType: 'number', zodValidator: 'z.number().int().positive()' },
  'xs:nonNegativeInteger': { tsType: 'number', zodValidator: 'z.number().int().nonnegative()' },
  'nonNegativeInteger': { tsType: 'number', zodValidator: 'z.number().int().nonnegative()' },
  'xs:negativeInteger': { tsType: 'number', zodValidator: 'z.number().int().negative()' },
  'negativeInteger': { tsType: 'number', zodValidator: 'z.number().int().negative()' },
  'xs:nonPositiveInteger': { tsType: 'number', zodValidator: 'z.number().int().nonpositive()' },
  'nonPositiveInteger': { tsType: 'number', zodValidator: 'z.number().int().nonpositive()' },
  'xs:long': { tsType: 'number', zodValidator: 'z.number().int()' },
  'long': { tsType: 'number', zodValidator: 'z.number().int()' },
  'xs:short': { tsType: 'number', zodValidator: 'z.number().int()' },
  'short': { tsType: 'number', zodValidator: 'z.number().int()' },
  'xs:byte': { tsType: 'number', zodValidator: 'z.number().int()' },
  'byte': { tsType: 'number', zodValidator: 'z.number().int()' },
  'xs:unsignedLong': { tsType: 'number', zodValidator: 'z.number().int().nonnegative()' },
  'xs:unsignedInt': { tsType: 'number', zodValidator: 'z.number().int().nonnegative()' },
  'xs:unsignedShort': { tsType: 'number', zodValidator: 'z.number().int().nonnegative()' },
  'xs:unsignedByte': { tsType: 'number', zodValidator: 'z.number().int().nonnegative()' }
};

export function mapPrimitiveType(xsdType: string): TypeMapping {
  const mapping = PRIMITIVE_TYPE_MAP[xsdType] || { tsType: 'any', zodValidator: 'z.any()' };
  return { ...mapping };
}

export function applyFacets(
  baseMapping: TypeMapping,
  facets: XsdSimpleType['restriction'],
  naming: NamingConvention
): TypeMapping {
  let tsType = baseMapping.tsType;
  let zodValidator = baseMapping.zodValidator;

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
    const escapedPattern = facets.pattern.replace(/\\/g, '\\\\');
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

  if (facets.totalDigits) {
    tsType = 'number';
  }

  if (facets.fractionDigits) {
    tsType = 'number';
  }

  return { tsType, zodValidator };
}

export function mapEnumeration(simpleType: XsdSimpleType, naming: NamingConvention): TypeMapping {
  const values = simpleType.restriction.enumerations || [];

  const tsType = values.map(v => `'${v}'`).join(' | ');
  const zodValidator = `z.enum([${values.map(v => `'${v}'`).join(', ')}])`;

  return { tsType, zodValidator };
}
