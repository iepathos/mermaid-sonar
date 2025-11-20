/**
 * Sequence Diagram Height Rule
 *
 * Detects sequence diagrams that will be too tall for standard viewports due to
 * excessive message count or deep control structure nesting.
 *
 * Sequence diagrams grow vertically with each message, loop, and control block,
 * causing readability issues when too many messages are shown.
 */

import type { Rule, Issue, RuleConfig } from './types';
import type { Diagram } from '../extractors/types';
import type { Metrics } from '../analyzers/types';
import {
  analyzeSequenceDiagram,
  estimateSequenceDiagramHeight,
} from '../analyzers/sequence-analyzer';

/**
 * Generates suggestions for reducing sequence diagram height
 */
function generateSuggestions(
  height: number,
  targetHeight: number,
  messageCount: number,
  nestingDepth: number,
  hasLoops: boolean,
  hasAlts: boolean
): string {
  const exceedsBy = height - targetHeight;
  const suggestions: string[] = [];

  suggestions.push(
    'Split into multiple sequence diagrams by logical phases (e.g., separate setup, processing, teardown flows)'
  );

  if (messageCount > 20) {
    suggestions.push(
      'Focus each diagram on a specific scenario or use case rather than showing the entire flow'
    );
  }

  if (hasLoops) {
    suggestions.push(
      'Simplify loop blocks by showing one iteration or referencing them in a separate diagram'
    );
  }

  if (hasAlts) {
    suggestions.push(
      'Consider splitting alt/else branches into separate sequence diagrams for different scenarios'
    );
  }

  if (nestingDepth > 2) {
    suggestions.push(
      'Reduce nesting depth by extracting nested control structures into separate diagrams'
    );
  }

  suggestions.push('Use notes and references to external diagrams instead of showing every detail');

  const header =
    `Sequence diagram height (${height}px) exceeds viewport limit (${targetHeight}px) by ${exceedsBy}px.\n` +
    `${messageCount} messages, nesting depth: ${nestingDepth}.\n\n` +
    'Suggestions:\n';

  return header + suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
}

/**
 * Sequence diagram height rule
 *
 * Checks if sequence diagrams exceed reasonable viewport heights based on
 * message count and control structure complexity.
 */
export const sequenceDiagramHeightRule: Rule = {
  name: 'sequence-diagram-height',
  defaultSeverity: 'warning',

  check(diagram: Diagram, _metrics: Metrics, config: RuleConfig): Issue | null {
    // Only check sequence diagrams
    if (diagram.type !== 'sequence') {
      return null;
    }

    const severity = config.severity ?? this.defaultSeverity;

    // Analyze sequence diagram
    const analysis = analyzeSequenceDiagram(diagram);
    const height = estimateSequenceDiagramHeight(analysis);

    // Configuration with defaults
    const targetHeight = (config.targetHeight as number) ?? 1000;
    const thresholds =
      (config.thresholds as { info?: number; warning?: number; error?: number }) ?? {};
    const infoThreshold = thresholds.info ?? 1200; // ~20-24 messages
    const warningThreshold = thresholds.warning ?? 1700; // ~30-34 messages
    const errorThreshold = thresholds.error ?? 2500; // ~50 messages

    // Determine severity based on height
    let issueSeverity: 'info' | 'warning' | 'error' | null = null;
    if (height >= errorThreshold) {
      issueSeverity = 'error';
    } else if (height >= warningThreshold) {
      issueSeverity = 'warning';
    } else if (height >= infoThreshold) {
      issueSeverity = 'info';
    }

    // No issue if within limits
    if (!issueSeverity) {
      return null;
    }

    const messageCount = analysis.parse.messageCount;
    const nestingDepth = analysis.parse.nestingDepth;

    const message = `Sequence diagram height (${height}px) exceeds viewport limit due to ${messageCount} messages`;

    const suggestion = generateSuggestions(
      height,
      targetHeight,
      messageCount,
      nestingDepth,
      analysis.parse.hasLoops,
      analysis.parse.hasAlts
    );

    return {
      rule: this.name,
      severity: issueSeverity === 'info' ? 'info' : issueSeverity === 'error' ? 'error' : severity,
      message,
      filePath: diagram.filePath,
      line: diagram.startLine,
      suggestion,
    };
  },
};
