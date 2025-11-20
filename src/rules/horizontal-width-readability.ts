/**
 * Horizontal Width Readability Rule
 *
 * Detects diagrams that will be too wide for standard viewports due to the
 * combination of layout direction, node count/branching, and label length.
 *
 * Key insight: Vertical scrolling is natural and expected; horizontal scrolling
 * breaks UX regardless of layout direction.
 */

import type { Rule, Issue, RuleConfig } from './types';
import type { Diagram } from '../extractors/types';
import type { Metrics } from '../analyzers/types';
import type { LayoutDirection, GraphRepresentation } from '../graph/types';
import { buildGraph } from '../graph/adjacency';
import { calculateLongestPath } from '../graph/algorithms';

/**
 * Label metrics extracted from diagram
 */
interface LabelMetrics {
  /** All labels found in the diagram */
  labels: Array<{ nodeId: string; label: string }>;
  /** Average label length across all nodes */
  avgLength: number;
  /** Maximum label length */
  maxLength: number;
}

/**
 * Width analysis result
 */
interface WidthAnalysis {
  /** Layout direction */
  layout: LayoutDirection;
  /** Label metrics */
  labelMetrics: LabelMetrics;
  /** Estimated width in pixels */
  estimatedWidth: number;
  /** Target width threshold in pixels */
  targetWidth: number;
  /** Pixels exceeding target */
  exceedsBy: number;
  /** Severity level (null if within limits) */
  severity: 'info' | 'warning' | 'error' | null;
  /** Width source (sequential for LR, branching for TD) */
  widthSource: 'sequential' | 'branching';
  /** Longest chain length (for LR/RL layouts) */
  longestChainLength?: number;
  /** Longest chain path (for debugging/messages) */
  longestChainPath?: string[];
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
 * Extracts labels from diagram content
 *
 * Matches patterns: A[label], B{label}, C((label)), etc.
 */
function extractLabels(content: string): LabelMetrics {
  const labels: Array<{ nodeId: string; label: string }> = [];

  // Pattern matches different node shapes:
  // A[label] - square brackets
  // B{label} - curly braces
  // C((label)) - double parentheses
  // D([label]) - rounded corners
  // E{{label}} - hexagon
  // F[(label)] - cylindrical
  let match: RegExpExecArray | null;

  // Match square brackets [label]
  const squareBracketPattern = /(\w+)\[([^\]]+)\]/g;
  while ((match = squareBracketPattern.exec(content)) !== null) {
    const nodeId = match[1];
    const label = match[2].trim();
    labels.push({ nodeId, label });
  }

  // Match curly braces {label}
  const curlyBracePattern = /(\w+)\{([^}]+)\}/g;
  while ((match = curlyBracePattern.exec(content)) !== null) {
    const nodeId = match[1];
    const label = match[2].trim();
    // Avoid duplicates
    if (!labels.find((l) => l.nodeId === nodeId)) {
      labels.push({ nodeId, label });
    }
  }

  // Match double parentheses ((label))
  const doubleParenPattern = /(\w+)\(\(([^)]+)\)\)/g;
  while ((match = doubleParenPattern.exec(content)) !== null) {
    const nodeId = match[1];
    const label = match[2].trim();
    if (!labels.find((l) => l.nodeId === nodeId)) {
      labels.push({ nodeId, label });
    }
  }

  // If no labels found, extract node IDs as labels
  if (labels.length === 0) {
    const nodePattern = /(\w+)\s*-->/g;
    while ((match = nodePattern.exec(content)) !== null) {
      const nodeId = match[1];
      if (!labels.find((l) => l.nodeId === nodeId)) {
        labels.push({ nodeId, label: nodeId });
      }
    }
  }

  // Calculate metrics
  if (labels.length === 0) {
    return { labels: [], avgLength: 0, maxLength: 0 };
  }

  /**
   * For multi-line labels, measure the longest line since that determines node width.
   * Example: "Pattern has\nregex chars\n() [] . * + ?" has 3 lines, width = longest line
   */
  function getEffectiveLabelLength(label: string): number {
    const lines = label.split('\n');
    if (lines.length === 1) {
      return label.length;
    }
    // For multi-line labels, use the longest line (trimmed)
    return Math.max(...lines.map((line) => line.trim().length));
  }

  const totalLength = labels.reduce((sum, { label }) => sum + getEffectiveLabelLength(label), 0);
  const avgLength = Math.round(totalLength / labels.length);
  const maxLength = Math.max(...labels.map(({ label }) => getEffectiveLabelLength(label)));

  return { labels, avgLength, maxLength };
}

/**
 * Estimates horizontal width based on layout and metrics
 *
 * For LR/RL layouts, uses the longest path through the graph (accounting for
 * branches and merges) for accurate width estimation.
 *
 * @param layout - Layout direction
 * @param metrics - Pre-calculated metrics
 * @param labelMetrics - Label metrics
 * @param graph - Graph representation (for longest path calculation)
 * @param config - Rule configuration
 * @returns Estimated width in pixels and path analysis
 */
function estimateWidth(
  layout: LayoutDirection,
  metrics: Metrics,
  labelMetrics: LabelMetrics,
  graph: GraphRepresentation,
  config: RuleConfig
): { width: number; chainLength?: number; chainPath?: string[] } {
  // Configuration with defaults
  const charWidth = (config.charWidth as number) ?? 8; // pixels per character
  const nodeSpacing = (config.nodeSpacing as number) ?? 50; // Mermaid default spacing

  if (layout === 'LR' || layout === 'RL') {
    // Horizontal layouts: width = longest path through graph
    // Use calculateLongestPath to account for decision branches and merge points
    const pathAnalysis = calculateLongestPath(graph);
    const width =
      pathAnalysis.length * labelMetrics.avgLength * charWidth + pathAnalysis.length * nodeSpacing;
    return {
      width,
      chainLength: pathAnalysis.length,
      chainPath: pathAnalysis.path,
    };
  } else {
    // Vertical layouts: width = max branch width
    const width =
      metrics.maxBranchWidth * labelMetrics.avgLength * charWidth +
      metrics.maxBranchWidth * nodeSpacing;
    return { width };
  }
}

/**
 * Calculates width analysis and severity
 */
function calculateWidthAnalysis(
  layout: LayoutDirection,
  metrics: Metrics,
  labelMetrics: LabelMetrics,
  graph: GraphRepresentation,
  config: RuleConfig
): WidthAnalysis {
  const widthResult = estimateWidth(layout, metrics, labelMetrics, graph, config);
  const estimatedWidth = widthResult.width;
  const targetWidth = (config.targetWidth as number) ?? 1200;

  // Thresholds from config with defaults
  const thresholds =
    (config.thresholds as { info?: number; warning?: number; error?: number }) ?? {};
  const infoThreshold = thresholds.info ?? 1500;
  const warningThreshold = thresholds.warning ?? 2000;
  const errorThreshold = thresholds.error ?? 2500;

  const exceedsBy = Math.max(0, estimatedWidth - targetWidth);

  let severity: 'info' | 'warning' | 'error' | null = null;
  if (estimatedWidth >= errorThreshold) {
    severity = 'error';
  } else if (estimatedWidth >= warningThreshold) {
    severity = 'warning';
  } else if (estimatedWidth >= infoThreshold) {
    severity = 'info';
  }

  const widthSource = layout === 'LR' || layout === 'RL' ? 'sequential' : 'branching';

  return {
    layout,
    labelMetrics,
    estimatedWidth,
    targetWidth,
    exceedsBy,
    severity,
    widthSource,
    longestChainLength: widthResult.chainLength,
    longestChainPath: widthResult.chainPath,
  };
}

/**
 * Generates layout-specific suggestions
 */
function generateSuggestions(analysis: WidthAnalysis, metrics: Metrics): string {
  const suggestions: string[] = [];
  const isHorizontal = analysis.layout === 'LR' || analysis.layout === 'RL';

  if (isHorizontal) {
    // LR/RL layouts should convert to TD
    suggestions.push(
      'Convert to TD (top-down) layout for better vertical scrolling:\n\n' +
        'graph TD\n  A --> B --> C\n  ...'
    );
    suggestions.push('Break into multiple sequential diagrams, each covering a specific phase');
  } else {
    // TD layouts should NOT convert to LR (would worsen width)
    suggestions.push('Group related branches into subgraphs to reduce width');
    suggestions.push('Split wide branches into separate diagrams');
    suggestions.push('Introduce intermediate grouping nodes');
  }

  // Common suggestions for both layouts
  suggestions.push('Use shorter, more concise labels');
  suggestions.push('Use abbreviations with a legend');

  const header = isHorizontal
    ? `This ${analysis.layout} layout with longest path of ${analysis.longestChainLength ?? metrics.nodeCount} nodes creates excessive width.\n` +
      `Estimated width: ${analysis.estimatedWidth}px (exceeds ${analysis.targetWidth}px safe limit by ${analysis.exceedsBy}px)\n\n`
    : `This ${analysis.layout} layout with ${metrics.maxBranchWidth} parallel branches creates excessive width.\n` +
      `Estimated width: ${analysis.estimatedWidth}px (exceeds ${analysis.targetWidth}px safe limit by ${analysis.exceedsBy}px)\n\n`;

  return header + 'Suggestions:\n' + suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
}

/**
 * Horizontal width readability rule
 *
 * Detects when diagrams will exceed reasonable viewport widths due to the
 * combination of layout direction, node count/branching, and label length.
 */
export const horizontalWidthReadabilityRule: Rule = {
  name: 'horizontal-width-readability',
  defaultSeverity: 'warning',

  check(diagram: Diagram, metrics: Metrics, config: RuleConfig): Issue | null {
    const severity = config.severity ?? this.defaultSeverity;
    const layout = detectLayout(diagram);
    const labelMetrics = extractLabels(diagram.content);

    // Skip if no labels found
    if (labelMetrics.labels.length === 0) {
      return null;
    }

    // Build graph for longest chain calculation (needed for LR/RL layouts)
    const graph = buildGraph(diagram);

    const analysis = calculateWidthAnalysis(layout, metrics, labelMetrics, graph, config);

    // No issue if within limits
    if (!analysis.severity) {
      return null;
    }

    // Generate message with path information for LR/RL layouts
    let message: string;
    if (layout === 'LR' || layout === 'RL') {
      const pathInfo =
        analysis.longestChainLength && analysis.longestChainPath
          ? ` (longest path: ${analysis.longestChainPath.slice(0, 5).join(' → ')}${analysis.longestChainPath.length > 5 ? '...' : ''})`
          : '';
      message = `Diagram width (${analysis.estimatedWidth}px) exceeds viewport limit due to sequential nodes${pathInfo} and label length in ${layout} layout`;
    } else {
      message = `Diagram width (${analysis.estimatedWidth}px) exceeds viewport limit due to parallel branches and label length in ${layout} layout`;
    }

    const suggestion = generateSuggestions(analysis, metrics);

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
