/**
 * Type definitions for diagram analysis and metrics
 */

/**
 * Core graph structure metrics for Mermaid diagrams
 */
export interface Metrics {
  /** Number of unique nodes in the diagram */
  nodeCount: number;
  /** Number of edges/connections between nodes */
  edgeCount: number;
  /** Graph density: edges / (nodes × (nodes-1)) */
  graphDensity: number;
  /** Maximum number of children from any single node */
  maxBranchWidth: number;
  /** Average number of connections per node */
  averageDegree: number;
}

/**
 * Complete analysis result combining diagram and its metrics
 */
export interface AnalysisResult {
  /** The analyzed diagram */
  diagram: import('../extractors/types').Diagram;
  /** Calculated metrics for the diagram */
  metrics: Metrics;
}
