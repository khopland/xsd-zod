export interface XsdSchema {
  targetNamespace?: string;
  elementFormDefault?: 'qualified' | 'unqualified';
  elements: XsdElement[];
  complexTypes: XsdComplexType[];
  simpleTypes: XsdSimpleType[];
}

export interface XsdElement {
  name: string;
  type?: string;
  complexType?: XsdComplexType | null;
  simpleType?: XsdSimpleType | null;
  attributes: XsdAttribute[];
  minOccurs?: number;
  maxOccurs?: number | 'unbounded';
  isRef?: boolean;
  ref?: string;
  nillable?: boolean;
}

export interface XsdComplexType {
  name?: string;
  sequence?: XsdElement[];
  choice?: XsdElement[];
  all?: XsdElement[];
  attributes: XsdAttribute[];
  extension?: XsdExtension;
  content: XsdElement[];
}

export interface XsdSimpleType {
  name?: string;
  restriction: XsdRestriction;
}

export interface XsdRestriction {
  base: string;
  enumerations?: string[];
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minInclusive?: number;
  maxInclusive?: number;
  minExclusive?: number;
  maxExclusive?: number;
  totalDigits?: number;
  fractionDigits?: number;
  length?: number;
  whiteSpace?: 'preserve' | 'replace' | 'collapse';
}

export interface XsdAttribute {
  name: string;
  type?: string;
  use?: 'optional' | 'required' | 'prohibited';
  default?: string;
  fixed?: string;
  simpleType?: XsdSimpleType | null;
}

export interface XsdExtension {
  base: string;
  sequence?: XsdElement[];
  attributes: XsdAttribute[];
}
