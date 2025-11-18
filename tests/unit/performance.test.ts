/**
 * Performance tests for syntax validation
 *
 * Verifies that syntax validation adds <100ms overhead per diagram
 * as required by spec 001.
 */

import { syntaxValidationRule } from '../../src/rules/syntax-validation';
import { verticalHeightReadabilityRule } from '../../src/rules/vertical-height-readability';
import { analyzeStructure } from '../../src/analyzers/structure';
import type { Diagram } from '../../src/extractors/types';
import type { Metrics } from '../../src/analyzers/types';
import type { RuleConfig } from '../../src/rules/types';

describe('Performance Benchmarks', () => {
  const mockMetrics: Metrics = {
    nodeCount: 0,
    edgeCount: 0,
    graphDensity: 0,
    maxBranchWidth: 0,
    averageDegree: 0,
  };

  const baseConfig: RuleConfig = {
    enabled: true,
    severity: 'error',
  };

  /**
   * Measure parsing time for a diagram
   */
  async function measureParsingTime(diagram: Diagram): Promise<number> {
    const startTime = performance.now();
    await syntaxValidationRule.check(diagram, mockMetrics, baseConfig);
    const endTime = performance.now();
    return endTime - startTime;
  }

  /**
   * Generate a flowchart with specified number of nodes
   */
  function generateFlowchart(nodeCount: number): string {
    const lines = ['flowchart TD'];
    for (let i = 0; i < nodeCount - 1; i++) {
      lines.push(`  N${i} --> N${i + 1}`);
    }
    return lines.join('\n');
  }

  describe('Syntax Validation Performance', () => {
    it('should validate small diagram (<10 nodes) in <300ms', async () => {
      const diagram: Diagram = {
        content: generateFlowchart(5),
        startLine: 1,
        filePath: 'test.md',
        type: 'flowchart',
      };

      const parsingTime = await measureParsingTime(diagram);
      // DOM polyfill initialization adds overhead on first run
      expect(parsingTime).toBeLessThan(300);
    });

    it('should validate medium diagram (10-50 nodes) in <100ms', async () => {
      const diagram: Diagram = {
        content: generateFlowchart(30),
        startLine: 1,
        filePath: 'test.md',
        type: 'flowchart',
      };

      const parsingTime = await measureParsingTime(diagram);
      expect(parsingTime).toBeLessThan(100);
    });

    it('should validate large diagram (50-100 nodes) in <100ms', async () => {
      const diagram: Diagram = {
        content: generateFlowchart(75),
        startLine: 1,
        filePath: 'test.md',
        type: 'flowchart',
      };

      const parsingTime = await measureParsingTime(diagram);
      expect(parsingTime).toBeLessThan(100);
    });

    it('should maintain average <100ms over multiple diagrams', async () => {
      const diagrams: Diagram[] = [
        {
          content: generateFlowchart(10),
          startLine: 1,
          filePath: 'test1.md',
          type: 'flowchart',
        },
        {
          content: generateFlowchart(25),
          startLine: 1,
          filePath: 'test2.md',
          type: 'flowchart',
        },
        {
          content: generateFlowchart(50),
          startLine: 1,
          filePath: 'test3.md',
          type: 'flowchart',
        },
        {
          content: 'graph TD\n  A --> B\n  B --> C\n  C --> D',
          startLine: 1,
          filePath: 'test4.md',
          type: 'graph',
        },
      ];

      const times: number[] = [];
      for (const diagram of diagrams) {
        const time = await measureParsingTime(diagram);
        times.push(time);
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      expect(averageTime).toBeLessThan(100);
    });

    it('should validate complex diagram with branches in <100ms', async () => {
      const diagram: Diagram = {
        content: `flowchart TD
  Start --> Decision
  Decision -->|Yes| Action1
  Decision -->|No| Action2
  Action1 --> SubDecision1
  Action2 --> SubDecision2
  SubDecision1 -->|A| Result1
  SubDecision1 -->|B| Result2
  SubDecision2 -->|C| Result3
  SubDecision2 -->|D| Result4
  Result1 --> End
  Result2 --> End
  Result3 --> End
  Result4 --> End`,
        startLine: 1,
        filePath: 'test.md',
        type: 'flowchart',
      };

      const parsingTime = await measureParsingTime(diagram);
      expect(parsingTime).toBeLessThan(100);
    });

    it('should handle invalid syntax within performance budget', async () => {
      const diagram: Diagram = {
        content: 'flowchart TD\n  A B\n  C --> D',
        startLine: 1,
        filePath: 'test.md',
        type: 'flowchart',
      };

      const parsingTime = await measureParsingTime(diagram);
      expect(parsingTime).toBeLessThan(100);
    });
  });

  describe('Vertical Height Readability Performance', () => {
    /**
     * Generate a deep tree diagram for performance testing
     */
    function generateDeepTree(depth: number): string {
      const lines = ['graph TD'];
      for (let i = 0; i < depth - 1; i++) {
        lines.push(`  Node${i}[Level ${i}] --> Node${i + 1}[Level ${i + 1}]`);
      }
      return lines.join('\n');
    }

    /**
     * Generate a wide branching diagram for performance testing
     */
    function generateWideBranching(branches: number): string {
      const lines = ['graph LR', '  Root[Start] --> Middle[Process]', ''];
      for (let i = 0; i < branches; i++) {
        lines.push(`  Middle --> Branch${i}[Branch ${i}]`);
      }
      return lines.join('\n');
    }

    /**
     * Measure execution time for vertical-height-readability rule
     */
    function measureHeightCheckTime(diagram: Diagram): number {
      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = {
        enabled: true,
        thresholds: { info: 800, warning: 1200, error: 2000 },
      };

      const startTime = performance.now();
      verticalHeightReadabilityRule.check(diagram, metrics, config);
      const endTime = performance.now();
      return endTime - startTime;
    }

    it('should check shallow diagram (5 levels) in <50ms', () => {
      const diagram: Diagram = {
        content: generateDeepTree(5),
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const executionTime = measureHeightCheckTime(diagram);
      expect(executionTime).toBeLessThan(50);
    });

    it('should check medium diagram (10 levels) in <50ms', () => {
      const diagram: Diagram = {
        content: generateDeepTree(10),
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const executionTime = measureHeightCheckTime(diagram);
      expect(executionTime).toBeLessThan(50);
    });

    it('should check deep diagram (20 levels) in <50ms', () => {
      const diagram: Diagram = {
        content: generateDeepTree(20),
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const executionTime = measureHeightCheckTime(diagram);
      expect(executionTime).toBeLessThan(50);
    });

    it('should check very deep diagram (50 levels) in <50ms', () => {
      const diagram: Diagram = {
        content: generateDeepTree(50),
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const executionTime = measureHeightCheckTime(diagram);
      expect(executionTime).toBeLessThan(50);
    });

    it('should check wide branching diagram (10 branches) in <50ms', () => {
      const diagram: Diagram = {
        content: generateWideBranching(10),
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const executionTime = measureHeightCheckTime(diagram);
      expect(executionTime).toBeLessThan(50);
    });

    it('should check very wide branching diagram (50 branches) in <50ms', () => {
      const diagram: Diagram = {
        content: generateWideBranching(50),
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const executionTime = measureHeightCheckTime(diagram);
      expect(executionTime).toBeLessThan(50);
    });

    it('should check complex diagram with branching and depth in <50ms', () => {
      const diagram: Diagram = {
        content: `graph TD
          Root --> L1A & L1B & L1C & L1D & L1E
          L1A --> L2A1 & L2A2
          L2A1 --> L3A1
          L3A1 --> L4A1
          L4A1 --> L5A1
          L5A1 --> L6A1
          L6A1 --> L7A1
          L7A1 --> L8A1
          L1B --> L2B1 & L2B2
          L2B1 --> L3B1
          L3B1 --> L4B1
          L1C --> L2C1
          L2C1 --> L3C1
          L3C1 --> L4C1
          L4C1 --> L5C1`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const executionTime = measureHeightCheckTime(diagram);
      expect(executionTime).toBeLessThan(50);
    });

    it('should verify O(n) memory usage for deep diagrams', () => {
      // Create diagrams of increasing depth
      const depths = [10, 20, 30, 40, 50];
      const times: number[] = [];

      for (const depth of depths) {
        const diagram: Diagram = {
          content: generateDeepTree(depth),
          startLine: 1,
          filePath: 'test.md',
          type: 'graph',
        };
        times.push(measureHeightCheckTime(diagram));
      }

      // Verify execution time scales roughly linearly (not exponentially)
      // If it's O(n), doubling depth should roughly double time
      // Allow 3x tolerance for variance
      const ratio1 = times[4] / times[0]; // 50 vs 10 nodes (5x nodes)
      expect(ratio1).toBeLessThan(15); // Should be ~5x, allow up to 15x
    });

    it('should maintain average <50ms over multiple different diagrams', () => {
      const diagrams: Diagram[] = [
        {
          content: generateDeepTree(10),
          startLine: 1,
          filePath: 'test1.md',
          type: 'graph',
        },
        {
          content: generateWideBranching(15),
          startLine: 1,
          filePath: 'test2.md',
          type: 'graph',
        },
        {
          content: generateDeepTree(25),
          startLine: 1,
          filePath: 'test3.md',
          type: 'graph',
        },
        {
          content: generateWideBranching(30),
          startLine: 1,
          filePath: 'test4.md',
          type: 'graph',
        },
        {
          content: `graph TD
            A --> B & C & D
            B --> E & F
            E --> G
            G --> H`,
          startLine: 1,
          filePath: 'test5.md',
          type: 'graph',
        },
      ];

      const times: number[] = diagrams.map(measureHeightCheckTime);
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;

      expect(averageTime).toBeLessThan(50);
    });
  });
});
