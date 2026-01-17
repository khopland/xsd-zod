#!/usr/bin/env node

import { Command } from 'commander';
import { compileXsd } from '../index';

const program = new Command();

program
  .name('xsd-zod')
  .description('Generate Zod validators and TypeScript types from XSD schemas')
  .version('0.1.0');

program
  .argument('<input>', 'Input XSD file or directory')
  .option('-o, --output <dir>', 'Output directory', './generated')
  .option('-n, --naming <convention>', 'Naming convention (camel, pascal, original, kebab)', 'camel')
  .option('-s, --separate', 'Generate separate type and validator files', true)
  .option('-c, --combined', 'Generate single combined file', false)
  .action(async (input, options) => {
    try {
      const separate = options.combined ? false : options.separate;

      await compileXsd({
        input,
        output: options.output,
        naming: options.naming,
        separate,
        watch: false
      });
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
