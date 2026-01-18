import { writeFile, mkdir } from "fs/promises";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, basename, extname, resolve } from "path";
import { parseXsd } from "./parser";
import {
  generateTypes,
  generateValidators,
  type NamingConvention,
} from "./generators";
import type { CompileOptions } from "./config";
import { validateOptions } from "./config";

export async function compileXsd(options: CompileOptions): Promise<void> {
  validateOptions(options);

  const inputPath = resolve(options.input);
  const outputPath = resolve(options.output);
  const naming = options.naming as NamingConvention;

  const xsdFiles = await getXsdFiles(inputPath);

  if (xsdFiles.length === 0) {
    throw new Error(`No XSD files found in ${inputPath}`);
  }

  await ensureDir(outputPath);

  for (const file of xsdFiles) {
    const xsdContent = await readFileContent(file);
    const schema = parseXsd(xsdContent);

    const baseName = basename(file, extname(file));

    if (options.separate) {
      const typesCode = generateTypes(schema, naming);
      const validatorsCode = generateValidators(schema, naming);

      await writeFile(join(outputPath, `${baseName}.types.ts`), typesCode);
      await writeFile(
        join(outputPath, `${baseName}.validators.ts`),
        validatorsCode,
      );
    } else {
      const typesCode = generateTypes(schema, naming);
      const validatorsCode = generateValidators(schema, naming);

      const combinedCode = `${typesCode}\n\n${validatorsCode}`;
      await writeFile(join(outputPath, `${baseName}.ts`), combinedCode);
    }

    console.log(
      `✓ Generated ${baseName}${options.separate ? ".types.ts and " + baseName + ".validators.ts" : ".ts"}`,
    );
  }

  console.log(
    `\n✓ Successfully generated files from ${xsdFiles.length} XSD file(s)`,
  );
}

async function getXsdFiles(inputPath: string): Promise<string[]> {
  const files: string[] = [];

  async function scanPath(path: string) {
    const stats = statSync(path);

    if (stats.isFile()) {
      if (extname(path).toLowerCase() === ".xsd") {
        files.push(path);
      }
    } else if (stats.isDirectory()) {
      const entries = readdirSync(path);
      for (const entry of entries) {
        await scanPath(join(path, entry));
      }
    }
  }

  await scanPath(inputPath);
  return files;
}

async function ensureDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

function readFileContent(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const content = readFileSync(path, "utf-8");
      resolve(content);
    } catch (error) {
      reject(error);
    }
  });
}

export * from "./parser";
export * from "./generators";
export * from "./config";
