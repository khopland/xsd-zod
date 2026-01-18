import { describe, it, expect } from "vitest";
import { validateOptions, type CompileOptions } from "../src/config";

describe("Config Validation", () => {
  it("should pass validation with valid options", () => {
    const options: CompileOptions = {
      input: "test.xsd",
      output: "./output",
      naming: "camel",
      separate: true,
      watch: false,
    };

    expect(() => validateOptions(options)).not.toThrow();
  });

  it("should throw error when input is missing", () => {
    const options = {
      output: "./output",
      naming: "camel" as const,
      separate: true,
      watch: false,
    } as CompileOptions;

    expect(() => validateOptions(options)).toThrow("Input path is required");
  });

  it("should throw error when input is empty string", () => {
    const options = {
      input: "",
      output: "./output",
      naming: "camel" as const,
      separate: true,
      watch: false,
    };

    expect(() => validateOptions(options)).toThrow("Input path is required");
  });

  it("should throw error when output is missing", () => {
    const options = {
      input: "test.xsd",
      naming: "camel" as const,
      separate: true,
      watch: false,
    } as CompileOptions;

    expect(() => validateOptions(options)).toThrow("Output path is required");
  });

  it("should throw error when output is empty string", () => {
    const options = {
      input: "test.xsd",
      output: "",
      naming: "camel" as const,
      separate: true,
      watch: false,
    };

    expect(() => validateOptions(options)).toThrow("Output path is required");
  });

  it("should throw error for invalid naming convention", () => {
    const options = {
      input: "test.xsd",
      output: "./output",
      naming: "invalid" as any,
      separate: true,
      watch: false,
    };

    expect(() => validateOptions(options)).toThrow(
      "Invalid naming convention: invalid",
    );
  });

  it("should accept all valid naming conventions", () => {
    const namingConventions: Array<"camel" | "pascal" | "original" | "kebab"> =
      ["camel", "pascal", "original", "kebab"];

    for (const naming of namingConventions) {
      const options: CompileOptions = {
        input: "test.xsd",
        output: "./output",
        naming,
        separate: true,
        watch: false,
      };

      expect(() => validateOptions(options)).not.toThrow();
    }
  });

  it("should accept false as valid naming convention value", () => {
    const options = {
      input: "test.xsd",
      output: "./output",
      naming: false as any,
      separate: true,
      watch: false,
    };

    expect(() => validateOptions(options)).toThrow("Invalid naming convention");
  });

  it("should not throw when separate and watch are both false", () => {
    const options: CompileOptions = {
      input: "test.xsd",
      output: "./output",
      naming: "camel",
      separate: false,
      watch: false,
    };

    expect(() => validateOptions(options)).not.toThrow();
  });

  it("should not throw when separate and watch are both true", () => {
    const options: CompileOptions = {
      input: "test.xsd",
      output: "./output",
      naming: "camel",
      separate: true,
      watch: true,
    };

    expect(() => validateOptions(options)).not.toThrow();
  });
});
