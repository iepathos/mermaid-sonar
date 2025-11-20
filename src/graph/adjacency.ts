/**
 * Graph building utilities - constructs adjacency lists from diagrams
 */

import type { Diagram } from '../extractors/types';
import type { GraphRepresentation, Edge } from './types';

/**
 * Extracts edges from diagram content
 *
 * Parses various arrow syntaxes:
 * - A --> B (solid arrow)
 * - A -.-> B (dotted arrow)
 * - A ==> B (thick arrow)
 * - A -->|label| B (labeled edge)
 * - A <--> B (bidirectional)
 * - [*] --> A (state diagram start state)
 * - A --> [*] (state diagram end state)
 * - StateA --> StateB : label (state diagram labeled transition)
 *
 * @param content - Raw Mermaid diagram code
 * @returns Array of edges
 */
function extractEdges(content: string): Edge[] {
  const edges: Edge[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and non-edge lines
    if (trimmed.startsWith('%%') || !trimmed.includes('-->')) {
      continue;
    }

    // Skip state diagram direction lines
    if (trimmed.startsWith('direction ')) {
      continue;
    }

    // Skip composite state definitions
    if (trimmed.startsWith('state ') && trimmed.includes('{')) {
      continue;
    }

    // Match edge pattern: NODE1 -->|optional label| NODE2
    // Also handles state diagram patterns:
    // - [*] --> StateA (start state)
    // - StateA --> [*] (end state)
    // - StateA --> StateB : label (state diagram colon-labeled transition)
    const edgePattern =
      /(\[\*\]|\w+)\s*(-->|==>|-.->|<-->)\s*(?:\|([^|]+)\|)?\s*(\[\*\]|\w+)(?:\s*:\s*(.+))?/g;
    let match;

    while ((match = edgePattern.exec(trimmed)) !== null) {
      const [, from, arrow, pipeLabel, to, colonLabel] = match;

      // Skip if from or to is empty
      if (!from || !to) {
        continue;
      }

      // Convert [*] markers to special node IDs
      const fromNode = from === '[*]' ? '__START__' : from;
      const toNode = to === '[*]' ? '__END__' : to;

      const label = pipeLabel?.trim() || colonLabel?.trim();

      edges.push({
        from: fromNode,
        to: toNode,
        label,
      });

      // For bidirectional arrows, add reverse edge
      if (arrow === '<-->') {
        edges.push({
          from: toNode,
          to: fromNode,
          label,
        });
      }
    }
  }

  return edges;
}

/**
 * Extracts unique node IDs from edges
 *
 * @param edges - Array of edges
 * @returns Array of unique node IDs
 */
function extractNodesFromEdges(edges: Edge[]): string[] {
  const nodeSet = new Set<string>();

  for (const edge of edges) {
    nodeSet.add(edge.from);
    nodeSet.add(edge.to);
  }

  return Array.from(nodeSet);
}

/**
 * Builds adjacency list from edges
 *
 * @param edges - Array of edges
 * @returns Map of node ID → array of children
 */
function buildAdjacencyList(edges: Edge[]): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();

  for (const edge of edges) {
    if (!adjacency.has(edge.from)) {
      adjacency.set(edge.from, []);
    }
    adjacency.get(edge.from)!.push(edge.to);
  }

  return adjacency;
}

/**
 * Builds reverse adjacency list (parent lookup)
 *
 * @param edges - Array of edges
 * @returns Map of node ID → array of parents
 */
function buildReverseAdjacencyList(edges: Edge[]): Map<string, string[]> {
  const reverseAdjacency = new Map<string, string[]>();

  for (const edge of edges) {
    if (!reverseAdjacency.has(edge.to)) {
      reverseAdjacency.set(edge.to, []);
    }
    reverseAdjacency.get(edge.to)!.push(edge.from);
  }

  return reverseAdjacency;
}

/**
 * Builds complete graph representation from diagram
 *
 * @param diagram - Mermaid diagram to analyze
 * @returns Graph representation with adjacency lists
 */
export function buildGraph(diagram: Diagram): GraphRepresentation {
  const edges = extractEdges(diagram.content);
  const nodes = extractNodesFromEdges(edges);
  const adjacencyList = buildAdjacencyList(edges);
  const reverseAdjacencyList = buildReverseAdjacencyList(edges);

  return {
    nodes,
    edges,
    adjacencyList,
    reverseAdjacencyList,
  };
}
