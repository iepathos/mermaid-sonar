/**
 * Unit tests for state diagram support
 */

import { extractDiagrams, extractDiagramsFromFile } from '../../src/extractors/markdown';
import { buildGraph } from '../../src/graph/adjacency';
import { join } from 'path';

const FIXTURES_DIR = join(__dirname, '..', 'fixtures');

describe('State Diagram Support', () => {
  describe('Diagram Type Detection', () => {
    it('should detect stateDiagram v1 syntax', () => {
      const content = `
\`\`\`mermaid
stateDiagram
    [*] --> Still
\`\`\`
`;
      const diagrams = extractDiagrams(content, 'test.md');

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].type).toBe('state');
    });

    it('should detect stateDiagram-v2 syntax', () => {
      const content = `
\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle
\`\`\`
`;
      const diagrams = extractDiagrams(content, 'test.md');

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].type).toBe('state');
    });

    it('should detect stateDiagram with direction', () => {
      const content = `
\`\`\`mermaid
stateDiagram-v2
    direction LR
    [*] --> Active
\`\`\`
`;
      const diagrams = extractDiagrams(content, 'test.md');

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].type).toBe('state');
    });
  });

  describe('State Transition Parsing', () => {
    it('should parse basic state transitions', () => {
      const content = `
\`\`\`mermaid
stateDiagram-v2
    A --> B
    B --> C
\`\`\`
`;
      const diagrams = extractDiagrams(content, 'test.md');
      const graph = buildGraph(diagrams[0]);

      expect(graph.nodes).toContain('A');
      expect(graph.nodes).toContain('B');
      expect(graph.nodes).toContain('C');
      expect(graph.edges).toHaveLength(2);
    });

    it('should parse start state [*]', () => {
      const content = `
\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing
\`\`\`
`;
      const diagrams = extractDiagrams(content, 'test.md');
      const graph = buildGraph(diagrams[0]);

      expect(graph.nodes).toContain('__START__');
      expect(graph.nodes).toContain('Idle');
      expect(graph.edges).toHaveLength(2);
    });

    it('should parse end state [*]', () => {
      const content = `
\`\`\`mermaid
stateDiagram-v2
    Processing --> [*]
\`\`\`
`;
      const diagrams = extractDiagrams(content, 'test.md');
      const graph = buildGraph(diagrams[0]);

      expect(graph.nodes).toContain('Processing');
      expect(graph.nodes).toContain('__END__');
    });

    it('should parse labeled transitions with colon syntax', () => {
      const content = `
\`\`\`mermaid
stateDiagram-v2
    Idle --> Processing : start
    Processing --> Complete : finish
\`\`\`
`;
      const diagrams = extractDiagrams(content, 'test.md');
      const graph = buildGraph(diagrams[0]);

      expect(graph.edges).toHaveLength(2);
      expect(graph.edges[0].label).toBe('start');
      expect(graph.edges[1].label).toBe('finish');
    });

    it('should skip direction lines', () => {
      const content = `
\`\`\`mermaid
stateDiagram-v2
    direction LR
    A --> B
\`\`\`
`;
      const diagrams = extractDiagrams(content, 'test.md');
      const graph = buildGraph(diagrams[0]);

      expect(graph.nodes).toContain('A');
      expect(graph.nodes).toContain('B');
      expect(graph.nodes).not.toContain('direction');
      expect(graph.edges).toHaveLength(1);
    });
  });

  describe('State Diagram Fixtures', () => {
    it('should extract from state-diagram-simple.md fixture', () => {
      const filePath = join(FIXTURES_DIR, 'state-diagram-simple.md');
      const diagrams = extractDiagramsFromFile(filePath);

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].type).toBe('state');
    });

    it('should extract from state-diagram-v1.md fixture', () => {
      const filePath = join(FIXTURES_DIR, 'state-diagram-v1.md');
      const diagrams = extractDiagramsFromFile(filePath);

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].type).toBe('state');
    });

    it('should extract from state-diagram-labeled.md fixture', () => {
      const filePath = join(FIXTURES_DIR, 'state-diagram-labeled.md');
      const diagrams = extractDiagramsFromFile(filePath);

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].type).toBe('state');

      const graph = buildGraph(diagrams[0]);
      // Verify labeled transitions were parsed
      const hasLabels = graph.edges.some((edge) => edge.label !== undefined);
      expect(hasLabels).toBe(true);
    });

    it('should parse state-diagram-wide-lr.md fixture', () => {
      const filePath = join(FIXTURES_DIR, 'state-diagram-wide-lr.md');
      const diagrams = extractDiagramsFromFile(filePath);

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].type).toBe('state');

      const graph = buildGraph(diagrams[0]);
      // Should have a long chain (wide LR layout)
      expect(graph.nodes.length).toBeGreaterThan(7);
    });

    it('should parse state-diagram-deep-td.md fixture', () => {
      const filePath = join(FIXTURES_DIR, 'state-diagram-deep-td.md');
      const diagrams = extractDiagramsFromFile(filePath);

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].type).toBe('state');

      const graph = buildGraph(diagrams[0]);
      // Should have many levels (deep TD layout)
      expect(graph.nodes.length).toBeGreaterThan(10);
    });
  });
});
