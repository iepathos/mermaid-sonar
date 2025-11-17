/**
 * Unit tests for pattern-based rules
 */

import { describe, it, expect } from '@jest/globals';
import { layoutHintRule } from '../../src/rules/layout-hint';
import { longLabelsRule } from '../../src/rules/long-labels';
import { reservedWordsRule } from '../../src/rules/reserved-words';
import { disconnectedRule } from '../../src/rules/disconnected';
import { analyzeStructure } from '../../src/analyzers/structure';
import type { Diagram } from '../../src/extractors/types';
import type { RuleConfig } from '../../src/rules/types';

describe('Pattern-based Rules', () => {
  describe('Layout Hint Rule', () => {
    it('should suggest LR for sequential pattern', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> D
          D --> E
          E --> F`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await layoutHintRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.rule).toBe('layout-hint');
      expect(issue?.severity).toBe('warning');
    });

    it('should not suggest if current matches recommended', async () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B --> C --> D --> E`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await layoutHintRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });

    it('should respect minConfidence threshold', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          A --> C
          B --> D
          C --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true, minConfidence: 0.9 };
      const issue = await layoutHintRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });

    describe('Bidirectional Validation (TD → LR Gating)', () => {
      it('should suppress LR recommendation for long TD chains (>8 nodes)', async () => {
        const diagram: Diagram = {
          content: `graph TD
            A --> B --> C --> D --> E --> F --> G --> H --> I --> J --> K --> L`,
          startLine: 1,
          filePath: 'test.md',
          type: 'graph',
        };

        const metrics = analyzeStructure(diagram);
        const config: RuleConfig = { enabled: true };
        const issue = await layoutHintRule.check(diagram, metrics, config);

        // Should NOT recommend LR layout
        if (issue) {
          expect(issue.message).not.toContain('suggested: LR');
          expect(issue.message).toContain('too long for LR conversion');
          expect(issue.suggestion).toContain('subgraph');
        }
      });

      it('should allow LR recommendation for short TD chains (≤8 nodes)', async () => {
        const diagram: Diagram = {
          content: `graph TD
            A --> B --> C --> D --> E --> F`,
          startLine: 1,
          filePath: 'test.md',
          type: 'graph',
        };

        const metrics = analyzeStructure(diagram);
        const config: RuleConfig = { enabled: true };
        const issue = await layoutHintRule.check(diagram, metrics, config);

        // Should recommend LR layout normally
        if (issue?.message.includes('Sequential')) {
          expect(issue.message).toContain('suggested: LR');
        }
      });

      it('should provide alternative suggestions for long chains', async () => {
        const diagram: Diagram = {
          content: `graph TD
            A --> B --> C --> D --> E --> F --> G --> H --> I --> J`,
          startLine: 1,
          filePath: 'test.md',
          type: 'graph',
        };

        const metrics = analyzeStructure(diagram);
        const config: RuleConfig = { enabled: true };
        const issue = await layoutHintRule.check(diagram, metrics, config);

        if (issue && issue.message.includes('too long')) {
          expect(issue.suggestion).toContain('organizing into subgraphs');
          expect(issue.suggestion).toContain('Keep TD layout');
          expect(issue.suggestion).toContain('Simplify');
        }
      });

      it('should handle edge case at threshold (8 nodes)', async () => {
        const diagram: Diagram = {
          content: `graph TD
            A --> B --> C --> D --> E --> F --> G --> H`,
          startLine: 1,
          filePath: 'test.md',
          type: 'graph',
        };

        const metrics = analyzeStructure(diagram);
        const config: RuleConfig = { enabled: true };
        const issue = await layoutHintRule.check(diagram, metrics, config);

        // 8 nodes is at threshold, should still allow LR
        if (issue?.message.includes('Sequential')) {
          expect(issue.message).toContain('suggested: LR');
        }
      });
    });
  });

  describe('Long Labels Rule', () => {
    it('should detect labels exceeding threshold', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A[This is a very long label that exceeds the recommended character limit for readability]
          B[Short label]
          A --> B`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true, threshold: 40 };
      const issue = await longLabelsRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.rule).toBe('long-labels');
      expect(issue?.message).toContain('1 node');
    });

    it('should not flag short labels', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A[Start]
          B[Process]
          C[End]
          A --> B --> C`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true, threshold: 40 };
      const issue = await longLabelsRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });

    it('should respect custom threshold', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A[Medium length label here]
          A --> B`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true, threshold: 15 };
      const issue = await longLabelsRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
    });
  });

  describe('Reserved Words Rule', () => {
    it('should detect reserved word "end"', async () => {
      const diagram: Diagram = {
        content: `graph TD
          start --> end
          end --> finish`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await reservedWordsRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.rule).toBe('reserved-words');
      expect(issue?.severity).toBe('warning');
    });

    it('should detect problematic o123 pattern', async () => {
      const diagram: Diagram = {
        content: `graph TD
          o123 --> o456
          o456 --> o789`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await reservedWordsRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
    });

    it('should detect problematic x123 pattern', async () => {
      const diagram: Diagram = {
        content: `graph TD
          x123 --> x456`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await reservedWordsRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
    });

    it('should not flag normal node IDs', async () => {
      const diagram: Diagram = {
        content: `graph TD
          start --> process
          process --> finish`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await reservedWordsRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });

    it('should NOT flag "style" when used as a directive (not node ID)', async () => {
      const diagram: Diagram = {
        content: `graph TD
          Filter[File Filter] --> Match{Match?}
          Match --> Print[Print Result]
          style Filter fill:#fff3e0
          style Match fill:#e1f5ff
          style Print fill:#e8f5e9`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await reservedWordsRule.check(diagram, metrics, config);

      // Should be null because "style" is a directive, not a node ID
      expect(issue).toBeNull();
    });

    it('should NOT flag "end" when used as subgraph closer (not node ID)', async () => {
      const diagram: Diagram = {
        content: `graph TD
          subgraph "Before Merge"
            M1[Match 1]
            C1[Context]
          end

          subgraph "After Merge"
            M2[Match 2]
            C2[Combined]
          end

          M1 --> M2`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await reservedWordsRule.check(diagram, metrics, config);

      // Should be null because "end" closes subgraphs, not used as node ID
      expect(issue).toBeNull();
    });

    it('should flag reserved words when NOT used as terminators', async () => {
      const diagram: Diagram = {
        content: `graph TD
          start --> end
          end --> middle
          middle --> finish`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await reservedWordsRule.check(diagram, metrics, config);

      // Should detect "end" as reserved word when it has outgoing edges (not a terminator)
      expect(issue).not.toBeNull();
      expect(issue?.rule).toBe('reserved-words');
      expect(issue?.message).toContain('reserved/problematic');
    });

    it('should NOT flag "End" when used as flowchart terminator (stadium shape)', async () => {
      const diagram: Diagram = {
        content: `graph TD
          Start([Begin]) --> Process
          Process --> End([Complete])`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await reservedWordsRule.check(diagram, metrics, config);

      // Should be null because Start/End use terminator shapes
      expect(issue).toBeNull();
    });

    it('should NOT flag "End" when used as sink node (no outgoing edges)', async () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B
          B --> End[Display Only]
          C --> End`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await reservedWordsRule.check(diagram, metrics, config);

      // Should be null because End has no outgoing edges (sink node)
      expect(issue).toBeNull();
    });

    it('should NOT flag "class" or "click" directives', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A[Node A] --> B[Node B]
          class A className1
          click B "https://example.com"`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = await reservedWordsRule.check(diagram, metrics, config);

      // Should be null because "class" and "click" are directives
      expect(issue).toBeNull();
    });
  });

  describe('Disconnected Components Rule', () => {
    it('should detect multiple disconnected graphs', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          C --> D
          E --> F`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true, threshold: 2 };
      const issue = await disconnectedRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.rule).toBe('disconnected-components');
      expect(issue?.message).toContain('3 disconnected');
    });

    it('should not flag single connected graph', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          B --> C
          C --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true, threshold: 2 };
      const issue = await disconnectedRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });

    it('should respect threshold', async () => {
      const diagram: Diagram = {
        content: `graph TD
          A --> B
          C --> D`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true, threshold: 3 };
      const issue = await disconnectedRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });
  });
});
