/**
 * Vertical Height Readability Rule
 *
 * Detects diagrams that exceed comfortable viewport heights, making it impossible
 * to view all nodes simultaneously without scrolling. This breaks the fundamental
 * purpose of diagrams - showing relationships and flow at a glance.
 *
 * For TD/TB layouts: Height is determined by graph depth (longest path)
 * For LR/RL layouts: Height is determined by max branch width (parallel branches)
 */

import type { Rule, Issue, RuleConfig, Severity } from './types';
import type { Diagram } from '../extractors/types';
import type { Metrics } from '../analyzers/types';
import type { LayoutDirection } from '../graph/types';
import { buildGraph } from '../graph/adjacency';
import { findRootNodes, calculateMaxDepth } from '../graph/algorithms';

/**
 * Height analysis result
 */
interface HeightAnalysis {
  /** Layout direction */
  layout: LayoutDirection;
  /** Estimated height in pixels */
  estimatedHeight: number;
  /** Target height threshold in pixels */
  targetHeight: number;
  /** Pixels exceeding target */
  exceedsBy: number;
  /** Severity level (null if within limits) */
  severity: Severity | null;
  /** Height source (depth for TD, branching for LR) */
  heightSource: 'depth' | 'branching';
  /** Maximum depth for TD/TB layouts */
  maxDepth?: number;
  /** Maximum branch width for LR/RL layouts */
  maxBranchWidth?: number;
}

/**
 * Extracts layout direction from diagram content
 */
function detectLayout(diagram: Diagram): LayoutDirection {
  const content = diagram.content.toLowerCase();

  if (
    content.includes('graph lr') ||
    content.includes('flowchart lr') ||
    content.includes('direction lr')
  ) {
    return 'LR';
  }
  if (
    content.includes('graph rl') ||
    content.includes('flowchart rl') ||
    content.includes('direction rl')
  ) {
    return 'RL';
  }
  if (
    content.includes('graph tb') ||
    content.includes('flowchart tb') ||
    content.includes('direction tb')
  ) {
    return 'TB';
  }

  // Default to TD
  return 'TD';
}

/**
 * Calculates maximum depth of the diagram graph
 *
 * Algorithm:
 * 1. Find all root nodes (nodes with no incoming edges)
 * 2. If roots exist, calculate max depth from each root
 * 3. If no roots (cyclic graph), try all nodes as potential starts
 * 4. Return maximum depth found
 *
 * @param graph - Graph representation
 * @returns Maximum depth (longest path from root to leaf)
 */
function calculateDiagramDepth(diagram: Diagram): number {
  const graph = buildGraph(diagram);
  const roots = findRootNodes(graph);

  if (roots.length === 0) {
    // No clear root - cyclic or disconnected graph
    // Use maximum depth from any node
    if (graph.nodes.length === 0) return 0;

    return Math.max(...graph.nodes.map((node) => calculateMaxDepth(graph, node)));
  }

  // Return maximum depth from any root
  return Math.max(...roots.map((root) => calculateMaxDepth(graph, root)));
}

/**
 * Estimates vertical height based on layout direction
 *
 * Formula:
 * - TD/TB: height = maxDepth × (nodeHeight + verticalSpacing)
 * - LR/RL: height = maxBranchWidth × (nodeHeight + verticalSpacing)
 *
 * @param layout - Layout direction
 * @param metrics - Pre-calculated metrics
 * @param diagram - Diagram content
 * @param config - Rule configuration
 * @returns Estimated height in pixels
 */
function estimateHeight(
  layout: LayoutDirection,
  metrics: Metrics,
  diagram: Diagram,
  config: RuleConfig
): { height: number; source: 'depth' | 'branching'; value: number } {
  // Configuration with defaults
  const nodeHeight = (config.nodeHeight as number) ?? 40; // Mermaid default box height
  const verticalSpacing = (config.verticalSpacing as number) ?? 50; // Spacing between layers
  const layerHeight = nodeHeight + verticalSpacing;

  if (layout === 'TD' || layout === 'TB') {
    // Vertical layouts: height determined by depth
    const depth = calculateDiagramDepth(diagram);
    return {
      height: depth * layerHeight,
      source: 'depth',
      value: depth,
    };
  } else {
    // Horizontal layouts: height determined by max branching
    return {
      height: metrics.maxBranchWidth * layerHeight,
      source: 'branching',
      value: metrics.maxBranchWidth,
    };
  }
}

/**
 * Calculates height analysis and severity
 */
function calculateHeightAnalysis(
  layout: LayoutDirection,
  metrics: Metrics,
  diagram: Diagram,
  config: RuleConfig
): HeightAnalysis {
  const {
    height: estimatedHeight,
    source,
    value,
  } = estimateHeight(layout, metrics, diagram, config);
  const targetHeight = (config.targetHeight as number) ?? 800;

  // Thresholds from config with defaults
  const thresholds =
    (config.thresholds as { info?: number; warning?: number; error?: number }) ?? {};
  const infoThreshold = thresholds.info ?? 800;
  const warningThreshold = thresholds.warning ?? 1200;
  const errorThreshold = thresholds.error ?? 2000;

  const exceedsBy = Math.max(0, estimatedHeight - targetHeight);

  let severity: Severity | null = null;
  if (estimatedHeight >= errorThreshold) {
    severity = 'error';
  } else if (estimatedHeight >= warningThreshold) {
    severity = 'warning';
  } else if (estimatedHeight >= infoThreshold) {
    severity = 'info';
  }

  const result: HeightAnalysis = {
    layout,
    estimatedHeight,
    targetHeight,
    exceedsBy,
    severity,
    heightSource: source,
  };

  if (source === 'depth') {
    result.maxDepth = value;
  } else {
    result.maxBranchWidth = value;
  }

  return result;
}

/**
 * Generates layout-specific suggestions for fixing height problems
 */
function generateSuggestions(analysis: HeightAnalysis): string {
  const suggestions: string[] = [];
  const isVertical = analysis.layout === 'TD' || analysis.layout === 'TB';

  if (isVertical) {
    // TD/TB layouts - depth is the problem
    suggestions.push(
      'Break into multiple diagrams organized by layers or phases:\n\n' +
        'Example: Split into "High-Level Overview" and "Detailed Implementation" diagrams'
    );
    suggestions.push(
      'Group intermediate nodes to reduce depth:\n\n' +
        'subgraph Implementation\n  B --> C --> D\nend\nA --> Implementation --> E'
    );
    suggestions.push('Abstract away some levels of detail - not every step needs to be shown');
    suggestions.push(
      'Use links or references between separate diagrams instead of one deep hierarchy'
    );
    // IMPORTANT: Do NOT suggest LR conversion for TD diagrams (would worsen width)
  } else {
    // LR/RL layouts - wide branching creates vertical expansion
    suggestions.push(
      'Convert to TD (top-down) layout to handle wide branching better:\n\n' +
        'graph TD\n  Start --> Branch1 & Branch2 & Branch3\n  ...'
    );
    suggestions.push(
      'Group parallel branches into subgraphs:\n\n' +
        'subgraph Category1\n  Branch1\n  Branch2\nend\n' +
        'subgraph Category2\n  Branch3\n  Branch4\nend'
    );
    suggestions.push('Split into multiple diagrams by category or functional area');
    suggestions.push('Reduce number of parallel paths shown simultaneously');
  }

  const sourceDescription = isVertical
    ? `${analysis.maxDepth} levels of depth`
    : `${analysis.maxBranchWidth} parallel branches`;

  const header =
    `This ${analysis.layout} layout with ${sourceDescription} creates excessive height.\n` +
    `Estimated height: ${analysis.estimatedHeight}px (exceeds ${analysis.targetHeight}px comfortable viewport by ${analysis.exceedsBy}px)\n\n` +
    `Why this matters: Users cannot compare or reference nodes that are scrolled out of view, ` +
    `breaking the fundamental purpose of visual diagrams.\n\n`;

  return header + 'Suggestions:\n' + suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
}

/**
 * Vertical height readability rule
 *
 * Detects when diagrams exceed comfortable viewport heights, requiring excessive
 * scrolling that breaks the ability to see all nodes simultaneously.
 */
export const verticalHeightReadabilityRule: Rule = {
  name: 'vertical-height-readability',
  defaultSeverity: 'warning',

  check(diagram: Diagram, metrics: Metrics, config: RuleConfig): Issue | null {
    const severity = config.severity ?? this.defaultSeverity;
    const layout = detectLayout(diagram);
    const analysis = calculateHeightAnalysis(layout, metrics, diagram, config);

    // No issue if within limits
    if (!analysis.severity) {
      return null;
    }

    const sourceType = analysis.heightSource === 'depth' ? 'graph depth' : 'parallel branches';
    const message = `Diagram height (${analysis.estimatedHeight}px) exceeds viewport limit due to ${sourceType} in ${layout} layout`;

    const suggestion = generateSuggestions(analysis);

    return {
      rule: this.name,
      severity:
        analysis.severity === 'info' ? 'info' : analysis.severity === 'error' ? 'error' : severity,
      message,
      filePath: diagram.filePath,
      line: diagram.startLine,
      suggestion,
    };
  },
};
