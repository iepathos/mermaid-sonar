#!/usr/bin/env node

/**
 * Mermaid-Sonar CLI
 *
 * Command-line interface for analyzing Mermaid diagram complexity
 */

import { program } from 'commander';
import { analyzeDiagramFile } from './index';
import { readFileSync } from 'fs';

// Read package.json for version
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));

/**
 * Formats metrics for terminal output
 */
function formatMetrics(metrics: {
  nodeCount: number;
  edgeCount: number;
  graphDensity: number;
  maxBranchWidth: number;
  averageDegree: number;
}): string {
  return `
  Nodes:          ${metrics.nodeCount}
  Edges:          ${metrics.edgeCount}
  Density:        ${metrics.graphDensity.toFixed(3)}
  Max Branch:     ${metrics.maxBranchWidth}
  Avg Degree:     ${metrics.averageDegree.toFixed(2)}
`.trim();
}

/**
 * Main CLI command
 */
program
  .name('mermaid-sonar')
  .description('Detect hidden complexity in Mermaid diagrams')
  .version(packageJson.version)
  .argument('<file>', 'Markdown file to analyze')
  .action((file: string) => {
    try {
      const results = analyzeDiagramFile(file);

      if (results.length === 0) {
        console.log('No Mermaid diagrams found in file.');
        return;
      }

      console.log(`\nAnalyzed ${results.length} diagram(s) in ${file}\n`);

      results.forEach((result, index) => {
        const { diagram, metrics } = result;
        console.log(`Diagram #${index + 1} (line ${diagram.startLine}):`);
        console.log(formatMetrics(metrics));
        console.log('');
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unexpected error occurred');
      }
      process.exit(1);
    }
  });

program.parse();
