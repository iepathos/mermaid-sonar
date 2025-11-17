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

  // Mermaid keywords that should NEVER be extracted as node IDs
  // (These are structural keywords, not directives that can reference nodes)
  const structuralKeywords = new Set([
    'graph',
    'flowchart',
    'subgraph',
    'LR',
    'TD',
    'TB',
    'RL',
    'BT',
    'LD',
    'RD',
  ]);

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip directive lines (they reference node IDs but don't define them)
    if (
      trimmed.startsWith('style ') ||
      trimmed.startsWith('class ') ||
      trimmed.startsWith('classDef ') ||
      trimmed.startsWith('click ') ||
      trimmed.startsWith('direction ') ||
      trimmed === 'end'
    ) {
      continue;
    }

    // Skip graph/subgraph declaration lines
    if (
      trimmed.startsWith('graph ') ||
      trimmed.startsWith('flowchart ') ||
      trimmed.startsWith('subgraph ')
    ) {
      continue;
    }

    // Extract node IDs from node definitions and edges
    // Patterns: NodeID[label], NodeID-->Other, NodeID, etc.
    const nodePattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    let match;

    while ((match = nodePattern.exec(trimmed)) !== null) {
      const nodeId = match[1];
      // Filter out structural keywords only
      if (!structuralKeywords.has(nodeId)) {
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
 * Detects if a reserved word is used as a flowchart terminator node
 *
 * Terminator nodes are conventional in flowcharts and typically:
 * - Use stadium/pill shapes: ([label]) or ((label))
 * - Are named Start, End, Begin, or Complete
 * - Have no outgoing edges (sink nodes) or only incoming edges (source nodes)
 *
 * @param nodeId - Node ID to check
 * @param content - Full diagram content
 * @returns True if this is likely a terminator node
 */
function isFlowchartTerminator(nodeId: string, content: string): boolean {
  const lower = nodeId.toLowerCase();

  // Common terminator names
  const terminatorNames = new Set(['start', 'end', 'begin', 'complete', 'finish', 'done']);

  if (!terminatorNames.has(lower)) {
    return false;
  }

  // Check if used with terminator shapes: ([...]) or ((...)
  // Match patterns like: End([Complete]) or Start([Begin])
  const terminatorShapePattern = new RegExp(
    `\\b${nodeId}\\s*\\(\\([^)]+\\)\\)|\\b${nodeId}\\s*\\([^)]+\\)`,
    'i'
  );

  if (terminatorShapePattern.test(content)) {
    return true;
  }

  // Check if this is a sink node (only appears on right side of edges, never on left)
  // This catches nodes like: End[Display Only] that are targets but never sources
  const hasOutgoingEdges = new RegExp(`\\b${nodeId}\\s*-->`, 'i').test(content);

  // Node appears in the diagram but has no outgoing edges = sink node = likely terminator
  if (!hasOutgoingEdges && content.includes(nodeId)) {
    return true;
  }

  return false;
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

    // Filter out reserved words that are used as flowchart terminators
    const reserved = nodeIds.filter((id) => {
      if (!isReservedWord(id)) return false;
      // Allow reserved words if they're used as conventional terminators
      if (isFlowchartTerminator(id, diagram.content)) return false;
      return true;
    });

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
