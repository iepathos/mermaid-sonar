/**
 * Pattern detection algorithms for diagram structure analysis
 *
 * Detects structural patterns like sequential flows, hierarchies,
 * wide branching, and reconvergence to inform layout recommendations.
 */

import type { GraphRepresentation, Pattern } from '../graph/types';
import {
  findRootNodes,
  calculateMaxDepth,
  calculateAverageChildren,
  calculateSpine,
} from '../graph/algorithms';

/**
 * Detects sequential/linear pattern
 *
 * Sequential pattern: diagram has long spine with minimal branching
 * indicating a linear process flow (e.g., CI/CD pipeline, timeline)
 *
 * @param graph - Graph representation
 * @returns Pattern if detected, null otherwise
 */
export function detectSequential(graph: GraphRepresentation): Pattern | null {
  if (graph.nodes.length === 0) return null;

  const spine = calculateSpine(graph);

  // Sequential if spine covers >60% of nodes
  if (spine.ratio > 0.6) {
    return {
      type: 'sequential',
      confidence: Math.min(spine.ratio, 1.0),
      evidence: [
        `Spine length: ${spine.length}/${graph.nodes.length} nodes (${(spine.ratio * 100).toFixed(0)}%)`,
        `Low branching factor along main path`,
        `Path: ${spine.path.slice(0, 5).join(' → ')}${spine.path.length > 5 ? '...' : ''}`,
      ],
      recommendation: 'Use LR (left-right) layout for this sequential flow',
      example: 'graph LR\n  Start --> Build --> Test --> Deploy --> End',
    };
  }

  return null;
}

/**
 * Detects hierarchical/tree pattern
 *
 * Hierarchical pattern: single root with tree-like structure
 * indicating organizational hierarchy or decision tree
 *
 * @param graph - Graph representation
 * @returns Pattern if detected, null otherwise
 */
export function detectHierarchical(graph: GraphRepresentation): Pattern | null {
  if (graph.nodes.length === 0) return null;

  const roots = findRootNodes(graph);

  // Hierarchical if single root with decent depth and branching
  if (roots.length === 1) {
    const maxDepth = calculateMaxDepth(graph, roots[0]);
    const avgChildren = calculateAverageChildren(graph);

    // Hierarchical: single root, depth > 2, and avg children > 0.8 (indicates branching tree)
    if (avgChildren > 0.8 && maxDepth > 2) {
      const confidence = Math.min(avgChildren / 3, 1.0);

      return {
        type: 'hierarchical',
        confidence,
        evidence: [
          `Single root node: ${roots[0]}`,
          `Max depth: ${maxDepth} levels`,
          `Average ${avgChildren.toFixed(1)} children per node`,
        ],
        recommendation: 'Use TD (top-down) layout for this hierarchy',
        example: 'graph TD\n  Root --> Child1\n  Root --> Child2\n  Child1 --> GrandChild1',
      };
    }
  }

  return null;
}

/**
 * Detects wide branching pattern
 *
 * Wide branching: single node with many (>5) children
 * May benefit from grouping or subgraphs
 *
 * @param graph - Graph representation
 * @returns Pattern if detected, null otherwise
 */
export function detectWideBranching(graph: GraphRepresentation): Pattern | null {
  if (graph.nodes.length === 0) return null;

  let maxBranchNode: string | null = null;
  let maxBranchWidth = 0;

  for (const node of graph.nodes) {
    const children = graph.adjacencyList.get(node) || [];
    if (children.length > maxBranchWidth) {
      maxBranchWidth = children.length;
      maxBranchNode = node;
    }
  }

  if (maxBranchWidth > 5 && maxBranchNode) {
    const confidence = Math.min(maxBranchWidth / 10, 1.0);

    return {
      type: 'wide-branching',
      confidence,
      evidence: [
        `Node ${maxBranchNode} has ${maxBranchWidth} children`,
        `Consider grouping related branches`,
      ],
      recommendation: 'Group related branches into subgraphs for better organization',
      example: `subgraph Group1\n  ${maxBranchNode} --> Branch1\n  ${maxBranchNode} --> Branch2\nend`,
    };
  }

  return null;
}

/**
 * Detects reconvergence pattern (fan-out then fan-in)
 *
 * Reconvergence: multiple paths that later merge back together
 * Common in parallel processing or decision points
 *
 * @param graph - Graph representation
 * @returns Pattern if detected, null otherwise
 */
export function detectReconvergence(graph: GraphRepresentation): Pattern | null {
  if (graph.nodes.length === 0) return null;

  // Find nodes with multiple parents (merge points)
  let mergePoints = 0;
  const mergeNodes: string[] = [];

  for (const node of graph.nodes) {
    const parents = graph.reverseAdjacencyList.get(node) || [];
    if (parents.length > 1) {
      mergePoints++;
      mergeNodes.push(node);
    }
  }

  const ratio = graph.nodes.length > 0 ? mergePoints / graph.nodes.length : 0;

  if (ratio > 0.2) {
    return {
      type: 'reconvergence',
      confidence: Math.min(ratio * 2, 1.0),
      evidence: [
        `${mergePoints} nodes with multiple incoming paths`,
        `${(ratio * 100).toFixed(0)}% of nodes are merge points`,
        `Examples: ${mergeNodes.slice(0, 3).join(', ')}`,
      ],
      recommendation: 'Parallel paths detected - ensure layout shows reconvergence clearly',
    };
  }

  return null;
}

/**
 * Detects all patterns in a graph
 *
 * @param graph - Graph representation
 * @returns Array of detected patterns, sorted by confidence
 */
export function detectPatterns(graph: GraphRepresentation): Pattern[] {
  const patterns: Pattern[] = [];

  const sequential = detectSequential(graph);
  if (sequential) patterns.push(sequential);

  const hierarchical = detectHierarchical(graph);
  if (hierarchical) patterns.push(hierarchical);

  const wideBranching = detectWideBranching(graph);
  if (wideBranching) patterns.push(wideBranching);

  const reconvergence = detectReconvergence(graph);
  if (reconvergence) patterns.push(reconvergence);

  // Sort by confidence descending
  return patterns.sort((a, b) => b.confidence - a.confidence);
}
