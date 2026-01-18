# xsd-zod

[![npm version](https://badge.fury.io/js/xsd-zod.svg)](https://www.npmjs.com/package/xsd-zod)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Seamlessly convert XSD (XML Schema Definition) documents into Zod validators and TypeScript types

Transform your XML schemas into type-safe TypeScript code with full runtime validation. xsd-zod parses XSD files and generates both TypeScript interfaces and Zod schemas, enabling you to validate XML payloads with confidence and type safety.

## ✨ Why xsd-zod?

Working with XML APIs and legacy systems often means dealing with XSD schemas. Writing TypeScript types and validation logic by hand is error-prone and tedious. xsd-zod automates this process, giving you:

- **Type Safety**: Generated TypeScript interfaces that match your XSD exactly
- **Runtime Validation**: Zod schemas to validate data at runtime
- **Maintainability**: Regenerate types whenever schemas change
- **Flexibility**: Support for complex XSD features including nested types, enums, and constraints

## 🚀 Features

- ✅ **All common XSD primitive types** (string, int, boolean, decimal, date, etc.)
- ✅ **Complex types** with nested elements and sequences
- ✅ **Full attribute support** (required, optional, default values)
- ✅ **Enumerations** converted to TypeScript unions and Zod enums
- ✅ **Type facets** (minLength, maxLength, pattern, min/max values, totalDigits, etc.)
- ✅ **Flexible naming conventions** (camel, pascal, original, kebab)
- ✅ **Batch processing** - handle single files or entire directories
- ✅ **Configurable output** - separate type/validator files or combined
- ✅ **CLI and programmatic API**
- ✅ **TypeScript-first** - fully typed API and generated code

## 📦 Installation

Install globally for CLI usage:

```bash
npm install -g xsd-zod
```

Or use as a local dependency:

```bash
npm install xsd-zod
# or
pnpm add xsd-zod
# or
yarn add xsd-zod
```

## 🎯 Quick Start

### CLI Usage

Generate types and validators from an XSD file:

```bash
xsd-zod schema.xsd
```

This creates `schema.types.ts` and `schema.validators.ts` in the `./generated` directory.

### Programmatic API

```typescript
import { compileXsd } from 'xsd-zod';

await compileXsd({
  input: 'schema.xsd',
  output: './generated',
  naming: 'camel',
  separate: true
});
```

## 📖 Usage Examples

### CLI Examples

Specify output directory:

```bash
xsd-zod schema.xsd -o ./src/types
```

Use Pascal case naming:

```bash
xsd-zod schema.xsd -n pascal
```

Generate a single combined file:

```bash
xsd-zod schema.xsd -c
```

Process all XSD files in a directory:

```bash
xsd-zod ./schemas -o ./generated
```

### Programmatic API Examples

Batch process multiple schemas:

```typescript
import { compileXsd } from 'xsd-zod';

await compileXsd({
  input: './schemas',
  output: './src/validators',
  naming: 'pascal',
  separate: false  // Single file per schema
});
```

Custom naming convention:

```typescript
await compileXsd({
  input: 'schema.xsd',
  output: './generated',
  naming: 'kebab'  // kebab-case names
});
```

## ⚙️ CLI Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--output <dir>` | `-o` | Output directory for generated files | `./generated` |
| `--naming <conv>` | `-n` | Naming convention: `camel`, `pascal`, `original`, `kebab` | `camel` |
| `--separate` | `-s` | Generate separate type and validator files | `true` |
| `--combined` | `-c` | Generate single combined file | `false` |

## 🔌 API Reference

### `compileXsd(options: CompileOptions): Promise<void>`

Main function to compile XSD files into TypeScript and Zod code.

#### Options

```typescript
interface CompileOptions {
  input: string;          // Path to XSD file or directory
  output: string;         // Output directory path
  naming?: 'camel' | 'pascal' | 'original' | 'kebab';  // Naming convention
  separate?: boolean;     // Generate separate files (true) or combined (false)
}
```

### `parseXsd(xsdContent: string): XsdSchema`

Parse XSD content into an internal schema representation.

### `generateTypes(schema: XsdSchema, naming?: NamingConvention): string`

Generate TypeScript type definitions from a parsed schema.

### `generateValidators(schema: XsdSchema, naming?: NamingConvention): string`

Generate Zod validation schemas from a parsed schema.

## 📋 Supported XSD Features

### Primitive Types

- `xs:string`, `xs:int`, `xs:integer`, `xs:decimal`, `xs:float`, `xs:double`
- `xs:boolean`, `xs:date`, `xs:dateTime`, `xs:time`
- `xs:anyURI`, `xs:base64Binary`, `xs:hexBinary`
- `xs:positiveInteger`, `xs:nonNegativeInteger`, `xs:unsignedInt`

### Type Facets (Constraints)

- **String constraints**: `minLength`, `maxLength`, `length`, `pattern`
- **Numeric constraints**: `minInclusive`, `maxInclusive`, `minExclusive`, `maxExclusive`
- **Precision**: `totalDigits`, `fractionDigits`
- **Enumerations**: `enumeration`

### Complex Types

- **Element groups**: `sequence`, `choice`, `all`
- **Nested elements** and recursive types
- **Cardinality**: `minOccurs`, `maxOccurs` (including `unbounded`)
- **Type extensions**: `extension` and `restriction`
- **Mixed content types**

### Attributes

- Required and optional attributes (`use="required"`, `use="optional"`)
- Attribute types and constraints
- Default and fixed values
- Attribute groups

## 💡 Complete Example

Input XSD (`schema.xsd`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  
  <xs:simpleType name="StatusType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="active"/>
      <xs:enumeration value="inactive"/>
      <xs:enumeration value="pending"/>
    </xs:restriction>
  </xs:simpleType>
  
  <xs:complexType name="AddressType">
    <xs:sequence>
      <xs:element name="street" type="xs:string"/>
      <xs:element name="city" type="xs:string"/>
      <xs:element name="zipCode" type="xs:string" minOccurs="0"/>
    </xs:sequence>
    <xs:attribute name="type" type="xs:string" use="required"/>
  </xs:complexType>
  
  <xs:complexType name="UserType">
    <xs:sequence>
      <xs:element name="firstName" type="xs:string"/>
      <xs:element name="lastName" type="xs:string"/>
      <xs:element name="email" type="xs:string" minOccurs="0"/>
      <xs:element name="age" type="xs:int" minOccurs="0"/>
      <xs:element name="status" type="StatusType"/>
      <xs:element name="address" type="AddressType" minOccurs="0"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
    <xs:attribute name="created" type="xs:dateTime"/>
  </xs:complexType>
  
  <xs:element name="User" type="UserType"/>
  
</xs:schema>
```

Generated TypeScript Types (`schema.types.ts`):

```typescript
export type StatusType = 'active' | 'inactive' | 'pending';

export interface AddressType {
  street: string;
  city: string;
  zipCode?: string;
  type: string;
}

export interface UserType {
  firstName: string;
  lastName: string;
  email?: string;
  age?: number;
  status: StatusType;
  address?: AddressType;
  id: string;
  created?: string;
}
```

Generated Zod Validators (`schema.validators.ts`):

```typescript
import { z } from 'zod';

export const StatusTypeSchema = z.enum(['active', 'inactive', 'pending']);

export const AddressTypeSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string().optional(),
  type: z.string()
});

export const UserTypeSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().optional(),
  age: z.number().int().optional(),
  status: StatusTypeSchema,
  address: AddressTypeSchema.optional(),
  id: z.string(),
  created: z.string().datetime().optional()
});
```

## 🧪 Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Type check
npm run typecheck

# Build in watch mode
npm run dev
```

## 🔨 Advanced Usage

### Custom Type Mapping

For advanced customization, you can modify the generated code after generation or extend the type mapping in your own code.

### Namespace Support

The parser handles XML namespaces and preserves namespace information in the generated types where applicable.

### Integration with Build Pipeline

Add xsd-zod to your build process:

```json
{
  "scripts": {
    "generate-types": "xsd-zod ./schemas -o ./src/generated",
    "build": "npm run generate-types && tsc"
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT © [Your Name]

## 🔗 Related Resources

- [Zod Documentation](https://zod.dev/)
- [XML Schema Definition (XSD) Specification](https://www.w3.org/XML/Schema)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🐛 Reporting Issues

Found a bug or have a feature request? Please open an issue on the [GitHub issue tracker](https://github.com/user/xsd-zod/issues).

---

**Made with ❤️ for type-safe XML handling**
