/**
 * Unit tests for rule system
 */

import { analyzeDiagramFileWithRules } from '../../src/index';
import { runRules } from '../../src/rules';
import { analyzeStructure } from '../../src/analyzers/structure';
import { extractDiagramsFromFile } from '../../src/extractors/markdown';
import { defaultConfig } from '../../src/config';
import type { Config } from '../../src/config';

describe('Rule System', () => {
  describe('Max Edges Rule', () => {
    it('should trigger on diagrams with >100 edges', async () => {
      const results = await analyzeDiagramFileWithRules('tests/fixtures/too-many-edges.md');
      expect(results).toHaveLength(1);
      expect(results[0].issues).toBeDefined();
      expect(results[0].issues!.length).toBeGreaterThan(0);

      const maxEdgeIssue = results[0].issues!.find((i) => i.rule === 'max-edges');
      expect(maxEdgeIssue).toBeDefined();
      expect(maxEdgeIssue!.severity).toBe('error');
      expect(maxEdgeIssue!.message).toContain('Too many connections');
    });

    it('should not trigger on clean diagrams', async () => {
      const results = await analyzeDiagramFileWithRules('tests/fixtures/clean.md');
      expect(results).toHaveLength(1);

      const maxEdgeIssue = results[0].issues?.find((i) => i.rule === 'max-edges');
      expect(maxEdgeIssue).toBeUndefined();
    });

    it('should respect custom threshold', async () => {
      const diagrams = extractDiagramsFromFile('tests/fixtures/clean.md');
      const metrics = analyzeStructure(diagrams[0]);

      const customConfig: Config = {
        ...defaultConfig,
        rules: {
          ...defaultConfig.rules,
          'max-edges': {
            enabled: true,
            severity: 'warning',
            threshold: 10, // Very low threshold
          },
        },
      };

      const issues = await runRules(diagrams[0], metrics, customConfig);
      const maxEdgeIssue = issues.find((i) => i.rule === 'max-edges');

      expect(maxEdgeIssue).toBeDefined();
      expect(maxEdgeIssue!.severity).toBe('warning');
    });
  });

  describe('High-Density Cognitive Load Rule', () => {
    it('should trigger on high-density diagrams with >50 nodes', async () => {
      // Use lower thresholds for testing since creating a true high-density
      // diagram with >50 nodes is impractical (would need 750+ edges)
      const diagrams = extractDiagramsFromFile('tests/fixtures/high-density.md');
      const metrics = analyzeStructure(diagrams[0]);

      const customConfig: Config = {
        ...defaultConfig,
        rules: {
          ...defaultConfig.rules,
          'max-nodes-high-density': {
            enabled: true,
            severity: 'warning',
            threshold: 15, // Lower threshold for testing
            densityThreshold: 0.05, // Lower density threshold
          },
        },
      };

      const issues = await runRules(diagrams[0], metrics, customConfig);
      const highDensityIssue = issues.find((i) => i.rule === 'max-nodes-high-density');

      expect(highDensityIssue).toBeDefined();
      expect(highDensityIssue!.severity).toBe('warning');
      expect(highDensityIssue!.message).toContain('High cognitive load');
    });

    it('should not trigger on clean diagrams', async () => {
      const results = await analyzeDiagramFileWithRules('tests/fixtures/clean.md');

      const highDensityIssue = results[0].issues?.find((i) => i.rule === 'max-nodes-high-density');
      expect(highDensityIssue).toBeUndefined();
    });
  });

  describe('Low-Density Cognitive Load Rule', () => {
    it('should trigger on low-density diagrams with >100 nodes', async () => {
      const results = await analyzeDiagramFileWithRules('tests/fixtures/low-density.md');
      expect(results).toHaveLength(1);

      const lowDensityIssue = results[0].issues?.find((i) => i.rule === 'max-nodes-low-density');
      expect(lowDensityIssue).toBeDefined();
      expect(lowDensityIssue!.severity).toBe('warning');
      expect(lowDensityIssue!.message).toContain('Too many nodes');
    });

    it('should not trigger on clean diagrams', async () => {
      const results = await analyzeDiagramFileWithRules('tests/fixtures/clean.md');

      const lowDensityIssue = results[0].issues?.find((i) => i.rule === 'max-nodes-low-density');
      expect(lowDensityIssue).toBeUndefined();
    });
  });

  describe('Cyclomatic Complexity Rule', () => {
    it('should trigger on diagrams with >10 decision nodes', async () => {
      const results = await analyzeDiagramFileWithRules('tests/fixtures/complex-decisions.md');
      expect(results).toHaveLength(1);

      const cyclomaticIssue = results[0].issues?.find((i) => i.rule === 'cyclomatic-complexity');
      expect(cyclomaticIssue).toBeDefined();
      expect(cyclomaticIssue!.severity).toBe('warning');
      expect(cyclomaticIssue!.message).toContain('cyclomatic complexity');
    });

    it('should not trigger on clean diagrams with few decisions', async () => {
      const results = await analyzeDiagramFileWithRules('tests/fixtures/clean.md');

      const cyclomaticIssue = results[0].issues?.find((i) => i.rule === 'cyclomatic-complexity');
      expect(cyclomaticIssue).toBeUndefined();
    });

    it('should calculate complexity correctly', async () => {
      const results = await analyzeDiagramFileWithRules('tests/fixtures/complex-decisions.md');
      const cyclomaticIssue = results[0].issues?.find((i) => i.rule === 'cyclomatic-complexity');

      // Should have 12 decision nodes -> complexity = 13
      expect(cyclomaticIssue!.message).toContain('12 decision nodes');
    });
  });

  describe('Configuration', () => {
    it('should disable rules when configured', async () => {
      const diagrams = extractDiagramsFromFile('tests/fixtures/too-many-edges.md');
      const metrics = analyzeStructure(diagrams[0]);

      const customConfig: Config = {
        ...defaultConfig,
        rules: {
          ...defaultConfig.rules,
          'max-edges': {
            enabled: false,
            severity: 'error',
            threshold: 100,
          },
        },
      };

      const issues = await runRules(diagrams[0], metrics, customConfig);
      const maxEdgeIssue = issues.find((i) => i.rule === 'max-edges');

      expect(maxEdgeIssue).toBeUndefined();
    });

    it('should override severity levels', async () => {
      const diagrams = extractDiagramsFromFile('tests/fixtures/too-many-edges.md');
      const metrics = analyzeStructure(diagrams[0]);

      const customConfig: Config = {
        ...defaultConfig,
        rules: {
          ...defaultConfig.rules,
          'max-edges': {
            enabled: true,
            severity: 'info',
            threshold: 100,
          },
        },
      };

      const issues = await runRules(diagrams[0], metrics, customConfig);
      const maxEdgeIssue = issues.find((i) => i.rule === 'max-edges');

      expect(maxEdgeIssue).toBeDefined();
      expect(maxEdgeIssue!.severity).toBe('info');
    });
  });

  describe('Clean Fixture', () => {
    it('should not trigger any error rules on clean diagram', async () => {
      const results = await analyzeDiagramFileWithRules('tests/fixtures/clean.md');
      expect(results).toHaveLength(1);

      // Should have no errors (readability warnings are acceptable)
      expect(results[0].issues).toBeDefined();
      const errorIssues = results[0].issues!.filter((i) => i.severity === 'error');
      expect(errorIssues.length).toBe(0);
    });
  });

  describe('Issue Format', () => {
    it('should include all required fields in issues', async () => {
      const results = await analyzeDiagramFileWithRules('tests/fixtures/too-many-edges.md');
      const issue = results[0].issues![0];

      expect(issue.rule).toBeDefined();
      expect(issue.severity).toBeDefined();
      expect(issue.message).toBeDefined();
      expect(issue.filePath).toBeDefined();
      expect(issue.line).toBeDefined();
    });

    it('should include suggestion and citation', async () => {
      const results = await analyzeDiagramFileWithRules('tests/fixtures/too-many-edges.md');
      const maxEdgeIssue = results[0].issues!.find((i) => i.rule === 'max-edges');

      expect(maxEdgeIssue!.suggestion).toBeDefined();
      expect(maxEdgeIssue!.citation).toBeDefined();
      expect(maxEdgeIssue!.citation).toContain('http');
    });
  });
});
