const XSD_NAMESPACE_URI = "http://www.w3.org/2001/XMLSchema";

export interface NamespaceMapping {
  prefix: string;
  uri: string;
}

export interface NamespaceContext {
  namespaceMappings: Map<string, string>;
  xsdPrefix: string | undefined;
}

export function extractNamespaces(element: any): NamespaceContext {
  const namespaceMappings = new Map<string, string>();
  let xsdPrefix: string | undefined = undefined;

  if (!element) {
    return { namespaceMappings, xsdPrefix };
  }

  for (const key in element) {
    if (key === "xmlns") {
      namespaceMappings.set("", element[key]);
    } else if (
      key.startsWith("xmlns:") ||
      key.startsWith("@_xmlns:") ||
      key.includes("/xmlns:") ||
      key.includes("/@_xmlns:")
    ) {
      const prefix = key.startsWith("@_xmlns:")
        ? key.substring(8)
        : key.includes("/xmlns:") || key.includes("/@_xmlns:")
          ? key.split(/\/?@_xmlns:?/)[1]
          : key.substring(6);
      const uri = element[key];
      namespaceMappings.set(prefix, uri);

      if (uri === XSD_NAMESPACE_URI) {
        xsdPrefix = prefix;
      }
    }
  }

  return { namespaceMappings, xsdPrefix };
}

export function stripNamespace(typeName: string): string {
  if (!typeName) return "";
  const colonIndex = typeName.indexOf(":");
  return colonIndex > -1 ? typeName.substring(colonIndex + 1) : typeName;
}

export function isXsdType(
  typeName: string,
  xsdPrefix: string | undefined,
): boolean {
  if (!typeName) return false;

  if (xsdPrefix && typeName.startsWith(`${xsdPrefix}:`)) {
    return true;
  }

  const strippedName = stripNamespace(typeName);
  const builtInTypes = [
    "string",
    "int",
    "integer",
    "decimal",
    "float",
    "double",
    "boolean",
    "date",
    "dateTime",
    "time",
    "anyURI",
    "base64Binary",
    "hexBinary",
    "duration",
    "gDay",
    "gMonth",
    "gMonthDay",
    "gYear",
    "gYearMonth",
    "ID",
    "IDREF",
    "ENTITY",
    "NMTOKEN",
    "normalizedString",
    "token",
    "language",
    "Name",
    "NCName",
    "anyType",
    "anySimpleType",
    "positiveInteger",
    "nonNegativeInteger",
    "negativeInteger",
    "nonPositiveInteger",
    "long",
    "short",
    "byte",
    "unsignedLong",
    "unsignedInt",
    "unsignedShort",
    "unsignedByte",
    "QName",
    "NOTATION",
  ];

  return builtInTypes.includes(strippedName);
}

export function getTypeValue(
  container: any,
  elementName: string,
  xsdPrefix: string | undefined,
): any {
  if (!container) return undefined;

  if (elementName in container) {
    return container[elementName];
  }

  if (xsdPrefix) {
    const prefixedName = `${xsdPrefix}:${elementName}`;
    if (prefixedName in container) {
      return container[prefixedName];
    }
  }

  return undefined;
}

export function getAsArray(
  container: any,
  elementName: string,
  xsdPrefix: string | undefined,
): any[] {
  const value = getTypeValue(container, elementName, xsdPrefix);

  if (Array.isArray(value)) {
    return value;
  }

  if (value !== undefined && value !== null) {
    return [value];
  }

  return [];
}
