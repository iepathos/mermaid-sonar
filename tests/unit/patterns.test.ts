/**
 * Unit tests for pattern detection
 */

import { describe, it, expect } from '@jest/globals';
import { buildGraph } from '../../src/graph/adjacency';
import {
  detectSequential,
  detectHierarchical,
  detectWideBranching,
  detectReconvergence,
} from '../../src/analyzers/patterns';
import type { Diagram } from '../../src/extractors/types';

describe('Pattern Detection', () => {
  describe('Sequential Pattern', () => {
    it('should detect linear chain pattern', () => {
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
      const pattern = detectSequential(graph);

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('sequential');
      expect(pattern?.confidence).toBeGreaterThan(0.6);
    });

    it('should not detect sequential in branching tree', () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          A --> C
          A --> D
          B --> E
          B --> F`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const pattern = detectSequential(graph);

      expect(pattern).toBeNull();
    });

    it('should detect partial sequential with minor branches', () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B
          B --> C
          C --> D
          C --> D2
          D --> E
          E --> F`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const pattern = detectSequential(graph);

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('sequential');
    });
  });

  describe('Hierarchical Pattern', () => {
    it('should detect tree structure with single root', () => {
      const diagram: Diagram = {
        content: `graph TD
          Root --> Child1
          Root --> Child2
          Root --> Child3
          Child1 --> GC1
          Child1 --> GC2
          Child2 --> GC3
          Child2 --> GC4
          Child3 --> GC5
          Child3 --> GC6
          GC1 --> GGC1
          GC2 --> GGC2`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const pattern = detectHierarchical(graph);

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('hierarchical');
      expect(pattern?.confidence).toBeGreaterThan(0);
    });

    it('should not detect hierarchical in linear chain', () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B --> C --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const pattern = detectHierarchical(graph);

      expect(pattern).toBeNull();
    });

    it('should not detect hierarchical with multiple roots', () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> C
          B --> C
          C --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const pattern = detectHierarchical(graph);

      expect(pattern).toBeNull();
    });
  });

  describe('Wide Branching Pattern', () => {
    it('should detect node with many children', () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          A --> C
          A --> D
          A --> E
          A --> F
          A --> G
          A --> H`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const pattern = detectWideBranching(graph);

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('wide-branching');
      expect(pattern?.confidence).toBeGreaterThan(0);
    });

    it('should not detect wide branching with few children', () => {
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
      const pattern = detectWideBranching(graph);

      expect(pattern).toBeNull();
    });
  });

  describe('Reconvergence Pattern', () => {
    it('should detect multiple paths merging', () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B
          A --> C
          B --> D
          C --> D
          D --> E
          B --> F
          C --> F
          E --> G
          F --> G`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const pattern = detectReconvergence(graph);

      expect(pattern).not.toBeNull();
      expect(pattern?.type).toBe('reconvergence');
    });

    it('should not detect reconvergence in linear chain', () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B --> C --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const graph = buildGraph(diagram);
      const pattern = detectReconvergence(graph);

      expect(pattern).toBeNull();
    });
  });
});
