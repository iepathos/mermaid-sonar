/**
 * Long Label Detection Rule
 *
 * Warns when node labels exceed recommended length thresholds,
 * which can make diagrams harder to read and navigate.
 */

import type { Rule, Issue, RuleConfig } from './types';
import type { Diagram } from '../extractors/types';
import type { Metrics } from '../analyzers/types';

/**
 * Extracts node labels from diagram content
 *
 * Matches patterns like:
 * - A[Long Label Text]
 * - B{Decision with long text}
 * - C((Circle with text))
 *
 * @param content - Diagram content
 * @returns Array of [nodeId, label] tuples
 */
function extractLabels(content: string): Array<[string, string]> {
  const labels: Array<[string, string]> = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Match node definitions with labels
    const labelPattern = /(\w+)\s*[[{(]+([^\]})]+)[\]})]*/g;
    let match;

    while ((match = labelPattern.exec(trimmed)) !== null) {
      const [, nodeId, label] = match;
      labels.push([nodeId, label.trim()]);
    }
  }

  return labels;
}

/**
 * Long label rule
 *
 * Detects labels exceeding recommended length and suggests shorter alternatives.
 */
export const longLabelsRule: Rule = {
  name: 'long-labels',
  defaultSeverity: 'warning',
  defaultThreshold: 40,

  check(diagram: Diagram, _metrics: Metrics, config: RuleConfig): Issue | null {
    const severity = config.severity ?? this.defaultSeverity;
    const threshold = config.threshold ?? this.defaultThreshold ?? 40;

    const labels = extractLabels(diagram.content);
    const longLabels = labels.filter(([, label]) => label.length > threshold);

    if (longLabels.length === 0) {
      return null;
    }

    const examples = longLabels
      .slice(0, 3)
      .map(([id, label]) => `  - ${id}: "${label}" (${label.length} chars)`)
      .join('\n');

    const message = `${longLabels.length} node(s) with labels exceeding ${threshold} characters`;

    const suggestion = `Long labels reduce diagram readability. Consider:\n\n${examples}\n\nSuggestions:\n- Use abbreviations for technical terms\n- Move detailed descriptions to documentation\n- Break into multiple smaller nodes\n- Use shorter, more concise phrasing`;

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
