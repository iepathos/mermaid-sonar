/**
 * Layout Recommendation Rule
 *
 * Analyzes diagram structure and recommends optimal layout direction
 * based on detected patterns (sequential, hierarchical, etc.).
 */

import type { Rule, Issue, RuleConfig } from './types';
import type { Diagram } from '../extractors/types';
import type { Metrics } from '../analyzers/types';
import { buildGraph } from '../graph/adjacency';
import { detectPatterns } from '../analyzers/patterns';
import { recommendLayout } from '../analyzers/layout';

/**
 * Layout recommendation rule
 *
 * Provides informational suggestions for optimal layout direction
 * based on structural pattern analysis.
 */
export const layoutHintRule: Rule = {
  name: 'layout-hint',
  defaultSeverity: 'warning',

  check(diagram: Diagram, _metrics: Metrics, config: RuleConfig): Issue | null {
    const severity = config.severity ?? this.defaultSeverity;
    const minConfidence = (config.minConfidence as number) ?? 0.6;

    // Build graph and detect patterns
    const graph = buildGraph(diagram);
    const patterns = detectPatterns(graph);

    // Get layout recommendation
    const recommendation = recommendLayout(graph, patterns, diagram);

    // Only suggest if confidence is high enough
    if (recommendation.confidence < minConfidence) {
      return null;
    }

    // Only suggest if different from current or current is unknown
    if (recommendation.current && recommendation.current === recommendation.recommended) {
      return null;
    }

    let message = recommendation.reason;
    if (recommendation.current) {
      message += ` (current: ${recommendation.current}, suggested: ${recommendation.recommended})`;
    } else {
      message += ` (suggested: ${recommendation.recommended})`;
    }

    const patternInfo = recommendation.patterns
      .map((p) => `  - ${p.type}: ${p.evidence.join(', ')}`)
      .join('\n');

    const suggestion = `Consider changing layout to ${recommendation.recommended}:\n\nDetected patterns:\n${patternInfo}\n\nExample:\n${recommendation.patterns[0]?.example || `graph ${recommendation.recommended}\n  A --> B --> C`}`;

    return {
      rule: this.name,
      severity,
      message,
      filePath: diagram.filePath,
      line: diagram.startLine,
      suggestion,
    };
  },
};
