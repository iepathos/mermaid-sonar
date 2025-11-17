/**
 * Graph structure analysis for Mermaid diagrams
 *
 * Analyzes diagram structure using regex-based parsing to extract
 * nodes, edges, and calculate core complexity metrics.
 */

import type { Diagram } from '../extractors/types';
import type { Metrics } from './types';

/**
 * Extracts unique node IDs from diagram content
 *
 * Identifies nodes by patterns like:
 * - A[label], B{label}, C((label))
 * - Simple node references in edges: A --> B
 *
 * @param content - Raw Mermaid diagram code
 * @returns Set of unique node IDs
 */
function extractNodes(content: string): Set<string> {
  const nodes = new Set<string>();

  // Pattern 1: Node definitions with shapes (A[label], B{label}, C((label)), etc.)
  const nodeDefPattern = /\b([A-Z][A-Z0-9]*)\s*[[{()]/g;
  let match;

  while ((match = nodeDefPattern.exec(content)) !== null) {
    nodes.add(match[1]);
  }

  // Pattern 2: Nodes in edge definitions (A --> B, A -.-> B, etc.)
  const edgePattern = /\b([A-Z][A-Z0-9]*)\s*(?:-->|==>|-.->|===>|<-->|<-.->|o--|x--)/g;

  while ((match = edgePattern.exec(content)) !== null) {
    nodes.add(match[1]);
  }

  // Pattern 3: Nodes on the right side of edges
  const targetPattern =
    /(?:-->|==>|-.->|===>|<-->|<-.->|o--|x--)\s*(?:\|[^|]+\|)?\s*\b([A-Z][A-Z0-9]*)\b/g;

  while ((match = targetPattern.exec(content)) !== null) {
    nodes.add(match[1]);
  }

  return nodes;
}

/**
 * Counts edges/connections in the diagram
 *
 * Detects various arrow types:
 * - Solid: -->, <-->, <--
 * - Dotted: -.->
 * - Thick: ==>
 * - With labels: A -->|label| B
 *
 * @param content - Raw Mermaid diagram code
 * @returns Number of edges
 */
function countEdges(content: string): number {
  // Match all arrow patterns (including labeled edges)
  const arrowPattern = /(-->|==>|-.->|===>|<-->|<-.->|o--|x--|<--|-\.-|===)/g;
  const matches = content.match(arrowPattern);

  return matches ? matches.length : 0;
}

/**
 * Calculates graph density: edges / (nodes × (nodes - 1))
 *
 * Density indicates how connected the graph is:
 * - 0.0: No edges (disconnected)
 * - 1.0: Complete graph (all nodes connected)
 *
 * @param nodeCount - Number of nodes
 * @param edgeCount - Number of edges
 * @returns Graph density between 0 and 1
 */
function calculateDensity(nodeCount: number, edgeCount: number): number {
  if (nodeCount <= 1) {
    return 0;
  }

  const maxPossibleEdges = nodeCount * (nodeCount - 1);
  return maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;
}

/**
 * Calculates maximum branch width (max children from any node)
 *
 * @param content - Raw Mermaid diagram code
 * @returns Maximum number of children from a single node
 */
function calculateMaxBranchWidth(content: string): number {
  const adjacency = new Map<string, Set<string>>();
  const lines = content.split('\n').map((l) => l.trim());

  for (const line of lines) {
    // Match arrows: A --> B or A -->|label| B
    const arrowMatch = line.match(/(\w+)\s*--+>(?:\|[^|]+\|)?\s*(\w+)/);

    if (arrowMatch) {
      const source = arrowMatch[1];
      const target = arrowMatch[2];

      if (!adjacency.has(source)) {
        adjacency.set(source, new Set());
      }
      adjacency.get(source)!.add(target);
    }
  }

  let maxWidth = 0;
  for (const children of adjacency.values()) {
    maxWidth = Math.max(maxWidth, children.size);
  }

  return maxWidth;
}

/**
 * Calculates average degree (average connections per node)
 *
 * @param nodeCount - Number of nodes
 * @param edgeCount - Number of edges
 * @returns Average degree
 */
function calculateAverageDegree(nodeCount: number, edgeCount: number): number {
  if (nodeCount === 0) {
    return 0;
  }

  // In a directed graph, each edge contributes 1 to out-degree and 1 to in-degree
  return (2 * edgeCount) / nodeCount;
}

/**
 * Analyzes the structure of a Mermaid diagram and calculates metrics
 *
 * @param diagram - Diagram to analyze
 * @returns Calculated metrics
 */
export function analyzeStructure(diagram: Diagram): Metrics {
  const nodes = extractNodes(diagram.content);
  const nodeCount = nodes.size;
  const edgeCount = countEdges(diagram.content);

  return {
    nodeCount,
    edgeCount,
    graphDensity: calculateDensity(nodeCount, edgeCount),
    maxBranchWidth: calculateMaxBranchWidth(diagram.content),
    averageDegree: calculateAverageDegree(nodeCount, edgeCount),
  };
}
