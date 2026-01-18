export interface CompileOptions {
  input: string;
  output: string;
  naming: "camel" | "pascal" | "original" | "kebab";
  separate: boolean;
  watch: boolean;
}

export function validateOptions(options: CompileOptions): void {
  if (!options.input) {
    throw new Error("Input path is required");
  }

  if (!options.output) {
    throw new Error("Output path is required");
  }

  if (!["camel", "pascal", "original", "kebab"].includes(options.naming)) {
    throw new Error(`Invalid naming convention: ${options.naming}`);
  }
}
