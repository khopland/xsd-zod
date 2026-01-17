# xsd-zod

Generate Zod validators and TypeScript types from XSD (XML Schema Definition) documents.

## Features

- ✅ Basic XSD types (string, int, boolean, decimal, etc.)
- ✅ Complex types with nested elements
- ✅ Attributes support
- ✅ Enumerations
- ✅ Type facets (minLength, maxLength, pattern, min/max values)
- ✅ Configurable naming conventions (camel, pascal, original, kebab)
- ✅ Single file or directory processing
- ✅ Separate or combined output files
- ✅ Command-line interface

## Installation

```bash
npm install -g xsd-zod
```

Or use locally:

```bash
npm install xsd-zod
```

## Usage

### CLI

Generate from a single XSD file:

```bash
xsd-zod schema.xsd
```

Specify output directory:

```bash
xsd-zod schema.xsd -o ./generated
```

Use different naming convention:

```bash
xsd-zod schema.xsd -n pascal
```

Generate combined file (types and validators together):

```bash
xsd-zod schema.xsd -c
```

Process a directory of XSD files:

```bash
xsd-zod ./schemas -o ./generated
```

### Programmatic API

```typescript
import { compileXsd } from 'xsd-zod';

await compileXsd({
  input: 'schema.xsd',
  output: './generated',
  naming: 'camel',
  separate: true,
  watch: false
});
```

## CLI Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--output <dir>` | `-o` | Output directory | `./generated` |
| `--naming <conv>` | `-n` | Naming convention (camel, pascal, original, kebab) | `camel` |
| `--separate` | `-s` | Generate separate type and validator files | `true` |
| `--combined` | `-c` | Generate single combined file | `false` |

## XSD Features Supported

### Primitive Types

- `xs:string`, `xs:int`, `xs:integer`, `xs:decimal`, `xs:float`, `xs:double`
- `xs:boolean`, `xs:date`, `xs:dateTime`, `xs:time`
- `xs:anyURI`, `xs:base64Binary`, `xs:hexBinary`

### Type Facets

- `minLength`, `maxLength`, `length`
- `minInclusive`, `maxInclusive`, `minExclusive`, `maxExclusive`
- `pattern`, `totalDigits`, `fractionDigits`
- `enumeration`

### Complex Types

- `sequence`, `choice`, `all` element groups
- Nested elements
- Element cardinality (`minOccurs`, `maxOccurs`)
- Complex type extensions

### Attributes

- Required and optional attributes
- Attribute types
- Default and fixed values

## Example

Input XSD (`schema.xsd`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  
  <xs:simpleType name="StatusType">
    <xs:restriction base="xs:string">
      <xs:enumeration value="active"/>
      <xs:enumeration value="inactive"/>
    </xs:restriction>
  </xs:simpleType>
  
  <xs:complexType name="UserType">
    <xs:sequence>
      <xs:element name="firstName" type="xs:string"/>
      <xs:element name="email" type="xs:string" minOccurs="0"/>
      <xs:element name="status" type="StatusType"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
  </xs:complexType>
  
  <xs:element name="User" type="UserType"/>
  
</xs:schema>
```

Generated TypeScript Types (`schema.types.ts`):

```typescript
export type StatusType = 'active' | 'inactive';

export interface UserType {
  firstName: string;
  email?: string;
  status: StatusType;
  id: string;
}
```

Generated Zod Validators (`schema.validators.ts`):

```typescript
import { z } from 'zod';

export const StatusTypeSchema = z.enum(['active', 'inactive']);

export const UserTypeSchema = z.object({
  firstName: z.string(),
  email: z.string().optional(),
  status: StatusTypeSchema,
  id: z.string()
});
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Type Check

```bash
npm run typecheck
```

## License

MIT
