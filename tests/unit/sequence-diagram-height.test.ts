/**
 * Unit tests for sequence diagram height rule
 */

import { sequenceDiagramHeightRule } from '../../src/rules/sequence-diagram-height';
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

describe('Sequence Diagram Height Rule', () => {
  it('should not trigger for diagrams with few messages', async () => {
    const diagram = createDiagram(`
sequenceDiagram
    Alice->>Bob: Message 1
    Bob-->>Alice: Message 2
    Alice->>Bob: Message 3
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
    };

    const issue = await sequenceDiagramHeightRule.check(diagram, mockMetrics, config);

    expect(issue).toBeNull();
  });

  it('should trigger info level for ~25 messages', async () => {
    const messages = Array.from({ length: 25 }, (_, i) => `    Alice->>Bob: Message ${i + 1}`).join(
      '\n'
    );
    const diagram = createDiagram(`
sequenceDiagram
${messages}
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
    };

    const issue = await sequenceDiagramHeightRule.check(diagram, mockMetrics, config);

    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe('info');
    expect(issue?.message).toContain('25 messages');
  });

  it('should trigger warning for ~35 messages', async () => {
    const messages = Array.from({ length: 35 }, (_, i) => `    Alice->>Bob: Message ${i + 1}`).join(
      '\n'
    );
    const diagram = createDiagram(`
sequenceDiagram
${messages}
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
    };

    const issue = await sequenceDiagramHeightRule.check(diagram, mockMetrics, config);

    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe('warning');
  });

  it('should trigger error for 50+ messages', async () => {
    const messages = Array.from({ length: 50 }, (_, i) => `    Alice->>Bob: Message ${i + 1}`).join(
      '\n'
    );
    const diagram = createDiagram(`
sequenceDiagram
${messages}
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
    };

    const issue = await sequenceDiagramHeightRule.check(diagram, mockMetrics, config);

    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe('error');
  });

  it('should account for loop blocks in height', async () => {
    const diagram = createDiagram(`
sequenceDiagram
    loop Every minute
        Alice->>Bob: Ping
    end
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
      thresholds: {
        info: 100,
        warning: 200,
        error: 300,
      },
    };

    const issue = await sequenceDiagramHeightRule.check(diagram, mockMetrics, config);

    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe('info');
  });

  it('should account for nested structures', async () => {
    const diagram = createDiagram(`
sequenceDiagram
    loop Outer
        alt Condition
            Alice->>Bob: Message
        end
    end
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
      thresholds: {
        info: 150,
        warning: 250,
        error: 350,
      },
    };

    const issue = await sequenceDiagramHeightRule.check(diagram, mockMetrics, config);

    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe('warning');
  });

  it('should include suggestions for loops', async () => {
    const diagram = createDiagram(`
sequenceDiagram
    loop Every second
        Alice->>Bob: Ping
    end
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
      thresholds: {
        info: 100,
        warning: 200,
        error: 300,
      },
    };

    const issue = await sequenceDiagramHeightRule.check(diagram, mockMetrics, config);

    expect(issue).not.toBeNull();
    expect(issue?.suggestion).toContain('loop blocks');
  });

  it('should include suggestions for alt blocks', async () => {
    const diagram = createDiagram(`
sequenceDiagram
    alt Success
        Alice->>Bob: OK
    else Failure
        Alice->>Bob: Error
    end
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
      thresholds: {
        info: 100,
        warning: 200,
        error: 300,
      },
    };

    const issue = await sequenceDiagramHeightRule.check(diagram, mockMetrics, config);

    expect(issue).not.toBeNull();
    expect(issue?.suggestion).toContain('alt/else branches');
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

    const issue = await sequenceDiagramHeightRule.check(diagram, mockMetrics, config);

    expect(issue).toBeNull();
  });

  it('should respect custom thresholds', async () => {
    const diagram = createDiagram(`
sequenceDiagram
    Alice->>Bob: Message 1
    Bob-->>Alice: Message 2
    Alice->>Bob: Message 3
    Bob-->>Alice: Message 4
`);

    const config = {
      enabled: true,
      severity: 'warning' as const,
      thresholds: {
        info: 100,
        warning: 200,
        error: 300,
      },
    };

    const issue = await sequenceDiagramHeightRule.check(diagram, mockMetrics, config);

    expect(issue).not.toBeNull();
    expect(issue?.severity).toBe('warning');
  });
});
