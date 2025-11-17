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
import { calculateLongestLinearChain } from '../graph/algorithms';

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

    // BIDIRECTIONAL VALIDATION: Check if recommending LR for a TD diagram
    // If chain is too long, suppress LR recommendation and suggest alternatives
    const isRecommendingLR =
      recommendation.recommended === 'LR' || recommendation.recommended === 'RL';
    const currentIsTD =
      !recommendation.current || recommendation.current === 'TD' || recommendation.current === 'TB';

    if (isRecommendingLR && currentIsTD) {
      const chainAnalysis = calculateLongestLinearChain(graph);
      const lrThreshold = 8;

      if (chainAnalysis.length > lrThreshold) {
        // Chain too long for LR - provide alternative suggestions
        const message = `Sequential flow with ${chainAnalysis.length} nodes - too long for LR conversion`;

        const suggestions = [
          'Consider organizing into subgraphs to break up the chain',
          'Keep TD layout but improve visual hierarchy',
          'Simplify by removing intermediate nodes if possible',
        ];

        const suggestion = `Chain detected: ${chainAnalysis.path.slice(0, 3).join(' → ')}${chainAnalysis.path.length > 3 ? ' ...' : ''} (${chainAnalysis.length} nodes)\n\nLR layout not recommended due to excessive horizontal width.\n\nAlternative improvements:\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nExample subgraph organization:\nsubgraph Phase1\n  direction TB\n  ${chainAnalysis.path.slice(0, Math.min(3, chainAnalysis.path.length)).join(' --> ')}\nend\n\nsubgraph Phase2\n  direction TB\n  ${chainAnalysis.path.slice(Math.min(3, chainAnalysis.path.length)).join(' --> ')}\nend`;

        return {
          rule: this.name,
          severity: 'info',
          message,
          filePath: diagram.filePath,
          line: diagram.startLine,
          suggestion,
        };
      }
    }

    // Normal recommendation flow
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
