/**
 * Unit tests for structure analysis and metrics
 */

import { analyzeStructure } from '../../src/analyzers/structure';
import type { Diagram } from '../../src/extractors/types';

/**
 * Helper to create test diagram
 */
function createDiagram(content: string): Diagram {
  return {
    content,
    startLine: 1,
    filePath: 'test.md',
    type: 'flowchart',
  };
}

describe('Structure Analysis', () => {
  describe('Node Counting', () => {
    it('should count simple nodes', () => {
      const diagram = createDiagram(`flowchart TD
    A --> B
    B --> C`);

      const metrics = analyzeStructure(diagram);
      expect(metrics.nodeCount).toBe(3);
    });

    it('should count labeled nodes', () => {
      const diagram = createDiagram(`flowchart TD
    A[Start] --> B{Decision}
    B --> C((End))`);

      const metrics = analyzeStructure(diagram);
      expect(metrics.nodeCount).toBe(3);
    });

    it('should deduplicate node references', () => {
      const diagram = createDiagram(`flowchart TD
    A --> B
    A --> C
    B --> D
    C --> D`);

      const metrics = analyzeStructure(diagram);
      expect(metrics.nodeCount).toBe(4); // A, B, C, D (not 6)
    });

    it('should handle single node', () => {
      const diagram = createDiagram(`flowchart TD
    A[Alone]`);

      const metrics = analyzeStructure(diagram);
      expect(metrics.nodeCount).toBe(1);
    });
  });

  describe('Edge Counting', () => {
    it('should count solid arrows', () => {
      const diagram = createDiagram(`flowchart TD
    A --> B
    B --> C
    C --> D`);

      const metrics = analyzeStructure(diagram);
      expect(metrics.edgeCount).toBe(3);
    });

    it('should count different arrow types', () => {
      const diagram = createDiagram(`flowchart TD
    A --> B
    B -.-> C
    C ==> D`);

      const metrics = analyzeStructure(diagram);
      expect(metrics.edgeCount).toBe(3);
    });

    it('should count labeled edges', () => {
      const diagram = createDiagram(`flowchart TD
    A -->|Yes| B
    A -->|No| C`);

      const metrics = analyzeStructure(diagram);
      expect(metrics.edgeCount).toBe(2);
    });
  });

  describe('Graph Density', () => {
    it('should calculate density for linear chain', () => {
      const diagram = createDiagram(`flowchart TD
    A --> B
    B --> C
    C --> D
    D --> E`);

      const metrics = analyzeStructure(diagram);
      // 5 nodes, 4 edges: 4 / (5 × 4) = 0.2
      expect(metrics.graphDensity).toBeCloseTo(0.2, 2);
    });

    it('should return 0 for single node', () => {
      const diagram = createDiagram(`flowchart TD
    A[Alone]`);

      const metrics = analyzeStructure(diagram);
      expect(metrics.graphDensity).toBe(0);
    });

    it('should handle highly connected graph', () => {
      const diagram = createDiagram(`flowchart TD
    A --> B
    A --> C
    B --> C
    B --> D
    C --> D`);

      const metrics = analyzeStructure(diagram);
      // 4 nodes, 5 edges: 5 / (4 × 3) = 0.417
      expect(metrics.graphDensity).toBeCloseTo(0.417, 2);
    });
  });

  describe('Max Branch Width', () => {
    it('should find max branch width', () => {
      const diagram = createDiagram(`flowchart TD
    A --> B
    A --> C
    A --> D
    B --> E`);

      const metrics = analyzeStructure(diagram);
      expect(metrics.maxBranchWidth).toBe(3); // A has 3 children
    });

    it('should return 0 for no branches', () => {
      const diagram = createDiagram(`flowchart TD
    A[Alone]`);

      const metrics = analyzeStructure(diagram);
      expect(metrics.maxBranchWidth).toBe(0);
    });

    it('should handle multiple branches', () => {
      const diagram = createDiagram(`flowchart TD
    A --> B
    A --> C
    D --> E
    D --> F
    D --> G`);

      const metrics = analyzeStructure(diagram);
      expect(metrics.maxBranchWidth).toBe(3); // D has 3 children
    });
  });

  describe('Average Degree', () => {
    it('should calculate average degree', () => {
      const diagram = createDiagram(`flowchart TD
    A --> B
    B --> C
    C --> D
    D --> E`);

      const metrics = analyzeStructure(diagram);
      // 5 nodes, 4 edges: (2 × 4) / 5 = 1.6
      expect(metrics.averageDegree).toBeCloseTo(1.6, 2);
    });

    it('should return 0 for no nodes', () => {
      const diagram = createDiagram(`flowchart TD`);

      const metrics = analyzeStructure(diagram);
      expect(metrics.averageDegree).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should analyze simple linear flow correctly', () => {
      const diagram = createDiagram(`flowchart TD
    A[Start] --> B[Process 1]
    B --> C[Process 2]
    C --> D[Process 3]
    D --> E[End]`);

      const metrics = analyzeStructure(diagram);

      expect(metrics.nodeCount).toBe(5);
      expect(metrics.edgeCount).toBe(4);
      expect(metrics.graphDensity).toBeCloseTo(0.2, 2);
      expect(metrics.maxBranchWidth).toBe(1);
      expect(metrics.averageDegree).toBeCloseTo(1.6, 2);
    });

    it('should analyze branching flow correctly', () => {
      const diagram = createDiagram(`flowchart LR
    A[Start] --> B{Decision}
    B -->|Yes| C[Path 1]
    B -->|No| D[Path 2]
    B -->|Maybe| E[Path 3]
    C --> F[End]
    D --> F
    E --> F`);

      const metrics = analyzeStructure(diagram);

      expect(metrics.nodeCount).toBe(6); // A, B, C, D, E, F
      expect(metrics.edgeCount).toBe(7);
      expect(metrics.maxBranchWidth).toBe(3); // B has 3 children
    });
  });
});
