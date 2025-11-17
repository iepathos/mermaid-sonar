/**
 * Disconnected Components Rule
 *
 * Detects when a diagram contains multiple disconnected graphs
 * that should likely be split into separate diagrams.
 */

import type { Rule, Issue, RuleConfig } from './types';
import type { Diagram } from '../extractors/types';
import type { Metrics } from '../analyzers/types';
import { buildGraph } from '../graph/adjacency';
import { findComponents } from '../graph/algorithms';

/**
 * Disconnected components rule
 *
 * Identifies diagrams with multiple separate graphs that
 * would be clearer as individual diagrams.
 */
export const disconnectedRule: Rule = {
  name: 'disconnected-components',
  defaultSeverity: 'warning',
  defaultThreshold: 2,

  check(diagram: Diagram, _metrics: Metrics, config: RuleConfig): Issue | null {
    const severity = config.severity ?? this.defaultSeverity;
    const threshold = config.threshold ?? this.defaultThreshold ?? 2;

    const graph = buildGraph(diagram);
    const components = findComponents(graph);

    if (components.length < threshold) {
      return null;
    }

    const componentSizes = components.map((c) => c.length).sort((a, b) => b - a);
    const componentInfo = componentSizes
      .slice(0, 5)
      .map((size, i) => `  - Component ${i + 1}: ${size} nodes`)
      .join('\n');

    const message = `Diagram contains ${components.length} disconnected components`;

    const suggestion = `This diagram has multiple separate graphs:\n\n${componentInfo}\n\nConsider:\n- Splitting into ${components.length} separate diagrams\n- Each diagram focusing on one logical concern\n- Using references or links between diagrams if they're related`;

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
