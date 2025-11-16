/**
 * Reserved Word Detection Rule
 *
 * Detects usage of Mermaid reserved words as node IDs,
 * which can cause syntax errors or unexpected rendering.
 */

import type { Rule, Issue, RuleConfig } from './types';
import type { Diagram } from '../extractors/types';
import type { Metrics } from '../analyzers/types';

/**
 * Mermaid reserved words and problematic patterns
 */
const RESERVED_WORDS = new Set([
  'end', // Conflicts with subgraph end
  'click', // Reserved for click events
  'call', // Reserved for function calls
  'style', // Reserved for styling
  'class', // Reserved for class definitions
  'classDef', // Reserved for class definitions
  'direction', // Reserved for direction setting
]);

/**
 * Extracts all node IDs from diagram content
 *
 * @param content - Diagram content
 * @returns Array of node IDs
 */
function extractNodeIds(content: string): string[] {
  const nodeIds = new Set<string>();
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Match node definitions and edges
    // eslint-disable-next-line no-useless-escape
    const nodePattern = /\b([a-zA-Z][a-zA-Z0-9]*)\b/g;
    let match;

    while ((match = nodePattern.exec(trimmed)) !== null) {
      const nodeId = match[1];
      // Filter out Mermaid keywords
      if (!['graph', 'flowchart', 'subgraph', 'LR', 'TD', 'TB', 'RL'].includes(nodeId)) {
        nodeIds.add(nodeId);
      }
    }
  }

  return Array.from(nodeIds);
}

/**
 * Checks if node ID is a reserved word
 *
 * @param nodeId - Node ID to check
 * @returns True if reserved
 */
function isReservedWord(nodeId: string): boolean {
  const lower = nodeId.toLowerCase();
  return RESERVED_WORDS.has(lower);
}

/**
 * Checks if node ID has problematic pattern
 *
 * Patterns:
 * - Starts with 'o' + digits (conflicts with circle syntax: o123)
 * - Starts with 'x' + digits (conflicts with cross syntax: x123)
 *
 * @param nodeId - Node ID to check
 * @returns True if problematic
 */
function hasProblematicPattern(nodeId: string): boolean {
  // Matches o123, x456, etc.
  return /^[ox]\d+$/i.test(nodeId);
}

/**
 * Reserved words rule
 *
 * Detects reserved words and problematic node ID patterns.
 */
export const reservedWordsRule: Rule = {
  name: 'reserved-words',
  defaultSeverity: 'warning',

  check(diagram: Diagram, _metrics: Metrics, config: RuleConfig): Issue | null {
    const severity = config.severity ?? this.defaultSeverity;

    const nodeIds = extractNodeIds(diagram.content);
    const reserved = nodeIds.filter(isReservedWord);
    const problematic = nodeIds.filter(hasProblematicPattern);

    const issues: string[] = [];

    if (reserved.length > 0) {
      issues.push(`Reserved words: ${reserved.join(', ')}`);
    }

    if (problematic.length > 0) {
      issues.push(`Problematic patterns: ${problematic.join(', ')}`);
    }

    if (issues.length === 0) {
      return null;
    }

    const message = `Found ${reserved.length + problematic.length} reserved/problematic node ID(s)`;

    const reservedList =
      reserved.length > 0
        ? `\nReserved words:\n${reserved.map((w) => `  - ${w} (use ${w}Node or _${w} instead)`).join('\n')}`
        : '';

    const problematicList =
      problematic.length > 0
        ? `\nProblematic patterns:\n${problematic.map((w) => `  - ${w} (conflicts with Mermaid syntax, use ${w}_node instead)`).join('\n')}`
        : '';

    const suggestion = `Avoid reserved words and conflicting patterns:\n${reservedList}${problematicList}\n\nSuggestions:\n- Prefix with underscore: _end, _click\n- Use descriptive names: endNode, clickHandler\n- Avoid o/x followed by digits: use item_o1 instead of o1`;

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
