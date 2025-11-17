/**
 * Graph algorithms for pattern detection
 */

import type { GraphRepresentation, SpineAnalysis, ChainAnalysis } from './types';

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

/**
 * Checks if a node is linear (≤1 parent and ≤1 child)
 */
function isLinearNode(node: string, graph: GraphRepresentation): boolean {
  const parents = graph.reverseAdjacencyList.get(node) || [];
  const children = graph.adjacencyList.get(node) || [];
  return parents.length <= 1 && children.length <= 1;
}

/**
 * Calculates the longest linear chain in a graph
 *
 * A linear chain is a sequence of nodes where each node has:
 * - At most 1 incoming edge
 * - At most 1 outgoing edge
 *
 * Algorithm:
 * 1. Find all potential chain start points (nodes with 0-1 parents)
 * 2. For each start point, traverse forward while linear property holds
 * 3. Track longest chain found
 * 4. Return chain metadata
 *
 * Time Complexity: O(V + E) where V = nodes, E = edges
 *
 * @param graph - Graph representation
 * @returns Analysis of longest linear chain
 */
export function calculateLongestLinearChain(graph: GraphRepresentation): ChainAnalysis {
  if (graph.nodes.length === 0) {
    return { length: 0, path: [], ratio: 0, isLinear: false };
  }

  let longestChain: string[] = [];

  // Try starting from each node
  for (const startNode of graph.nodes) {
    if (!isLinearNode(startNode, graph)) continue;

    const currentChain: string[] = [];
    const chainVisited = new Set<string>();
    let currentNode: string | undefined = startNode;

    // Traverse forward while linear
    while (currentNode !== undefined && !chainVisited.has(currentNode)) {
      if (!isLinearNode(currentNode, graph)) break;

      currentChain.push(currentNode);
      chainVisited.add(currentNode);

      // Move to next node in chain
      const children: string[] = graph.adjacencyList.get(currentNode) || [];
      if (children.length === 1) {
        const nextNode: string = children[0];
        const nextParents: string[] = graph.reverseAdjacencyList.get(nextNode) || [];

        // Only continue if next node also has exactly 1 parent
        if (nextParents.length === 1) {
          currentNode = nextNode;
        } else {
          break;
        }
      } else {
        // No children or multiple children - end of chain
        break;
      }
    }

    if (currentChain.length > longestChain.length) {
      longestChain = currentChain;
    }
  }

  const length = longestChain.length;
  const ratio = length / graph.nodes.length;
  const isLinear = ratio > 0.6;

  return {
    length,
    path: longestChain,
    ratio,
    isLinear,
  };
}
