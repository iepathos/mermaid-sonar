/**
 * Unit tests for sequence diagram width rule
 */

import { sequenceDiagramWidthRule } from '../../src/rules/sequence-diagram-width';
import type { Diagram } from '../../src/extractors/types';
import type { Metrics } from '../../src/analyzers/types';

function createDiagram(content: string): Diagram {
  return {
    content,
    type: 'sequence',
    filePath: 'test.md',
    startLine: 10,
  };
}

const mockMetrics: Metrics = {
  nodeCount: 0,
  edgeCount: 0,
  graphDensity: 0,
  maxBranchWidth: 0,
  averageDegree: 0,
};

describe('Sequence Diagram Width Rule', () => {
  it('should not trigger for diagrams with 2-3 participants', async () => {
    const diagram = createDiagram(`
sequenceDiagram
    Alice->>Bob: Hello
    Bob-->>Alice: Hi
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
    };

    const issue = await sequenceDiagramWidthRule.check(diagram, mockMetrics, config);

    expect(issue).toBeNull();
  });

  it('should trigger info level for 5 participants', async () => {
    const diagram = createDiagram(`
sequenceDiagram
    A->>B: 1
    B->>C: 2
    C->>D: 3
    D->>E: 4
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
    };

    const issue = await sequenceDiagramWidthRule.check(diagram, mockMetrics, config);

    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe('info');
    expect(issue?.message).toContain('5 participants');
  });

  it('should trigger warning for 7 participants', async () => {
    const diagram = createDiagram(`
sequenceDiagram
    A->>B: 1
    B->>C: 2
    C->>D: 3
    D->>E: 4
    E->>F: 5
    F->>G: 6
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
    };

    const issue = await sequenceDiagramWidthRule.check(diagram, mockMetrics, config);

    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe('warning');
  });

  it('should trigger error for 9+ participants', async () => {
    const diagram = createDiagram(`
sequenceDiagram
    A->>B: 1
    B->>C: 2
    C->>D: 3
    D->>E: 4
    E->>F: 5
    F->>G: 6
    G->>H: 7
    H->>I: 8
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
    };

    const issue = await sequenceDiagramWidthRule.check(diagram, mockMetrics, config);

    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe('error');
  });

  it('should include file path and line number in issue', async () => {
    const diagram = createDiagram(`
sequenceDiagram
    A->>B: 1
    B->>C: 2
    C->>D: 3
    D->>E: 4
    E->>F: 5
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
    };

    const issue = await sequenceDiagramWidthRule.check(diagram, mockMetrics, config);

    expect(issue).not.toBeNull();
    expect(issue?.filePath).toBe('test.md');
    expect(issue?.line).toBe(10);
  });

  it('should include suggestions in issue', async () => {
    const diagram = createDiagram(`
sequenceDiagram
    A->>B: 1
    B->>C: 2
    C->>D: 3
    D->>E: 4
    E->>F: 5
    F->>G: 6
    G->>H: 7
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
    };

    const issue = await sequenceDiagramWidthRule.check(diagram, mockMetrics, config);

    expect(issue).not.toBeNull();
    expect(issue?.suggestion).toContain('Split into multiple sequence diagrams');
    expect(issue?.suggestion).toContain('8 participants');
  });

  it('should not trigger for non-sequence diagrams', async () => {
    const diagram: Diagram = {
      content: 'graph TD\n  A-->B',
      type: 'flowchart',
      filePath: 'test.md',
      startLine: 1,
    };

    const config = {
      enabled: true,
      severity: 'warning' as const,
    };

    const issue = await sequenceDiagramWidthRule.check(diagram, mockMetrics, config);

    expect(issue).toBeNull();
  });

  it('should respect custom thresholds', async () => {
    const diagram = createDiagram(`
sequenceDiagram
    A->>B: 1
    B->>C: 2
    C->>D: 3
    D->>E: 4
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
      thresholds: {
        info: 500,
        warning: 1000,
        error: 1500,
      },
    };

    const issue = await sequenceDiagramWidthRule.check(diagram, mockMetrics, config);

    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe('warning');
  });
});
