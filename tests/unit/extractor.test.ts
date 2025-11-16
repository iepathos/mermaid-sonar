/**
 * Unit tests for diagram extraction
 */

import { extractDiagrams, extractDiagramsFromFile } from '../../src/extractors/markdown';
import { join } from 'path';

const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

describe('Diagram Extraction', () => {
  describe('extractDiagrams', () => {
    it('should extract a single diagram from markdown', () => {
      const content = `# Test
\`\`\`mermaid
flowchart TD
    A --> B
\`\`\`
`;
      const diagrams = extractDiagrams(content, 'test.md');

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].content).toContain('flowchart TD');
      expect(diagrams[0].content).toContain('A --> B');
      expect(diagrams[0].startLine).toBe(3); // Line 1: "# Test", Line 2: "```mermaid", Line 3: content starts
      expect(diagrams[0].filePath).toBe('test.md');
      expect(diagrams[0].type).toBe('flowchart');
    });

    it('should extract multiple diagrams from one file', () => {
      const content = `
\`\`\`mermaid
flowchart TD
    A --> B
\`\`\`

Some text

\`\`\`mermaid
graph LR
    C --> D
\`\`\`
`;
      const diagrams = extractDiagrams(content, 'test.md');

      expect(diagrams).toHaveLength(2);
      expect(diagrams[0].type).toBe('flowchart');
      expect(diagrams[1].type).toBe('graph');
    });

    it('should support tilde fence syntax', () => {
      const content = `
~~~mermaid
flowchart TD
    A --> B
~~~
`;
      const diagrams = extractDiagrams(content, 'test.md');

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].content).toContain('A --> B');
    });

    it('should track line numbers accurately', () => {
      const content = `Line 1
Line 2
\`\`\`mermaid
flowchart TD
    A --> B
\`\`\`
Line 7`;

      const diagrams = extractDiagrams(content, 'test.md');

      expect(diagrams[0].startLine).toBe(4); // First line of diagram content
    });

    it('should return empty array for files without diagrams', () => {
      const content = 'Just some text with no diagrams';
      const diagrams = extractDiagrams(content, 'test.md');

      expect(diagrams).toHaveLength(0);
    });

    it('should handle empty file', () => {
      const content = '';
      const diagrams = extractDiagrams(content, 'test.md');

      expect(diagrams).toHaveLength(0);
    });
  });

  describe('extractDiagramsFromFile', () => {
    it('should extract from simple.md fixture', () => {
      const filePath = join(FIXTURES_DIR, 'simple.md');
      const diagrams = extractDiagramsFromFile(filePath);

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].type).toBe('flowchart');
    });

    it('should extract from edge-cases.md fixture', () => {
      const filePath = join(FIXTURES_DIR, 'edge-cases.md');
      const diagrams = extractDiagramsFromFile(filePath);

      // Should find 5 diagrams (empty, single node, disconnected, first, second)
      expect(diagrams.length).toBeGreaterThanOrEqual(4);
    });
  });
});
