import type { XsdSimpleType } from '../parser/types';
import type { NamingConvention } from '../generators/naming';
import { stripNamespace } from '../parser/namespace';

export interface TypeMapping {
  tsType: string;
  zodValidator: string;
}

const PRIMITIVE_TYPE_MAP: Record<string, TypeMapping> = {
  'string': { tsType: 'string', zodValidator: 'z.string()' },
  'int': { tsType: 'number', zodValidator: 'z.number().int()' },
  'integer': { tsType: 'number', zodValidator: 'z.number().int()' },
  'decimal': { tsType: 'number', zodValidator: 'z.number()' },
  'float': { tsType: 'number', zodValidator: 'z.number()' },
  'double': { tsType: 'number', zodValidator: 'z.number()' },
  'boolean': { tsType: 'boolean', zodValidator: 'z.boolean()' },
  'date': { tsType: 'string', zodValidator: 'z.string().date()' },
  'dateTime': { tsType: 'string', zodValidator: 'z.string().datetime()' },
  'time': { tsType: 'string', zodValidator: 'z.string().time()' },
  'anyURI': { tsType: 'string', zodValidator: 'z.string().url()' },
  'base64Binary': { tsType: 'string', zodValidator: 'z.string()' },
  'hexBinary': { tsType: 'string', zodValidator: 'z.string()' },
  'duration': { tsType: 'string', zodValidator: 'z.string()' },
  'gDay': { tsType: 'string', zodValidator: 'z.string()' },
  'gMonth': { tsType: 'string', zodValidator: 'z.string()' },
  'gMonthDay': { tsType: 'string', zodValidator: 'z.string()' },
  'gYear': { tsType: 'string', zodValidator: 'z.string()' },
  'gYearMonth': { tsType: 'string', zodValidator: 'z.string()' },
  'ID': { tsType: 'string', zodValidator: 'z.string()' },
  'IDREF': { tsType: 'string', zodValidator: 'z.string()' },
  'ENTITY': { tsType: 'string', zodValidator: 'z.string()' },
  'NMTOKEN': { tsType: 'string', zodValidator: 'z.string()' },
  'normalizedString': { tsType: 'string', zodValidator: 'z.string()' },
  'token': { tsType: 'string', zodValidator: 'z.string()' },
  'language': { tsType: 'string', zodValidator: 'z.string()' },
  'Name': { tsType: 'string', zodValidator: 'z.string()' },
  'NCName': { tsType: 'string', zodValidator: 'z.string()' },
  'anyType': { tsType: 'any', zodValidator: 'z.any()' },
  'anySimpleType': { tsType: 'any', zodValidator: 'z.any()' },
  'positiveInteger': { tsType: 'number', zodValidator: 'z.number().int().positive()' },
  'nonNegativeInteger': { tsType: 'number', zodValidator: 'z.number().int().nonnegative()' },
  'negativeInteger': { tsType: 'number', zodValidator: 'z.number().int().negative()' },
  'nonPositiveInteger': { tsType: 'number', zodValidator: 'z.number().int().nonpositive()' },
  'long': { tsType: 'number', zodValidator: 'z.number().int()' },
  'short': { tsType: 'number', zodValidator: 'z.number().int()' },
  'byte': { tsType: 'number', zodValidator: 'z.number().int()' },
  'unsignedLong': { tsType: 'number', zodValidator: 'z.number().int().nonnegative()' },
  'unsignedInt': { tsType: 'number', zodValidator: 'z.number().int().nonnegative()' },
  'unsignedShort': { tsType: 'number', zodValidator: 'z.number().int().nonnegative()' },
  'unsignedByte': { tsType: 'number', zodValidator: 'z.number().int().nonnegative()' },
  'QName': { tsType: 'string', zodValidator: 'z.string()' },
  'NOTATION': { tsType: 'string', zodValidator: 'z.string()' }
};

export function mapPrimitiveType(xsdType: string): TypeMapping {
  const normalizedType = stripNamespace(xsdType);
  const mapping = PRIMITIVE_TYPE_MAP[normalizedType] || { tsType: 'any', zodValidator: 'z.any()' };
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
