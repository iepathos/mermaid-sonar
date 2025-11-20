/**
 * Markdown diagram extraction utilities
 *
 * Extracts Mermaid diagrams from markdown files with accurate line number tracking
 */

import { readFileSync } from 'fs';
import type { Diagram, DiagramType } from './types';

/**
 * Detects the type of Mermaid diagram from its content
 *
 * @param content - Raw Mermaid diagram code
 * @returns The detected diagram type
 */
function detectDiagramType(content: string): DiagramType {
  const firstLine = content.trim().split('\n')[0] || '';

  if (/^\s*classDiagram/i.test(firstLine)) {
    return 'class';
  }

  if (/^\s*stateDiagram(-v2)?/i.test(firstLine)) {
    return 'state';
  }

  if (/^\s*(graph|flowchart)\s+(TD|LR|TB|RL)/i.test(firstLine)) {
    return firstLine.toLowerCase().includes('flowchart') ? 'flowchart' : 'graph';
  }

  return 'unknown';
}

/**
 * Extracts all Mermaid diagrams from markdown content
 *
 * @param content - Markdown file content
 * @param filePath - Path to the source file (for reference)
 * @returns Array of extracted diagrams with metadata
 */
export function extractDiagrams(content: string, filePath: string): Diagram[] {
  const diagrams: Diagram[] = [];
  const lines = content.split('\n');

  let inMermaid = false;
  let startLine = 0;
  let diagramLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for mermaid code block start (both ``` and ~~~ fences)
    if (trimmed === '```mermaid' || trimmed === '~~~mermaid') {
      inMermaid = true;
      startLine = i + 2; // Line number is 1-indexed, and starts after fence
      diagramLines = [];
    } else if (inMermaid && (trimmed === '```' || trimmed === '~~~')) {
      // End of mermaid block
      const diagramContent = diagramLines.join('\n');
      diagrams.push({
        content: diagramContent,
        startLine,
        filePath,
        type: detectDiagramType(diagramContent),
      });
      inMermaid = false;
    } else if (inMermaid) {
      diagramLines.push(line);
    }
  }

  return diagrams;
}

/**
 * Extracts diagrams from a markdown file by reading from filesystem
 *
 * @param filePath - Path to markdown file
 * @returns Array of extracted diagrams
 */
export function extractDiagramsFromFile(filePath: string): Diagram[] {
  const content = readFileSync(filePath, 'utf-8');
  return extractDiagrams(content, filePath);
}
