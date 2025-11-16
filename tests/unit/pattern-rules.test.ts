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
    it('should suggest LR for sequential pattern', () => {
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
      const issue = layoutHintRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.rule).toBe('layout-hint');
      expect(issue?.severity).toBe('info');
    });

    it('should not suggest if current matches recommended', () => {
      const diagram: Diagram = {
        content: `graph LR
          A --> B --> C --> D --> E`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = layoutHintRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });

    it('should respect minConfidence threshold', () => {
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
      const issue = layoutHintRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });
  });

  describe('Long Labels Rule', () => {
    it('should detect labels exceeding threshold', () => {
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
      const issue = longLabelsRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.rule).toBe('long-labels');
      expect(issue?.message).toContain('1 node');
    });

    it('should not flag short labels', () => {
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
      const issue = longLabelsRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });

    it('should respect custom threshold', () => {
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
      const issue = longLabelsRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
    });
  });

  describe('Reserved Words Rule', () => {
    it('should detect reserved word "end"', () => {
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
      const issue = reservedWordsRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.rule).toBe('reserved-words');
      expect(issue?.severity).toBe('warning');
    });

    it('should detect problematic o123 pattern', () => {
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
      const issue = reservedWordsRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
    });

    it('should detect problematic x123 pattern', () => {
      const diagram: Diagram = {
        content: `graph TD
          x123 --> x456`,
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const metrics = analyzeStructure(diagram);
      const config: RuleConfig = { enabled: true };
      const issue = reservedWordsRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
    });

    it('should not flag normal node IDs', () => {
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
      const issue = reservedWordsRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });
  });

  describe('Disconnected Components Rule', () => {
    it('should detect multiple disconnected graphs', () => {
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
      const issue = disconnectedRule.check(diagram, metrics, config);

      expect(issue).not.toBeNull();
      expect(issue?.rule).toBe('disconnected-components');
      expect(issue?.message).toContain('3 disconnected');
    });

    it('should not flag single connected graph', () => {
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
      const issue = disconnectedRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });

    it('should respect threshold', () => {
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
      const issue = disconnectedRule.check(diagram, metrics, config);

      expect(issue).toBeNull();
    });
  });
});
