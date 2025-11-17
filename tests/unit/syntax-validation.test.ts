/**
 * Unit tests for syntax validation rule
 */

import { syntaxValidationRule } from '../../src/rules/syntax-validation';
import type { Diagram } from '../../src/extractors/types';
import type { Metrics } from '../../src/analyzers/types';
import type { RuleConfig } from '../../src/rules/types';

describe('Syntax Validation Rule', () => {
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

  describe('Valid Diagrams', () => {
    it('should pass valid flowchart', async () => {
      const diagram: Diagram = {
        content: 'flowchart TD\n  A --> B',
        startLine: 1,
        filePath: 'test.md',
        type: 'flowchart',
      };

      const issue = await syntaxValidationRule.check(diagram, mockMetrics, baseConfig);
      expect(issue).toBeNull();
    });

    it('should pass valid graph', async () => {
      const diagram: Diagram = {
        content: 'graph TD\n  A --> B\n  B --> C',
        startLine: 1,
        filePath: 'test.md',
        type: 'graph',
      };

      const issue = await syntaxValidationRule.check(diagram, mockMetrics, baseConfig);
      expect(issue).toBeNull();
    });

    it('should pass valid sequence diagram', async () => {
      const diagram: Diagram = {
        content: 'sequenceDiagram\n  Alice->>Bob: Hello',
        startLine: 1,
        filePath: 'test.md',
        type: 'unknown',
      };

      const issue = await syntaxValidationRule.check(diagram, mockMetrics, baseConfig);
      expect(issue).toBeNull();
    });

    it('should pass diagram with subgraphs', async () => {
      const diagram: Diagram = {
        content: 'flowchart TD\n  subgraph S1\n    A --> B\n  end',
        startLine: 1,
        filePath: 'test.md',
        type: 'flowchart',
      };

      const issue = await syntaxValidationRule.check(diagram, mockMetrics, baseConfig);
      expect(issue).toBeNull();
    });

    it('should pass diagram with labels', async () => {
      const diagram: Diagram = {
        content: 'flowchart TD\n  A[Start] --> B[Process]\n  B --> C[End]',
        startLine: 1,
        filePath: 'test.md',
        type: 'flowchart',
      };

      const issue = await syntaxValidationRule.check(diagram, mockMetrics, baseConfig);
      expect(issue).toBeNull();
    });
  });

  describe('Invalid Syntax', () => {
    it('should detect invalid diagram type', async () => {
      const diagram: Diagram = {
        content: 'invalidDiagramType\n  A --> B',
        startLine: 5,
        filePath: 'test.md',
        type: 'unknown',
      };

      const issue = await syntaxValidationRule.check(diagram, mockMetrics, baseConfig);
      expect(issue).not.toBeNull();
      expect(issue!.rule).toBe('syntax-validation');
      expect(issue!.severity).toBe('error');
      expect(issue!.message).toContain('Syntax error');
      expect(issue!.filePath).toBe('test.md');
      expect(issue!.line).toBe(5);
      expect(issue!.suggestion).toBeDefined();
    });

    it('should detect unclosed brackets', async () => {
      const diagram: Diagram = {
        content: 'flowchart TD\n  A[Unclosed',
        startLine: 10,
        filePath: 'test.md',
        type: 'flowchart',
      };

      const issue = await syntaxValidationRule.check(diagram, mockMetrics, baseConfig);
      expect(issue).not.toBeNull();
      expect(issue!.severity).toBe('error');
    });

    it('should detect invalid arrow syntax', async () => {
      const diagram: Diagram = {
        content: 'flowchart TD\n  A -> B',
        startLine: 1,
        filePath: 'test.md',
        type: 'flowchart',
      };

      const issue = await syntaxValidationRule.check(diagram, mockMetrics, baseConfig);
      expect(issue).not.toBeNull();
      expect(issue!.message).toContain('Syntax error');
      expect(issue!.suggestion).toBeDefined();
    });
  });

  describe('Error Messages', () => {
    it('should include suggestion for common errors', async () => {
      const diagram: Diagram = {
        content: 'flowchart TD\n  A -> B',
        startLine: 1,
        filePath: 'test.md',
        type: 'flowchart',
      };

      const issue = await syntaxValidationRule.check(diagram, mockMetrics, baseConfig);
      expect(issue).not.toBeNull();
      expect(issue!.suggestion).toBeTruthy();
      expect(issue!.suggestion!.length).toBeGreaterThan(0);
    });

    it('should map to correct line number', async () => {
      const diagram: Diagram = {
        content: 'invalidType\n  A --> B',
        startLine: 42,
        filePath: 'docs/test.md',
        type: 'unknown',
      };

      const issue = await syntaxValidationRule.check(diagram, mockMetrics, baseConfig);
      expect(issue).not.toBeNull();
      expect(issue!.line).toBe(42);
      expect(issue!.filePath).toBe('docs/test.md');
    });
  });

  describe('Configuration', () => {
    it('should respect custom severity', async () => {
      const diagram: Diagram = {
        content: 'invalidType',
        startLine: 1,
        filePath: 'test.md',
        type: 'unknown',
      };

      const customConfig: RuleConfig = {
        enabled: true,
        severity: 'warning',
      };

      const issue = await syntaxValidationRule.check(diagram, mockMetrics, customConfig);
      expect(issue).not.toBeNull();
      expect(issue!.severity).toBe('warning');
    });

    it('should use default severity when not specified', async () => {
      const diagram: Diagram = {
        content: 'invalidType',
        startLine: 1,
        filePath: 'test.md',
        type: 'unknown',
      };

      const minimalConfig: RuleConfig = {
        enabled: true,
      };

      const issue = await syntaxValidationRule.check(diagram, mockMetrics, minimalConfig);
      expect(issue).not.toBeNull();
      expect(issue!.severity).toBe('error'); // Default severity
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty diagrams', async () => {
      const diagram: Diagram = {
        content: '',
        startLine: 1,
        filePath: 'test.md',
        type: 'unknown',
      };

      const issue = await syntaxValidationRule.check(diagram, mockMetrics, baseConfig);
      expect(issue).not.toBeNull();
      expect(issue!.severity).toBe('error');
    });

    it('should handle diagrams with special characters', async () => {
      const diagram: Diagram = {
        content: 'flowchart TD\n  A["Label with special: chars"] --> B',
        startLine: 1,
        filePath: 'test.md',
        type: 'flowchart',
      };

      const issue = await syntaxValidationRule.check(diagram, mockMetrics, baseConfig);
      expect(issue).toBeNull();
    });

    it('should handle multi-line labels', async () => {
      const diagram: Diagram = {
        content: 'flowchart TD\n  A["Line 1<br>Line 2"] --> B',
        startLine: 1,
        filePath: 'test.md',
        type: 'flowchart',
      };

      const issue = await syntaxValidationRule.check(diagram, mockMetrics, baseConfig);
      expect(issue).toBeNull();
    });
  });
});
