import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { compileXsd } from "../src";
import { readFile, rm } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

describe("XSD to Zod/TypeScript Compiler", () => {
  const outputDir = "tests/output";

  beforeEach(async () => {
    const { rm } = await import("fs/promises");
    try {
      await rm(outputDir, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  });

  afterEach(async () => {
    try {
      await rm(outputDir, { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  });

  it("should compile XSD to TypeScript types and Zod validators", async () => {
    await compileXsd({
      input: "tests/fixtures/example.xsd",
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    const typesPath = join(outputDir, "example.types.ts");
    const validatorsPath = join(outputDir, "example.validators.ts");

    expect(existsSync(typesPath)).toBe(true);
    expect(existsSync(validatorsPath)).toBe(true);

    const types = await readFile(typesPath, "utf-8");
    const validators = await readFile(validatorsPath, "utf-8");

    expect(types).toContain("export type StatusType");
    expect(types).toContain("export interface UserType");
    expect(types).toContain("export interface AddressType");
    expect(types).toContain("firstName: string");
    expect(types).toContain("email: EmailType");
    expect(types).toContain("age?: PositiveInteger");

    expect(validators).toContain("import { z } from 'zod'");
    expect(validators).toContain("export const StatusTypeSchema");
    expect(validators).toContain("export const UserTypeSchema");
    expect(validators).toContain("export const AddressTypeSchema");
  });

  it("should generate correct enum types", async () => {
    await compileXsd({
      input: "tests/fixtures/example.xsd",
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    const typesPath = join(outputDir, "example.types.ts");
    const validatorsPath = join(outputDir, "example.validators.ts");

    const types = await readFile(typesPath, "utf-8");
    const validators = await readFile(validatorsPath, "utf-8");

    expect(types).toContain("'active' | 'inactive' | 'pending'");
    expect(validators).toContain("z.enum(['active', 'inactive', 'pending'])");
  });

  it("should apply type facets correctly", async () => {
    await compileXsd({
      input: "tests/fixtures/example.xsd",
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    const validatorsPath = join(outputDir, "example.validators.ts");
    const validators = await readFile(validatorsPath, "utf-8");

    expect(validators).toContain(".min(5)");
    expect(validators).toContain(".max(255)");
  });

  it("should handle optional fields correctly", async () => {
    await compileXsd({
      input: "tests/fixtures/example.xsd",
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    const typesPath = join(outputDir, "example.types.ts");
    const validatorsPath = join(outputDir, "example.validators.ts");

    const types = await readFile(typesPath, "utf-8");
    const validators = await readFile(validatorsPath, "utf-8");

    expect(types).toContain("age?: PositiveInteger");
    expect(validators).toContain(".optional()");
  });

  it("should handle required attributes correctly", async () => {
    await compileXsd({
      input: "tests/fixtures/example.xsd",
      output: outputDir,
      naming: "camel",
      separate: true,
      watch: false,
    });

    const typesPath = join(outputDir, "example.types.ts");

    const types = await readFile(typesPath, "utf-8");

    expect(types).toContain("id: string");
    expect(types).toContain("createdAt?: string");
  });

  it("should support pascal naming convention", async () => {
    await compileXsd({
      input: "tests/fixtures/example.xsd",
      output: outputDir,
      naming: "pascal",
      separate: true,
      watch: false,
    });

    const typesPath = join(outputDir, "example.types.ts");
    const validatorsPath = join(outputDir, "example.validators.ts");

    const types = await readFile(typesPath, "utf-8");
    const validators = await readFile(validatorsPath, "utf-8");

    expect(types).toContain("FirstName: string");
    expect(types).toContain("LastName: string");
    expect(validators).toContain("FirstName:");
    expect(validators).toContain("LastName:");
  });

  it("should support original naming convention", async () => {
    await compileXsd({
      input: "tests/fixtures/example.xsd",
      output: outputDir,
      naming: "original",
      separate: true,
      watch: false,
    });

    const typesPath = join(outputDir, "example.types.ts");
    const validatorsPath = join(outputDir, "example.validators.ts");

    const types = await readFile(typesPath, "utf-8");
    const validators = await readFile(validatorsPath, "utf-8");

    expect(types).toContain("firstName: string");
    expect(validators).toContain("firstName:");
  });

  it("should generate combined file when separate is false", async () => {
    await compileXsd({
      input: "tests/fixtures/example.xsd",
      output: outputDir,
      naming: "camel",
      separate: false,
      watch: false,
    });

    const combinedPath = join(outputDir, "example.ts");
    const typesPath = join(outputDir, "example.types.ts");
    const validatorsPath = join(outputDir, "example.validators.ts");

    expect(existsSync(combinedPath)).toBe(true);
    expect(existsSync(typesPath)).toBe(false);
    expect(existsSync(validatorsPath)).toBe(false);

    const combined = await readFile(combinedPath, "utf-8");
    expect(combined).toContain("export type StatusType");
    expect(combined).toContain("import { z } from 'zod'");
    expect(combined).toContain("export const StatusTypeSchema");
  });

  it("should throw error for invalid input path", async () => {
    await expect(
      compileXsd({
        input: "nonexistent.xsd",
        output: outputDir,
        naming: "camel",
        separate: true,
        watch: false,
      }),
    ).rejects.toThrow();
  });

  it("should throw error for invalid naming convention", async () => {
    await expect(
      compileXsd({
        input: "tests/fixtures/example.xsd",
        output: outputDir,
        naming: "invalid" as any,
        separate: true,
        watch: false,
      }),
    ).rejects.toThrow("Invalid naming convention");
  });
});
