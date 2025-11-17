/**
 * Mermaid-Sonar: Complexity analyzer and readability linter for Mermaid diagrams
 *
 * Main exports for programmatic usage
 */

// Re-export types
export type { Diagram, DiagramType } from './extractors/types';
export type { Metrics, AnalysisResult } from './analyzers/types';
export type { Issue, Severity, Rule, RuleConfig } from './rules';
export type { Config, PartialConfig } from './config';
export type { Reporter, OutputFormat, Summary, JSONOutput } from './reporters';

// Re-export extraction functions
export { extractDiagrams, extractDiagramsFromFile } from './extractors/markdown';

// Re-export analysis functions
export { analyzeStructure } from './analyzers/structure';

// Re-export configuration functions
export { loadConfig, loadConfigSync, defaultConfig } from './config';

// Re-export rule functions
export { runRules, getAllRules, getRule } from './rules';

// Re-export reporter functions
export { createReporter, generateSummary } from './reporters';
export {
  ConsoleReporter,
  JSONReporter,
  MarkdownReporter,
  GitHubReporter,
  JUnitReporter,
} from './reporters';

// Main API
import { extractDiagramsFromFile } from './extractors/markdown';
import { analyzeStructure } from './analyzers/structure';
import { runRules } from './rules';
import { loadConfigSync } from './config';
import type { AnalysisResult } from './analyzers/types';
import type { Config } from './config';

/**
 * Analyzes all Mermaid diagrams in a markdown file (without rules)
 *
 * @param filePath - Path to markdown file
 * @returns Array of analysis results (one per diagram)
 */
export function analyzeDiagramFile(filePath: string): AnalysisResult[] {
  const diagrams = extractDiagramsFromFile(filePath);

  return diagrams.map((diagram) => ({
    diagram,
    metrics: analyzeStructure(diagram),
  }));
}

/**
 * Analyzes all Mermaid diagrams in a markdown file with rule validation
 *
 * @param filePath - Path to markdown file
 * @param config - Optional configuration (defaults loaded from file system)
 * @returns Promise of array of analysis results with issues
 */
export async function analyzeDiagramFileWithRules(
  filePath: string,
  config?: Config
): Promise<AnalysisResult[]> {
  const diagrams = extractDiagramsFromFile(filePath);
  const resolvedConfig = config ?? loadConfigSync();

  return Promise.all(
    diagrams.map(async (diagram) => {
      const metrics = analyzeStructure(diagram);
      const issues = await runRules(diagram, metrics, resolvedConfig);

      return {
        diagram,
        metrics,
        issues,
      };
    })
  );
}
