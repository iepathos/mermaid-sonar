/**
 * Clustering detection for subgraph suggestions
 *
 * Identifies tightly connected groups of nodes that could benefit
 * from being organized into subgraphs.
 */

import type { GraphRepresentation, ClusterSuggestion } from '../graph/types';
import { findComponents } from '../graph/algorithms';

/**
 * Calculates interconnectivity score for a set of nodes
 *
 * @param nodes - Node IDs to analyze
 * @param graph - Graph representation
 * @returns Interconnectivity ratio (0.0-1.0)
 */
function calculateInterconnectivity(nodes: Set<string>, graph: GraphRepresentation): number {
  let internalEdges = 0;
  let totalEdges = 0;

  for (const node of nodes) {
    const children = graph.adjacencyList.get(node) || [];

    for (const child of children) {
      totalEdges++;
      if (nodes.has(child)) {
        internalEdges++;
      }
    }
  }

  return totalEdges > 0 ? internalEdges / totalEdges : 0;
}

/**
 * Detects clusters using simple community detection
 *
 * Groups nodes that share many common neighbors and have
 * high interconnectivity within the group.
 *
 * @param graph - Graph representation
 * @returns Array of cluster suggestions
 */
export function detectClusters(graph: GraphRepresentation): ClusterSuggestion[] {
  const suggestions: ClusterSuggestion[] = [];

  // Only suggest clusters for larger diagrams
  if (graph.nodes.length < 15) {
    return suggestions;
  }

  const components = findComponents(graph);

  // For each component, look for dense subgraphs
  for (const component of components) {
    if (component.length < 5) continue;

    // Simple clustering: group nodes by common neighbors
    const clusters = new Map<string, Set<string>>();

    for (const node of component) {
      const neighbors = new Set<string>();
      const children = graph.adjacencyList.get(node) || [];
      const parents = graph.reverseAdjacencyList.get(node) || [];

      for (const child of children) neighbors.add(child);
      for (const parent of parents) neighbors.add(parent);

      const neighborKey = Array.from(neighbors).sort().join(',');

      if (!clusters.has(neighborKey)) {
        clusters.set(neighborKey, new Set());
      }
      clusters.get(neighborKey)!.add(node);
    }

    // Convert clusters to suggestions (only if ≥5 nodes)
    let clusterIndex = 1;
    for (const cluster of clusters.values()) {
      if (cluster.size >= 5) {
        const nodes = Array.from(cluster);
        const interconnectivity = calculateInterconnectivity(cluster, graph);

        // Only suggest if reasonably interconnected
        if (interconnectivity > 0.3) {
          const name = `Cluster${clusterIndex}`;
          const nodeList = nodes.slice(0, 3).join('\n    ');

          suggestions.push({
            nodes,
            name,
            example: `subgraph ${name}\n    ${nodeList}\n    ...\nend`,
          });

          clusterIndex++;
        }
      }
    }
  }

  return suggestions;
}
