#!/usr/bin/env node

/**
 * Mermaid-Sonar CLI
 *
 * Command-line interface for analyzing Mermaid diagram complexity
 */

import { program } from 'commander';
import { analyzeDiagramFileWithRules } from './index';
import { readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import chalk from 'chalk';
import type { AnalysisResult } from './analyzers/types';
import type { OutputFormat } from './reporters/types';
import { createReporter, generateSummary } from './reporters';
import { findFiles } from './cli/files';
import { determineExitCode, ExitCode } from './cli/exit-codes';
import { loadConfigSync } from './config';

// Read package.json for version
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));

/**
 * CLI options interface
 */
interface CLIOptions {
  format: OutputFormat;
  output?: string;
  config?: string;
  quiet: boolean;
  verbose: boolean;
  recursive: boolean;
  strict: boolean;
  maxWarnings?: number;
  noRules: boolean;
}

/**
 * Main CLI function
 */
async function runCLI(files: string[], options: CLIOptions): Promise<number> {
  const startTime = Date.now();

  try {
    // Find all matching files
    const filePaths = await findFiles(files, {
      recursive: options.recursive,
      extensions: ['.md'],
    });

    if (filePaths.length === 0) {
      if (!options.quiet) {
        console.error(chalk.red('Error: No markdown files found'));
      }
      return ExitCode.EXECUTION_FAILURE;
    }

    if (options.verbose && !options.quiet) {
      console.log(chalk.dim(`Analyzing ${filePaths.length} file(s)...\n`));
    }

    // Load configuration
    const config = options.config ? loadConfigSync(options.config) : loadConfigSync();

    // Analyze all files
    const allResults: AnalysisResult[] = [];

    for (const filePath of filePaths) {
      try {
        const results = options.noRules
          ? analyzeDiagramFileWithRules(filePath, config).map((r) => ({ ...r, issues: [] }))
          : analyzeDiagramFileWithRules(filePath, config);

        allResults.push(...results);
      } catch (error) {
        if (!options.quiet) {
          console.error(
            chalk.red(
              `Error analyzing ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
        }
      }
    }

    if (allResults.length === 0) {
      if (!options.quiet) {
        console.log('No Mermaid diagrams found.');
      }
      return ExitCode.SUCCESS;
    }

    // Generate summary
    const duration = Date.now() - startTime;
    const summary = generateSummary(allResults, duration);

    // Format output
    const reporter = createReporter(options.format, packageJson.version);
    const output = reporter.format(allResults, summary);

    // Write output
    if (options.output) {
      await writeFile(options.output, output, 'utf-8');
      if (!options.quiet) {
        console.log(chalk.green(`Report written to ${options.output}`));
      }
    } else {
      console.log(output);
    }

    // Determine exit code
    return determineExitCode(summary, {
      strict: options.strict,
      maxWarnings: options.maxWarnings,
    });
  } catch (error) {
    if (!options.quiet) {
      console.error(
        chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      );
    }
    return ExitCode.EXECUTION_FAILURE;
  }
}

/**
 * Main CLI program
 */
program
  .name('mermaid-sonar')
  .description('Detect hidden complexity in Mermaid diagrams')
  .version(packageJson.version)
  .argument('<files...>', 'Files, directories, or glob patterns to analyze')
  .option(
    '-f, --format <format>',
    'Output format (console, json, markdown, github, junit)',
    'console'
  )
  .option('-o, --output <file>', 'Write output to file instead of stdout')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-q, --quiet', 'Suppress non-error output', false)
  .option('-v, --verbose', 'Show detailed analysis information', false)
  .option('-r, --recursive', 'Recursively scan directories', false)
  .option('-s, --strict', 'Treat warnings as errors', false)
  .option('--max-warnings <number>', 'Maximum warnings before failing', (val) => parseInt(val, 10))
  .option('--no-rules', 'Disable rule validation (only show metrics)', false)
  .action(async (files: string[], options: CLIOptions) => {
    // Validate format
    const validFormats: OutputFormat[] = ['console', 'json', 'markdown', 'github', 'junit'];
    if (!validFormats.includes(options.format)) {
      console.error(
        chalk.red(
          `Error: Invalid format "${options.format}". Valid formats: ${validFormats.join(', ')}`
        )
      );
      process.exit(ExitCode.EXECUTION_FAILURE);
    }

    const exitCode = await runCLI(files, options);
    process.exit(exitCode);
  });

program.parse();
