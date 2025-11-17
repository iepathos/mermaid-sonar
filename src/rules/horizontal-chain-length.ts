/**
 * Horizontal Chain Length Rule
 *
 * Detects excessively long linear chains in horizontal (LR/RL) layouts
 * that create wide diagrams requiring excessive horizontal scrolling.
 */

import type { Rule, Issue, RuleConfig } from './types';
import type { Diagram } from '../extractors/types';
import type { Metrics } from '../analyzers/types';
import type { LayoutDirection } from '../graph/types';
import { buildGraph } from '../graph/adjacency';
import { calculateLongestLinearChain } from '../graph/algorithms';

/**
 * Extracts layout direction from diagram content
 */
function detectLayout(diagram: Diagram): LayoutDirection {
  const content = diagram.content.toLowerCase();

  if (content.includes('graph lr') || content.includes('flowchart lr')) {
    return 'LR';
  }
  if (content.includes('graph rl') || content.includes('flowchart rl')) {
    return 'RL';
  }
  if (content.includes('graph tb') || content.includes('flowchart tb')) {
    return 'TB';
  }

  // Default to TD
  return 'TD';
}

/**
 * Generates suggestion text for long chains
 */
function generateSuggestion(
  chainLength: number,
  chainPath: string[],
  layout: LayoutDirection
): string {
  const isHorizontal = layout === 'LR' || layout === 'RL';
  const suggestions: string[] = [];

  // Show first 3 and last node of chain
  const pathPreview =
    chainPath.length > 4
      ? `${chainPath.slice(0, 3).join(' → ')} ... → ${chainPath[chainPath.length - 1]}`
      : chainPath.join(' → ');

  let header = `Linear chain of ${chainLength} nodes detected:\n${pathPreview}\n\n`;

  if (isHorizontal) {
    // LR/RL diagrams should convert to TD
    header += 'This creates excessive width in horizontal layout.\n\n';
    suggestions.push(
      'Convert to TD (top-down) layout for better vertical scrolling:\n\ngraph TD\n  ' +
        chainPath.slice(0, 3).join(' --> ') +
        (chainPath.length > 3 ? '\n  ...' : '')
    );
  } else {
    // TD diagrams with long chains
    header += 'This creates an excessively tall diagram.\n\n';
  }

  // Always suggest subgraph organization
  suggestions.push(
    'Organize into logical subgraphs to break up the chain:\n\nsubgraph Phase1\n  direction TB\n  ' +
      chainPath.slice(0, Math.ceil(chainPath.length / 2)).join(' --> ') +
      '\nend\n\nsubgraph Phase2\n  direction TB\n  ' +
      chainPath.slice(Math.ceil(chainPath.length / 2)).join(' --> ') +
      '\nend'
  );

  // Suggest simplification
  suggestions.push('Simplify by removing intermediate steps and focusing on key transitions');

  return header + 'Suggestions:\n' + suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
}

/**
 * Horizontal chain length rule
 *
 * Warns when linear chains exceed layout-specific thresholds:
 * - LR/RL: 8 nodes (horizontal layouts)
 * - TD/TB: 12 nodes (vertical layouts, more tolerant)
 */
export const horizontalChainLengthRule: Rule = {
  name: 'horizontal-chain-too-long',
  defaultSeverity: 'warning',

  check(diagram: Diagram, _metrics: Metrics, config: RuleConfig): Issue | null {
    const severity = config.severity ?? this.defaultSeverity;
    const layout = detectLayout(diagram);

    // Get thresholds from config or use defaults
    const thresholds = (config.thresholds as { LR?: number; TD?: number }) ?? {};
    const lrThreshold = thresholds.LR ?? 8;
    const tdThreshold = thresholds.TD ?? 12;

    // Determine applicable threshold
    const isHorizontal = layout === 'LR' || layout === 'RL';
    const threshold = isHorizontal ? lrThreshold : tdThreshold;

    // Build graph and analyze chain length
    const graph = buildGraph(diagram);
    const chainAnalysis = calculateLongestLinearChain(graph);

    // Check if chain exceeds threshold
    if (chainAnalysis.length <= threshold) {
      return null;
    }

    const layoutType = isHorizontal ? 'horizontal' : 'vertical';
    const message = `Linear chain of ${chainAnalysis.length} nodes in ${layout} layout exceeds ${threshold}-node threshold for ${layoutType} layouts`;

    const suggestion = generateSuggestion(chainAnalysis.length, chainAnalysis.path, layout);

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
