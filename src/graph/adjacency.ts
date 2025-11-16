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

    // Match edge pattern: NODE1 -->|optional label| NODE2
    const edgePattern = /(\w+)\s*(-->|==>|-.->|<-->)\s*(?:\|([^|]+)\|)?\s*(\w+)/g;
    let match;

    while ((match = edgePattern.exec(trimmed)) !== null) {
      const [, from, arrow, label, to] = match;

      edges.push({
        from,
        to,
        label: label?.trim(),
      });

      // For bidirectional arrows, add reverse edge
      if (arrow === '<-->') {
        edges.push({
          from: to,
          to: from,
          label: label?.trim(),
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
