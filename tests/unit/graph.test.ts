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
});
