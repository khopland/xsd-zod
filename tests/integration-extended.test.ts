import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { compileXsd } from "../src";
import { rm } from "fs/promises";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

describe("Directory Processing", () => {
  const outputDir = "tests/output";
  const inputDir = "tests/fixtures/multiple";

  beforeEach(async () => {
    try {
      await rm(outputDir, { recursive: true, force: true });
    } catch {}

    try {
      await rm(inputDir, { recursive: true, force: true });
    } catch {}

    mkdirSync(inputDir, { recursive: true });

    writeFileSync(
      join(inputDir, "schema1.xsd"),
      `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="User" type="xs:string"/>
</xs:schema>`,
    );

    writeFileSync(
      join(inputDir, "schema2.xsd"),
      `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Address" type="xs:string"/>
</xs:schema>`,
    );

    writeFileSync(join(inputDir, "not-xsd.txt"), "This is not an XSD file");
  });

  afterEach(async () => {
    try {
      await rm(outputDir, { recursive: true, force: true });
    } catch {}

    try {
      await rm(inputDir, { recursive: true, force: true });
    } catch {}
  });

  it("should process all XSD files in a directory", async () => {
    await compileXsd({
      input: inputDir,
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    expect(existsSync(join(outputDir, "schema1.types.ts"))).toBe(true);
    expect(existsSync(join(outputDir, "schema1.validators.ts"))).toBe(true);
    expect(existsSync(join(outputDir, "schema2.types.ts"))).toBe(true);
    expect(existsSync(join(outputDir, "schema2.validators.ts"))).toBe(true);
  });

  it("should ignore non-XSD files", async () => {
    await compileXsd({
      input: inputDir,
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    expect(existsSync(join(outputDir, "not-xsd.types.ts"))).toBe(false);
    expect(existsSync(join(outputDir, "not-xsd.validators.ts"))).toBe(false);
  });

  it("should throw error for directory with no XSD files", async () => {
    const emptyDir = "tests/fixtures/empty";
    mkdirSync(emptyDir, { recursive: true });

    try {
      await expect(
        compileXsd({
          input: emptyDir,
          output: outputDir,
          naming: "camel",
          separate: true,
          watch: false,
        }),
      ).rejects.toThrow();
    } finally {
      try {
        await rm(emptyDir, { recursive: true, force: true });
      } catch {}
    }
  });
});

describe("Edge Cases and Error Handling", () => {
  const outputDir = "tests/output";

  beforeEach(async () => {
    try {
      await rm(outputDir, { recursive: true, force: true });
    } catch {}
  });

  afterEach(async () => {
    try {
      await rm(outputDir, { recursive: true, force: true });
    } catch {}
  });

  it("should handle XSD with no elements", async () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
</xs:schema>`;

    const testFile = "tests/fixtures/empty.xsd";
    writeFileSync(testFile, xsd);

    await compileXsd({
      input: testFile,
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    expect(existsSync(join(outputDir, "empty.types.ts"))).toBe(true);
    expect(existsSync(join(outputDir, "empty.validators.ts"))).toBe(true);

    try {
      const { unlink } = await import("fs/promises");
      await unlink(testFile);
    } catch {}
  });

  it("should handle XSD with only complexTypes", async () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="User">
    <xs:sequence>
      <xs:element name="name" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const testFile = "tests/fixtures/complex-only.xsd";
    writeFileSync(testFile, xsd);

    await compileXsd({
      input: testFile,
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    expect(existsSync(join(outputDir, "complex-only.types.ts"))).toBe(true);

    try {
      const { unlink } = await import("fs/promises");
      await unlink(testFile);
    } catch {}
  });

  it("should handle nested complexTypes", async () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="Address">
    <xs:sequence>
      <xs:element name="street" type="xs:string"/>
      <xs:element name="city" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>
  <xs:complexType name="User">
    <xs:sequence>
      <xs:element name="name" type="xs:string"/>
      <xs:element name="address" type="Address"/>
    </xs:sequence>
  </xs:complexType>
</xs:schema>`;

    const testFile = "tests/fixtures/nested.xsd";
    writeFileSync(testFile, xsd);

    await compileXsd({
      input: testFile,
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    const typesPath = join(outputDir, "nested.types.ts");
    const { readFile } = await import("fs/promises");
    const types = await readFile(typesPath, "utf-8");

    expect(types).toContain("export interface Address");
    expect(types).toContain("export interface User");
    expect(types).toContain("address: Address");

    try {
      const { unlink } = await import("fs/promises");
      await unlink(testFile);
    } catch {}
  });

  it("should handle choice and all elements", async () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="ChoiceType">
    <xs:choice>
      <xs:element name="optionA" type="xs:string"/>
      <xs:element name="optionB" type="xs:string"/>
    </xs:choice>
  </xs:complexType>
  <xs:complexType name="AllType">
    <xs:all>
      <xs:element name="fieldA" type="xs:string"/>
      <xs:element name="fieldB" type="xs:string"/>
    </xs:all>
  </xs:complexType>
</xs:schema>`;

    const testFile = "tests/fixtures/choice-all.xsd";
    writeFileSync(testFile, xsd);

    await compileXsd({
      input: testFile,
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    const typesPath = join(outputDir, "choice-all.types.ts");
    const { readFile } = await import("fs/promises");
    const types = await readFile(typesPath, "utf-8");

    expect(types).toContain("export interface ChoiceType");
    expect(types).toContain("export interface AllType");

    try {
      const { unlink } = await import("fs/promises");
      await unlink(testFile);
    } catch {}
  });

  it("should handle kebab naming convention", async () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="User">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="first_name" type="xs:string"/>
        <xs:element name="last_name" type="xs:string"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

    const testFile = "tests/fixtures/kebab.xsd";
    writeFileSync(testFile, xsd);

    await compileXsd({
      input: testFile,
      output: outputDir,
      naming: "kebab",
      separate: true,
      watch: false,
    });

    const validatorsPath = join(outputDir, "kebab.validators.ts");
    const { readFile } = await import("fs/promises");
    const validators = await readFile(validatorsPath, "utf-8");

    expect(validators).toContain("first-name:");
    expect(validators).toContain("last-name:");

    try {
      const { unlink } = await import("fs/promises");
      await unlink(testFile);
    } catch {}
  });

  it("should handle attributes with default and fixed values", async () => {
    const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="TestType">
    <xs:sequence>
      <xs:element name="name" type="xs:string"/>
    </xs:sequence>
    <xs:attribute name="status" type="xs:string" default="active"/>
    <xs:attribute name="version" type="xs:string" fixed="1.0"/>
  </xs:complexType>
</xs:schema>`;

    const testFile = "tests/fixtures/attrs.xsd";
    writeFileSync(testFile, xsd);

    await compileXsd({
      input: testFile,
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    const typesPath = join(outputDir, "attrs.types.ts");
    const { readFile } = await import("fs/promises");
    const types = await readFile(typesPath, "utf-8");

    expect(types).toContain("status?: string");
    expect(types).toContain("version?: string");

    try {
      const { unlink } = await import("fs/promises");
      await unlink(testFile);
    } catch {}
  });
});
