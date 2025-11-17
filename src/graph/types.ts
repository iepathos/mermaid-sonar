/**
 * Graph data structures and types for pattern analysis
 */

/**
 * Represents a directed edge in the graph
 */
export interface Edge {
  /** Source node ID */
  from: string;
  /** Target node ID */
  to: string;
  /** Optional edge label */
  label?: string;
}

/**
 * Graph representation with adjacency lists
 */
export interface GraphRepresentation {
  /** All unique node IDs in the graph */
  nodes: string[];
  /** All edges in the graph */
  edges: Edge[];
  /** Adjacency list: node ID → array of child node IDs */
  adjacencyList: Map<string, string[]>;
  /** Reverse adjacency list: node ID → array of parent node IDs */
  reverseAdjacencyList: Map<string, string[]>;
}

/**
 * Types of structural patterns that can be detected
 */
export type PatternType =
  | 'sequential'
  | 'hierarchical'
  | 'wide-branching'
  | 'reconvergence'
  | 'disconnected'
  | 'clustered';

/**
 * Detected structural pattern with confidence and recommendations
 */
export interface Pattern {
  /** Type of pattern detected */
  type: PatternType;
  /** Confidence score 0.0-1.0 */
  confidence: number;
  /** Evidence explaining why this pattern was detected */
  evidence: string[];
  /** Actionable recommendation */
  recommendation: string;
  /** Example code snippet (if applicable) */
  example?: string;
}

/**
 * Layout direction options
 */
export type LayoutDirection = 'LR' | 'TD' | 'TB' | 'RL';

/**
 * Layout recommendation with supporting patterns
 */
export interface LayoutRecommendation {
  /** Currently detected layout (if parseable) */
  current?: LayoutDirection;
  /** Recommended layout direction */
  recommended: LayoutDirection;
  /** Explanation for recommendation */
  reason: string;
  /** Confidence score 0.0-1.0 */
  confidence: number;
  /** Supporting patterns */
  patterns: Pattern[];
}

/**
 * Analysis of the longest low-branching path through graph
 */
export interface SpineAnalysis {
  /** Length of spine (number of nodes) */
  length: number;
  /** Node IDs in spine path */
  path: string[];
  /** Ratio: spine length / total nodes */
  ratio: number;
}

/**
 * Suggestion for grouping nodes into a subgraph
 */
export interface ClusterSuggestion {
  /** Node IDs in this cluster */
  nodes: string[];
  /** Suggested subgraph name */
  name: string;
  /** Example subgraph code */
  example: string;
}

/**
 * Analysis of the longest linear chain in a graph
 *
 * A linear chain is a sequence of nodes where each node has:
 * - At most 1 incoming edge
 * - At most 1 outgoing edge
 */
export interface ChainAnalysis {
  /** Length of longest linear chain (number of nodes) */
  length: number;
  /** Node IDs in the chain path */
  path: string[];
  /** Ratio: chain length / total nodes (0-1) */
  ratio: number;
  /** True if >60% of graph is a linear chain */
  isLinear: boolean;
}
