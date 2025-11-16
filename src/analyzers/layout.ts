/**
 * Layout recommendation system
 *
 * Analyzes graph patterns to recommend optimal layout direction
 * (LR vs TD) based on structural characteristics.
 */

import type {
  GraphRepresentation,
  LayoutRecommendation,
  Pattern,
  LayoutDirection,
} from '../graph/types';
import type { Diagram } from '../extractors/types';

/**
 * Extracts current layout direction from diagram content
 *
 * @param diagram - Diagram to analyze
 * @returns Current layout direction if found
 */
function detectCurrentLayout(diagram: Diagram): LayoutDirection | undefined {
  const content = diagram.content.toLowerCase();

  if (content.includes('graph lr')) return 'LR';
  if (content.includes('graph td')) return 'TD';
  if (content.includes('graph tb')) return 'TB';
  if (content.includes('graph rl')) return 'RL';

  if (content.includes('flowchart lr')) return 'LR';
  if (content.includes('flowchart td')) return 'TD';
  if (content.includes('flowchart tb')) return 'TB';
  if (content.includes('flowchart rl')) return 'RL';

  return undefined;
}

/**
 * Recommends layout direction based on detected patterns
 *
 * Decision logic:
 * - Sequential pattern (high spine ratio) → LR (left-right)
 * - Hierarchical pattern (tree structure) → TD (top-down)
 * - Mixed patterns → use highest confidence
 *
 * @param graph - Graph representation
 * @param patterns - Detected patterns
 * @returns Layout recommendation
 */
export function recommendLayout(
  _graph: GraphRepresentation,
  patterns: Pattern[],
  diagram?: Diagram
): LayoutRecommendation {
  const current = diagram ? detectCurrentLayout(diagram) : undefined;

  // Default: TD for general diagrams
  let recommended: LayoutDirection = 'TD';
  let reason = 'Default top-down layout for general diagrams';
  let confidence = 0.3;
  const supportingPatterns: Pattern[] = [];

  // Check for sequential pattern (prefers LR)
  const sequential = patterns.find((p) => p.type === 'sequential');
  if (sequential && sequential.confidence > confidence) {
    recommended = 'LR';
    reason = 'Sequential flow pattern detected - left-right layout improves readability';
    confidence = sequential.confidence;
    supportingPatterns.push(sequential);
  }

  // Check for hierarchical pattern (prefers TD)
  const hierarchical = patterns.find((p) => p.type === 'hierarchical');
  if (hierarchical && hierarchical.confidence > confidence) {
    recommended = 'TD';
    reason = 'Hierarchical structure detected - top-down layout shows hierarchy better';
    confidence = hierarchical.confidence;
    supportingPatterns.length = 0; // Clear previous
    supportingPatterns.push(hierarchical);
  }

  // Add other relevant patterns
  const wideBranching = patterns.find((p) => p.type === 'wide-branching');
  if (wideBranching) {
    supportingPatterns.push(wideBranching);
  }

  return {
    current,
    recommended,
    reason,
    confidence,
    patterns: supportingPatterns,
  };
}
