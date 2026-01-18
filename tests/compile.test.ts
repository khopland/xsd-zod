import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { compileXsd } from "../src";
import { readFile, rm, mkdir } from "fs/promises";
import { join } from "path";

describe("Main Compilation Function", () => {
  const inputDir = "tests/fixtures/compile-test";
  const outputDir = "tests/output/compile-test";

  beforeEach(async () => {
    try {
      await rm(inputDir, { recursive: true, force: true });
      await rm(outputDir, { recursive: true, force: true });
    } catch {}
    await mkdir(inputDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(inputDir, { recursive: true, force: true });
      await rm(outputDir, { recursive: true, force: true });
    } catch {}
  });

  it("should process single XSD file", async () => {
    const { writeFile } = await import("fs/promises");
    const xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Test" type="xs:string"/>
</xs:schema>`;
    await writeFile(join(inputDir, "test.xsd"), xsdContent);

    await compileXsd({
      input: join(inputDir, "test.xsd"),
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    const typesPath = join(outputDir, "test.types.ts");
    const validatorsPath = join(outputDir, "test.validators.ts");

    const types = await readFile(typesPath, "utf-8");
    const validators = await readFile(validatorsPath, "utf-8");

    expect(types).toContain("export type Test");
    expect(validators).toContain("export const TestSchema");
  });

  it("should process directory of XSD files", async () => {
    const { writeFile } = await import("fs/promises");
    const xsdContent1 = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Test1" type="xs:string"/>
</xs:schema>`;
    const xsdContent2 = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Test2" type="xs:int"/>
</xs:schema>`;
    await writeFile(join(inputDir, "test1.xsd"), xsdContent1);
    await writeFile(join(inputDir, "test2.xsd"), xsdContent2);

    await compileXsd({
      input: inputDir,
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    const { existsSync } = await import("fs");
    expect(existsSync(join(outputDir, "test1.types.ts"))).toBe(true);
    expect(existsSync(join(outputDir, "test2.types.ts"))).toBe(true);
  });

  it("should recursively scan subdirectories", async () => {
    const { writeFile } = await import("fs/promises");
    const subdir = join(inputDir, "subdir");
    await mkdir(subdir, { recursive: true });

    const xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Nested" type="xs:string"/>
</xs:schema>`;
    await writeFile(join(subdir, "nested.xsd"), xsdContent);

    await compileXsd({
      input: inputDir,
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    const { existsSync } = await import("fs");
    expect(existsSync(join(outputDir, "nested.types.ts"))).toBe(true);
  });

  it("should create output directory if it does not exist", async () => {
    const { writeFile } = await import("fs/promises");
    const xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Test" type="xs:string"/>
</xs:schema>`;
    await writeFile(join(inputDir, "test.xsd"), xsdContent);

    const newOutputDir = join(outputDir, "new", "path");
    await compileXsd({
      input: join(inputDir, "test.xsd"),
      output: newOutputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    const { existsSync } = await import("fs");
    expect(existsSync(newOutputDir)).toBe(true);
    expect(existsSync(join(newOutputDir, "test.types.ts"))).toBe(true);
  });

  it("should generate combined file when separate is false", async () => {
    const { writeFile } = await import("fs/promises");
    const xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Test" type="xs:string"/>
</xs:schema>`;
    await writeFile(join(inputDir, "test.xsd"), xsdContent);

    await compileXsd({
      input: join(inputDir, "test.xsd"),
      output: outputDir,
      naming: "camel",
      separate: false,
      watch: false,
    });

    const { existsSync } = await import("fs");
    expect(existsSync(join(outputDir, "test.ts"))).toBe(true);
    expect(existsSync(join(outputDir, "test.types.ts"))).toBe(false);
    expect(existsSync(join(outputDir, "test.validators.ts"))).toBe(false);

    const content = await readFile(join(outputDir, "test.ts"), "utf-8");
    expect(content).toContain("export type Test");
    expect(content).toContain("import { z } from 'zod'");
  });

  it("should throw error for non-existent input path", async () => {
    await expect(
      compileXsd({
        input: "/nonexistent/path/file.xsd",
        output: outputDir,
        naming: "camel",
        separate: true,
        watch: false,
      }),
    ).rejects.toThrow();
  });

  it("should throw error when no XSD files found in directory", async () => {
    await expect(
      compileXsd({
        input: inputDir,
        output: outputDir,
        naming: "camel",
        separate: true,
        watch: false,
      }),
    ).rejects.toThrow("No XSD files found");
  });

  it("should ignore non-XSD files in directory", async () => {
    const { writeFile } = await import("fs/promises");
    const xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Test" type="xs:string"/>
</xs:schema>`;
    await writeFile(join(inputDir, "test.xsd"), xsdContent);
    await writeFile(join(inputDir, "not-xsd.txt"), "This is not an XSD file");
    await writeFile(join(inputDir, "readme.md"), "# README");

    await compileXsd({
      input: inputDir,
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    const { existsSync } = await import("fs");
    expect(existsSync(join(outputDir, "test.types.ts"))).toBe(true);
    expect(existsSync(join(outputDir, "not-xsd.types.ts"))).toBe(false);
    expect(existsSync(join(outputDir, "readme.types.ts"))).toBe(false);
  });

  it("should handle XSD files with uppercase extension", async () => {
    const { writeFile } = await import("fs/promises");
    const xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Test" type="xs:string"/>
</xs:schema>`;
    await writeFile(join(inputDir, "TEST.XSD"), xsdContent);

    await compileXsd({
      input: inputDir,
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    const { existsSync } = await import("fs");
    expect(existsSync(join(outputDir, "TEST.types.ts"))).toBe(true);
  });
});
