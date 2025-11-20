/**
 * Sequence Diagram Width Rule
 *
 * Detects sequence diagrams that will be too wide for standard viewports due to
 * excessive participant count.
 *
 * Sequence diagrams layout participants horizontally across the top, causing width
 * issues when many participants exist.
 */

import type { Rule, Issue, RuleConfig } from './types';
import type { Diagram } from '../extractors/types';
import type { Metrics } from '../analyzers/types';
import {
  analyzeSequenceDiagram,
  estimateSequenceDiagramWidth,
} from '../analyzers/sequence-analyzer';

/**
 * Generates suggestions for reducing sequence diagram width
 */
function generateSuggestions(
  width: number,
  targetWidth: number,
  participantCount: number,
  messageCount: number
): string {
  const exceedsBy = width - targetWidth;
  const suggestions: string[] = [];

  suggestions.push(
    'Split into multiple sequence diagrams by logical phases or functional areas (e.g., separate authentication, data processing, response handling)'
  );

  if (participantCount > 6) {
    suggestions.push(
      'Focus each diagram on a specific interaction flow with fewer participants (typically 3-5 participants per diagram)'
    );
  }

  if (participantCount > 4) {
    suggestions.push('Group related services into single participants where appropriate');
  }

  suggestions.push(
    'Consider using participant boxes to group related actors without showing all details'
  );

  suggestions.push(
    'For complex systems, create overview diagram with main actors, then detail diagrams for subsystems'
  );

  const header =
    `Sequence diagram width (${width}px) exceeds viewport limit (${targetWidth}px) by ${exceedsBy}px.\n` +
    `${participantCount} participants, ${messageCount} messages.\n\n` +
    'Suggestions:\n';

  return header + suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
}

/**
 * Sequence diagram width rule
 *
 * Checks if sequence diagrams exceed reasonable viewport widths based on
 * participant count.
 */
export const sequenceDiagramWidthRule: Rule = {
  name: 'sequence-diagram-width',
  defaultSeverity: 'warning',

  check(diagram: Diagram, _metrics: Metrics, config: RuleConfig): Issue | null {
    // Only check sequence diagrams
    if (diagram.type !== 'sequence') {
      return null;
    }

    const severity = config.severity ?? this.defaultSeverity;

    // Analyze sequence diagram
    const analysis = analyzeSequenceDiagram(diagram);
    const width = estimateSequenceDiagramWidth(analysis);

    // Configuration with defaults
    const targetWidth = (config.targetWidth as number) ?? 1200;
    const thresholds =
      (config.thresholds as { info?: number; warning?: number; error?: number }) ?? {};
    const infoThreshold = thresholds.info ?? 1000; // ~5 participants
    const warningThreshold = thresholds.warning ?? 1400; // ~7 participants
    const errorThreshold = thresholds.error ?? 1800; // ~9 participants

    // Determine severity based on width
    let issueSeverity: 'info' | 'warning' | 'error' | null = null;
    if (width >= errorThreshold) {
      issueSeverity = 'error';
    } else if (width >= warningThreshold) {
      issueSeverity = 'warning';
    } else if (width >= infoThreshold) {
      issueSeverity = 'info';
    }

    // No issue if within limits
    if (!issueSeverity) {
      return null;
    }

    const participantCount = analysis.participantCount;
    const messageCount = analysis.parse.messageCount;

    const message = `Sequence diagram width (${width}px) exceeds viewport limit due to ${participantCount} participants`;

    const suggestion = generateSuggestions(width, targetWidth, participantCount, messageCount);

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
