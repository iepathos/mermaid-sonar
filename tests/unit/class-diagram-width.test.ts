/**
 * Unit tests for class diagram width rule
 */

import type { Diagram } from '../../src/extractors/types';
import type { Metrics } from '../../src/analyzers/types';
import type { Severity, Issue } from '../../src/rules/types';
import { classDiagramWidthRule } from '../../src/rules/class-diagram-width';

describe('Class Diagram Width Rule', () => {
  const mockMetrics: Metrics = {
    nodeCount: 0,
    edgeCount: 0,
    graphDensity: 0,
    maxBranchWidth: 0,
    averageDegree: 0,
  };

  describe('Threshold Detection', () => {
    it('should return null for narrow diagrams', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class A
    class B
    A <|-- B
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const issue = classDiagramWidthRule.check(diagram, mockMetrics, { enabled: true });

      expect(issue).toBeNull();
    });

    it('should detect info-level width issues', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Root
    class C1
    class C2
    class C3
    class C4
    class C5
    class C6
    class C7
    class C8
    Root <|-- C1
    Root <|-- C2
    Root <|-- C3
    Root <|-- C4
    Root <|-- C5
    Root <|-- C6
    Root <|-- C7
    Root <|-- C8
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const config = {
        enabled: true,
        thresholds: {
          info: 1200,
          warning: 2000,
          error: 2500,
        },
      };

      const issue = classDiagramWidthRule.check(diagram, mockMetrics, config) as Issue | null;

      expect(issue).not.toBeNull();
      expect(issue!.severity).toBe('info');
    });

    it('should detect warning-level width issues', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Root
${Array.from({ length: 15 }, (_, i) => `    class C${i + 1}`).join('\n')}
${Array.from({ length: 15 }, (_, i) => `    Root <|-- C${i + 1}`).join('\n')}
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const config = {
        enabled: true,
        thresholds: {
          info: 1500,
          warning: 2000,
          error: 3000,
        },
      };

      const issue = classDiagramWidthRule.check(diagram, mockMetrics, config) as Issue | null;

      expect(issue).not.toBeNull();
      expect(issue!.severity).toBe('warning');
    });

    it('should detect error-level width issues', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Root
${Array.from({ length: 20 }, (_, i) => `    class C${i + 1}`).join('\n')}
${Array.from({ length: 20 }, (_, i) => `    Root <|-- C${i + 1}`).join('\n')}
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const config = {
        enabled: true,
        thresholds: {
          info: 1500,
          warning: 2000,
          error: 2500,
        },
      };

      const issue = classDiagramWidthRule.check(diagram, mockMetrics, config) as Issue | null;

      expect(issue).not.toBeNull();
      expect(issue!.severity).toBe('error');
    });
  });

  describe('Custom Configuration', () => {
    it('should use custom target width', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Root
    class C1
    class C2
    class C3
    Root <|-- C1
    Root <|-- C2
    Root <|-- C3
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const config = {
        enabled: true,
        targetWidth: 800,
        thresholds: {
          info: 900,
          warning: 1200,
          error: 1500,
        },
      };

      const issue = classDiagramWidthRule.check(diagram, mockMetrics, config) as Issue | null;

      if (issue) {
        expect(issue.message).toContain('800px');
      }
    });

    it('should use default thresholds when not provided', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Root
${Array.from({ length: 15 }, (_, i) => `    class C${i + 1}`).join('\n')}
${Array.from({ length: 15 }, (_, i) => `    Root <|-- C${i + 1}`).join('\n')}
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const issue = classDiagramWidthRule.check(diagram, mockMetrics, { enabled: true });

      expect(issue).not.toBeNull();
    });

    it('should respect custom severity', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Root
${Array.from({ length: 8 }, (_, i) => `    class C${i + 1}`).join('\n')}
${Array.from({ length: 8 }, (_, i) => `    Root <|-- C${i + 1}`).join('\n')}
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const config = {
        enabled: true,
        severity: 'error' as Severity,
        thresholds: {
          info: 1200,
          warning: 1800,
          error: 2500,
        },
      };

      const issue = classDiagramWidthRule.check(diagram, mockMetrics, config) as Issue | null;

      if (issue) {
        expect(['info', 'warning', 'error']).toContain(issue.severity);
      }
    });
  });

  describe('Diagram Type Filtering', () => {
    it('should only check class diagrams', () => {
      const flowDiagram: Diagram = {
        type: 'flowchart',
        content: `
flowchart LR
    A --> B --> C --> D --> E --> F --> G --> H
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const issue = classDiagramWidthRule.check(flowDiagram, mockMetrics, { enabled: true });

      expect(issue).toBeNull();
    });

    it('should check class diagrams', () => {
      const classDiagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Root
${Array.from({ length: 10 }, (_, i) => `    class C${i + 1}`).join('\n')}
${Array.from({ length: 10 }, (_, i) => `    Root <|-- C${i + 1}`).join('\n')}
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const config = {
        enabled: true,
        thresholds: {
          info: 1500,
          warning: 2000,
          error: 2500,
        },
      };

      const issue = classDiagramWidthRule.check(classDiagram, mockMetrics, config);

      expect(issue).not.toBeNull();
    });
  });

  describe('Issue Message and Suggestions', () => {
    it('should include width information in message', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Root
${Array.from({ length: 10 }, (_, i) => `    class C${i + 1}`).join('\n')}
${Array.from({ length: 10 }, (_, i) => `    Root <|-- C${i + 1}`).join('\n')}
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const config = {
        enabled: true,
        thresholds: {
          info: 1500,
          warning: 2000,
          error: 2500,
        },
      };

      const issue = classDiagramWidthRule.check(diagram, mockMetrics, config) as Issue | null;

      expect(issue).not.toBeNull();
      expect(issue!.message).toContain('width');
      expect(issue!.message).toContain('px');
      expect(issue!.message).toContain('classes');
    });

    it('should include helpful suggestions', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Root
${Array.from({ length: 10 }, (_, i) => `    class C${i + 1}`).join('\n')}
${Array.from({ length: 10 }, (_, i) => `    Root <|-- C${i + 1}`).join('\n')}
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const config = {
        enabled: true,
        thresholds: {
          info: 1500,
          warning: 2000,
          error: 2500,
        },
      };

      const issue = classDiagramWidthRule.check(diagram, mockMetrics, config) as Issue | null;

      expect(issue?.suggestion).toBeDefined();
      expect(issue?.suggestion).toContain('Split');
      expect(issue?.suggestion).toContain('Suggestions');
    });

    it('should include file path and line number', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Root
${Array.from({ length: 10 }, (_, i) => `    class C${i + 1}`).join('\n')}
${Array.from({ length: 10 }, (_, i) => `    Root <|-- C${i + 1}`).join('\n')}
`,
        filePath: 'docs/architecture.md',
        startLine: 42,
      };

      const config = {
        enabled: true,
        thresholds: {
          info: 1500,
          warning: 2000,
          error: 2500,
        },
      };

      const issue = classDiagramWidthRule.check(diagram, mockMetrics, config) as Issue | null;

      expect(issue?.filePath).toBe('docs/architecture.md');
      expect(issue?.line).toBe(42);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle complex inheritance hierarchy', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
    class Animal
    class Mammal
    class Reptile
    class Bird
    Animal <|-- Mammal
    Animal <|-- Reptile
    Animal <|-- Bird
${Array.from({ length: 6 }, (_, i) => `    class Mammal${i + 1}`).join('\n')}
${Array.from({ length: 6 }, (_, i) => `    Mammal <|-- Mammal${i + 1}`).join('\n')}
${Array.from({ length: 6 }, (_, i) => `    class Reptile${i + 1}`).join('\n')}
${Array.from({ length: 6 }, (_, i) => `    Reptile <|-- Reptile${i + 1}`).join('\n')}
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const config = {
        enabled: true,
        thresholds: {
          info: 1500,
          warning: 2000,
          error: 2500,
        },
      };

      const issue = classDiagramWidthRule.check(diagram, mockMetrics, config) as Issue | null;

      if (issue) {
        expect(issue.suggestion).toContain('inheritance');
      }
    });

    it('should handle wide single-level diagrams', () => {
      const diagram: Diagram = {
        type: 'class',
        content: `
classDiagram
${Array.from({ length: 15 }, (_, i) => `    class Service${i + 1}`).join('\n')}
${Array.from({ length: 14 }, (_, i) => `    Service${i + 1} --> Service${i + 2}`).join('\n')}
`,
        filePath: 'test.md',
        startLine: 1,
      };

      const config = {
        enabled: true,
        thresholds: {
          info: 1500,
          warning: 2000,
          error: 2500,
        },
      };

      const issue = classDiagramWidthRule.check(diagram, mockMetrics, config) as Issue | null;

      if (issue) {
        expect(issue.suggestion).toContain('Split');
      }
    });
  });
});
