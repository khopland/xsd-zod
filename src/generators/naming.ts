import { camelCase, pascalCase, kebabCase } from 'change-case';

export type NamingConvention = 'camel' | 'pascal' | 'original' | 'kebab';

export function applyNaming(name: string, convention: NamingConvention): string {
  switch (convention) {
    case 'camel':
      return camelCase(name);
    case 'pascal':
      return pascalCase(name);
    case 'kebab':
      return kebabCase(name);
    case 'original':
      return name;
  }
}

export function getTypeName(name: string, convention: NamingConvention): string {
  switch (convention) {
    case 'camel':
      return pascalCase(name);
    case 'pascal':
      return pascalCase(name);
    case 'kebab':
      return pascalCase(name);
    case 'original':
      return name;
  }
}

export function getSchemaName(name: string, convention: NamingConvention): string {
  switch (convention) {
    case 'camel':
      return pascalCase(name) + 'Schema';
    case 'pascal':
      return pascalCase(name) + 'Schema';
    case 'kebab':
      return pascalCase(name) + 'Schema';
    case 'original':
      return name + 'Schema';
  }
}

