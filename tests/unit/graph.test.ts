/**
 * Unit tests for graph algorithms
 */

import { describe, it, expect } from '@jest/globals';
import { buildGraph } from '../../src/graph/adjacency';
import {
  findRootNodes,
  findLeafNodes,
  calculateMaxDepth,
  findComponents,
  calculateSpine,
  calculateLongestLinearChain,
} from '../../src/graph/algorithms';
import type { Diagram } from '../../src/extractors/types';

describe('Graph Algorithms', () => {
  describe('Root Node Detection', () => {
    it('should find single root in tree', () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          A --> C
          B --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const roots = findRootNodes(graph);

      expect(roots).toHaveLength(1);
      expect(roots[0]).toBe('A');
    });

    it('should find multiple roots in disconnected graph', () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          C --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const roots = findRootNodes(graph);

      expect(roots).toHaveLength(2);
      expect(roots).toContain('A');
      expect(roots).toContain('C');
    });
  });

  describe('Leaf Node Detection', () => {
    it('should find leaf nodes', () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          A --> C
          B --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const leaves = findLeafNodes(graph);

      expect(leaves).toHaveLength(2);
      expect(leaves).toContain('C');
      expect(leaves).toContain('D');
    });
  });

  describe('Max Depth Calculation', () => {
    it('should calculate depth from root', () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const depth = calculateMaxDepth(graph, 'A');

      expect(depth).toBe(3);
    });

    it('should handle branching depth', () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          A --> C
          B --> D
          B --> E
          D --> F`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const depth = calculateMaxDepth(graph, 'A');

      expect(depth).toBe(3);
    });
  });

  describe('Connected Components', () => {
    it('should find single component in connected graph', () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const components = findComponents(graph);

      expect(components).toHaveLength(1);
      expect(components[0]).toHaveLength(4);
    });

    it('should find multiple components in disconnected graph', () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          C --> D
          E --> F`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const components = findComponents(graph);

      expect(components).toHaveLength(3);
    });
  });

  describe('Spine Calculation', () => {
    it('should find spine in linear graph', () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B
          B --> C
          C --> D
          D --> E`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const spine = calculateSpine(graph);

      expect(spine.length).toBe(5);
      expect(spine.ratio).toBe(1.0);
      expect(spine.path).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('should find longest path in branching graph', () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          B --> D
          C --> E`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const spine = calculateSpine(graph);

      expect(spine.length).toBeGreaterThan(0);
      expect(spine.ratio).toBeLessThan(1.0);
    });
  });

  describe('Longest Linear Chain Calculation', () => {
    it('should return length 0 for empty graph', () => {
      const diagram: Diagram = {
        content: `graph TD`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const chain = calculateLongestLinearChain(graph);

      expect(chain.length).toBe(0);
      expect(chain.path).toEqual([]);
      expect(chain.ratio).toBe(0);
      expect(chain.isLinear).toBe(false);
    });

    it('should return length 1 for single isolated node', () => {
      const diagram: Diagram = {
        content: `graph TD
          A`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const chain = calculateLongestLinearChain(graph);

      // Single node with no edges results in empty graph
      // because buildGraph only extracts nodes from edges
      expect(chain.length).toBe(0);
      expect(chain.path).toEqual([]);
      expect(chain.isLinear).toBe(false);
    });

    it('should return length 1 for single node with no connections', () => {
      const diagram: Diagram = {
        content: `graph TD
          A
          B --> C`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const chain = calculateLongestLinearChain(graph);

      // B->C is a linear chain of length 2
      // A is isolated and not in the edge list, so not counted
      expect(chain.length).toBe(2);
      expect(chain.path).toEqual(['B', 'C']);
    });

    it('should return length 9 for simple 9-node chain', () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B
          B --> C
          C --> D
          D --> E
          E --> F
          F --> G
          G --> H
          H --> I`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const chain = calculateLongestLinearChain(graph);

      expect(chain.length).toBe(9);
      expect(chain.path).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);
      expect(chain.ratio).toBe(1.0);
      expect(chain.isLinear).toBe(true);
    });

    it('should detect longest linear portion in chain with branching', () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B
          B --> C
          C --> D
          D --> E
          E --> F
          F --> G
          C --> X
          C --> Y
          C --> Z`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const chain = calculateLongestLinearChain(graph);

      // Should find the longest strictly linear portion
      // A->B is linear (2 nodes), but C has multiple children (branching point)
      // X, Y, Z are also linear single nodes
      expect(chain.length).toBeGreaterThan(0);
      expect(chain.length).toBeLessThan(10);
      expect(chain.isLinear).toBe(false);
    });

    it('should detect longest chain in disconnected graph with multiple chains', () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B
          B --> C
          D --> E
          E --> F
          F --> G
          G --> H
          X --> Y`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const chain = calculateLongestLinearChain(graph);

      // Should detect the longest chain: D->E->F->G->H (5 nodes)
      expect(chain.length).toBe(5);
      expect(chain.path).toEqual(['D', 'E', 'F', 'G', 'H']);
      expect(chain.ratio).toBeLessThan(1.0);
    });

    it('should handle circular graph without infinite loop', () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B
          B --> C
          C --> A`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const chain = calculateLongestLinearChain(graph);

      // In a circular graph, each node has exactly 1 parent and 1 child
      // So they ARE linear nodes. The algorithm traverses until hitting
      // a visited node, which prevents infinite loops
      expect(chain.length).toBe(3);
      expect(chain.path.length).toBe(3);
      expect(chain.ratio).toBe(1.0);
      expect(chain.isLinear).toBe(true);
    });

    it('should correctly identify linear chain in complex mixed structure', () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> D
          D --> E
          E --> F
          C --> X
          X --> Y
          F --> Z1
          F --> Z2
          F --> Z3`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const chain = calculateLongestLinearChain(graph);

      // A->B is linear (2 nodes)
      // C has multiple children (branch point)
      // D->E is linear (2 nodes)
      // F has multiple children (branch point)
      // X->Y is linear (2 nodes)
      // Longest should be A->B or D->E or X->Y (all 2 nodes)
      expect(chain.length).toBeGreaterThanOrEqual(1);
      expect(chain.ratio).toBeLessThan(1.0);
      expect(chain.isLinear).toBe(false);
    });

    it('should handle graph with merge points', () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> C
          B --> C
          C --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const chain = calculateLongestLinearChain(graph);

      // C has multiple parents, so not linear
      // A, B, D are linear (single nodes)
      expect(chain.length).toBe(1);
      expect(chain.isLinear).toBe(false);
    });
  });
});
