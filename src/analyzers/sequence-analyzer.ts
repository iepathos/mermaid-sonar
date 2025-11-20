/**
 * Sequence diagram analysis utilities
 *
 * Analyzes sequence diagram structure for width and height estimation
 */

import type { Diagram } from '../extractors/types';
import type { SequenceAnalysis } from '../graph/sequence-parser';
import { parseSequenceDiagram } from '../graph/sequence-parser';

/**
 * Analysis result for a sequence diagram
 */
export interface SequenceComplexityAnalysis {
  /** Parsed sequence diagram structure */
  parse: SequenceAnalysis;
  /** Number of participants */
  participantCount: number;
  /** Average participant label length in characters */
  avgLabelLength: number;
  /** Maximum participant label length in characters */
  maxLabelLength: number;
  /** Estimated width in pixels */
  estimatedWidth: number;
  /** Estimated height in pixels */
  estimatedHeight: number;
}

/**
 * Calculates average label length across participants
 */
function calculateAvgLabelLength(parse: SequenceAnalysis): number {
  const labels = Array.from(parse.participants.values()).map((p) => p.label.length);

  if (labels.length === 0) {
    return 0;
  }

  const sum = labels.reduce((acc, len) => acc + len, 0);
  return Math.round(sum / labels.length);
}

/**
 * Calculates maximum label length across participants
 */
function calculateMaxLabelLength(parse: SequenceAnalysis): number {
  const labels = Array.from(parse.participants.values()).map((p) => p.label.length);

  if (labels.length === 0) {
    return 0;
  }

  return Math.max(...labels);
}

/**
 * Estimates width of a sequence diagram in pixels
 *
 * Width is primarily determined by participant count and label lengths.
 * Formula: participantCount × participantSpacing
 */
function estimateWidth(parse: SequenceAnalysis): number {
  const participantCount = parse.participants.size;

  if (participantCount === 0) {
    return 0;
  }

  // Mermaid sequence diagram layout parameters
  const participantSpacing = 200; // pixels per participant (includes box and margin)
  const groupOverhead = 50; // extra width for box/group borders (if any)

  // Base width calculation
  const baseWidth = participantCount * participantSpacing;

  // Add group overhead (conservative estimate - assume groups exist if >3 participants)
  const hasGroups = participantCount > 3;
  const width = baseWidth + (hasGroups ? groupOverhead : 0);

  return width;
}

/**
 * Estimates height of a sequence diagram in pixels
 *
 * Height grows linearly with message count, with overhead for control structures.
 * Formula: messageCount × messageHeight + blockOverhead + nestingOverhead
 */
function estimateHeight(parse: SequenceAnalysis): number {
  const messageHeight = 50; // pixels per message line
  const loopOverhead = 80; // extra height for loop blocks
  const altOverhead = 60; // extra height for alt/else blocks
  const parOverhead = 70; // extra height for parallel blocks
  const nestingOverhead = 40; // extra height per nesting level

  // Base height from messages
  let height = parse.messageCount * messageHeight;

  // Add overhead for control structures
  if (parse.hasLoops) {
    height += loopOverhead;
  }
  if (parse.hasAlts) {
    height += altOverhead;
  }
  if (parse.hasPar) {
    height += parOverhead;
  }

  // Add overhead for nesting depth
  height += parse.nestingDepth * nestingOverhead;

  return height;
}

/**
 * Analyzes a sequence diagram for width and height estimation
 *
 * @param diagram - Sequence diagram to analyze
 * @returns Analysis with dimension metrics
 */
export function analyzeSequenceDiagram(diagram: Diagram): SequenceComplexityAnalysis {
  const parse = parseSequenceDiagram(diagram.content);

  const participantCount = parse.participants.size;
  const avgLabelLength = calculateAvgLabelLength(parse);
  const maxLabelLength = calculateMaxLabelLength(parse);
  const estimatedWidth = estimateWidth(parse);
  const estimatedHeight = estimateHeight(parse);

  return {
    parse,
    participantCount,
    avgLabelLength,
    maxLabelLength,
    estimatedWidth,
    estimatedHeight,
  };
}

/**
 * Estimates width of a sequence diagram in pixels
 * (wrapper for backward compatibility)
 */
export function estimateSequenceDiagramWidth(analysis: SequenceComplexityAnalysis): number {
  return analysis.estimatedWidth;
}

/**
 * Estimates height of a sequence diagram in pixels
 * (wrapper for backward compatibility)
 */
export function estimateSequenceDiagramHeight(analysis: SequenceComplexityAnalysis): number {
  return analysis.estimatedHeight;
}
