/**
 * Graph algorithms for pattern detection
 */

import type { GraphRepresentation, SpineAnalysis } from './types';

/**
 * Finds root nodes (nodes with no incoming edges)
 *
 * @param graph - Graph representation
 * @returns Array of root node IDs
 */
export function findRootNodes(graph: GraphRepresentation): string[] {
  const roots: string[] = [];

  for (const node of graph.nodes) {
    const parents = graph.reverseAdjacencyList.get(node) || [];
    if (parents.length === 0) {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * Finds leaf nodes (nodes with no outgoing edges)
 *
 * @param graph - Graph representation
 * @returns Array of leaf node IDs
 */
export function findLeafNodes(graph: GraphRepresentation): string[] {
  const leaves: string[] = [];

  for (const node of graph.nodes) {
    const children = graph.adjacencyList.get(node) || [];
    if (children.length === 0) {
      leaves.push(node);
    }
  }

  return leaves;
}

/**
 * Calculates maximum depth from a given root node
 *
 * @param graph - Graph representation
 * @param root - Starting node ID
 * @returns Maximum depth from root
 */
export function calculateMaxDepth(graph: GraphRepresentation, root: string): number {
  const visited = new Set<string>();
  let maxDepth = 0;

  function dfs(node: string, depth: number): void {
    if (visited.has(node)) return;
    visited.add(node);

    maxDepth = Math.max(maxDepth, depth);

    const children = graph.adjacencyList.get(node) || [];
    for (const child of children) {
      dfs(child, depth + 1);
    }
  }

  dfs(root, 0);
  return maxDepth;
}

/**
 * Calculates average number of children per node
 *
 * @param graph - Graph representation
 * @returns Average children per node
 */
export function calculateAverageChildren(graph: GraphRepresentation): number {
  if (graph.nodes.length === 0) return 0;

  let totalChildren = 0;
  for (const node of graph.nodes) {
    const children = graph.adjacencyList.get(node) || [];
    totalChildren += children.length;
  }

  return totalChildren / graph.nodes.length;
}

/**
 * Finds disconnected components using DFS
 *
 * @param graph - Graph representation
 * @returns Array of components, each containing node IDs
 */
export function findComponents(graph: GraphRepresentation): string[][] {
  const visited = new Set<string>();
  const components: string[][] = [];

  function dfs(node: string, component: string[]): void {
    if (visited.has(node)) return;
    visited.add(node);
    component.push(node);

    // Visit children
    const children = graph.adjacencyList.get(node) || [];
    for (const child of children) {
      dfs(child, component);
    }

    // Visit parents (treat as undirected for component detection)
    const parents = graph.reverseAdjacencyList.get(node) || [];
    for (const parent of parents) {
      dfs(parent, component);
    }
  }

  for (const node of graph.nodes) {
    if (!visited.has(node)) {
      const component: string[] = [];
      dfs(node, component);
      components.push(component);
    }
  }

  return components;
}

/**
 * Calculates spine (longest low-branching path)
 *
 * Finds the longest path where each node has at most 2 children (low branching).
 * This represents the main "flow" of the diagram.
 *
 * @param graph - Graph representation
 * @returns Spine analysis
 */
export function calculateSpine(graph: GraphRepresentation): SpineAnalysis {
  const roots = findRootNodes(graph);
  let longestPath: string[] = [];

  function dfs(node: string, path: string[], visited: Set<string>): void {
    if (visited.has(node)) return;

    const newPath = [...path, node];
    const newVisited = new Set(visited);
    newVisited.add(node);

    const children = graph.adjacencyList.get(node) || [];

    // Only continue if low branching (≤2 children)
    if (children.length <= 2) {
      if (newPath.length > longestPath.length) {
        longestPath = newPath;
      }

      for (const child of children) {
        dfs(child, newPath, newVisited);
      }
    } else {
      // High branching point - still record current path
      if (newPath.length > longestPath.length) {
        longestPath = newPath;
      }
    }
  }

  // Try from each root
  for (const root of roots) {
    dfs(root, [], new Set());
  }

  // If no roots (circular graph), try from first node
  if (roots.length === 0 && graph.nodes.length > 0) {
    dfs(graph.nodes[0], [], new Set());
  }

  const length = longestPath.length;
  const ratio = graph.nodes.length > 0 ? length / graph.nodes.length : 0;

  return {
    length,
    path: longestPath,
    ratio,
  };
}

/**
 * Detects cycles in the graph using DFS
 *
 * @param graph - Graph representation
 * @returns True if graph contains cycles
 */
export function hasCycles(graph: GraphRepresentation): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);

    const children = graph.adjacencyList.get(node) || [];
    for (const child of children) {
      if (!visited.has(child)) {
        if (dfs(child)) return true;
      } else if (recursionStack.has(child)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  for (const node of graph.nodes) {
    if (!visited.has(node)) {
      if (dfs(node)) return true;
    }
  }

  return false;
}
