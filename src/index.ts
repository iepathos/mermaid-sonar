/**
 * Mermaid-Sonar: Complexity analyzer and readability linter for Mermaid diagrams
 *
 * Main exports for programmatic usage
 */

// Re-export types
export type { Diagram, DiagramType } from './extractors/types';
export type { Metrics, AnalysisResult } from './analyzers/types';

// Re-export extraction functions
export { extractDiagrams, extractDiagramsFromFile } from './extractors/markdown';

// Re-export analysis functions
export { analyzeStructure } from './analyzers/structure';

// Main API
import { extractDiagramsFromFile } from './extractors/markdown';
import { analyzeStructure } from './analyzers/structure';
import type { AnalysisResult } from './analyzers/types';

/**
 * Analyzes all Mermaid diagrams in a markdown file
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
