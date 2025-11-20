/**
 * Type definitions for diagram extraction
 */

/**
 * Supported Mermaid diagram types
 */
export type DiagramType = 'flowchart' | 'graph' | 'state' | 'unknown';

/**
 * Represents a Mermaid diagram extracted from a markdown file
 */
export interface Diagram {
  /** Raw Mermaid code content */
  content: string;
  /** Line number where diagram starts in source file (1-indexed) */
  startLine: number;
  /** Path to the source file containing the diagram */
  filePath: string;
  /** Type of Mermaid diagram */
  type: DiagramType;
}
