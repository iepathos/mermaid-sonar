/**
 * Reporter tests
 */

import { describe, it, expect } from '@jest/globals';
import type { AnalysisResult } from '../../src/analyzers/types';
import type { Summary } from '../../src/reporters/types';
import {
  ConsoleReporter,
  JSONReporter,
  MarkdownReporter,
  GitHubReporter,
  JUnitReporter,
  generateSummary,
} from '../../src/reporters';

// Test fixtures
const mockResults: AnalysisResult[] = [
  {
    diagram: {
      content: 'graph TD\n  A-->B',
      startLine: 10,
      filePath: 'test.md',
      type: 'graph',
    },
    metrics: {
      nodeCount: 2,
      edgeCount: 1,
      graphDensity: 0.5,
      maxBranchWidth: 1,
      averageDegree: 1.0,
    },
    issues: [
      {
        rule: 'test-rule',
        severity: 'error',
        message: 'Test error message',
        filePath: 'test.md',
        line: 10,
        suggestion: 'Fix this',
      },
    ],
  },
];

const mockSummary: Summary = {
  filesAnalyzed: 1,
  diagramsAnalyzed: 1,
  totalIssues: 1,
  errorCount: 1,
  warningCount: 0,
  infoCount: 0,
  duration: 100,
};

describe('Summary Generation', () => {
  it('should generate correct summary from results', () => {
    const summary = generateSummary(mockResults, 100);

    expect(summary.filesAnalyzed).toBe(1);
    expect(summary.diagramsAnalyzed).toBe(1);
    expect(summary.totalIssues).toBe(1);
    expect(summary.errorCount).toBe(1);
    expect(summary.warningCount).toBe(0);
    expect(summary.infoCount).toBe(0);
    expect(summary.duration).toBe(100);
  });

  it('should handle multiple files', () => {
    const results: AnalysisResult[] = [
      { ...mockResults[0], diagram: { ...mockResults[0].diagram, filePath: 'file1.md' } },
      { ...mockResults[0], diagram: { ...mockResults[0].diagram, filePath: 'file2.md' } },
    ];

    const summary = generateSummary(results, 200);

    expect(summary.filesAnalyzed).toBe(2);
    expect(summary.diagramsAnalyzed).toBe(2);
  });

  it('should count different severity levels', () => {
    const results: AnalysisResult[] = [
      {
        ...mockResults[0],
        issues: [
          { ...mockResults[0].issues![0], severity: 'error' },
          { ...mockResults[0].issues![0], severity: 'warning' },
          { ...mockResults[0].issues![0], severity: 'info' },
        ],
      },
    ];

    const summary = generateSummary(results, 100);

    expect(summary.errorCount).toBe(1);
    expect(summary.warningCount).toBe(1);
    expect(summary.infoCount).toBe(1);
    expect(summary.totalIssues).toBe(3);
  });
});

describe('ConsoleReporter', () => {
  it('should format results for console output', () => {
    const reporter = new ConsoleReporter();
    const output = reporter.format(mockResults, mockSummary);

    expect(output).toContain('test.md');
    expect(output).toContain('10:1');
    expect(output).toContain('error');
    expect(output).toContain('Test error message');
  });

  it('should show summary statistics', () => {
    const reporter = new ConsoleReporter();
    const output = reporter.format(mockResults, mockSummary);

    expect(output).toContain('1 file analyzed');
    expect(output).toContain('1 diagram');
    expect(output).toContain('1 error');
  });
});

describe('JSONReporter', () => {
  it('should format results as valid JSON', () => {
    const reporter = new JSONReporter('1.0.0');
    const output = reporter.format(mockResults, mockSummary);

    const parsed = JSON.parse(output);

    expect(parsed.version).toBe('1.0.0');
    expect(parsed.summary).toEqual(mockSummary);
    expect(parsed.results).toEqual(mockResults);
  });

  it('should include all required fields', () => {
    const reporter = new JSONReporter('1.0.0');
    const output = reporter.format(mockResults, mockSummary);

    const parsed = JSON.parse(output);

    expect(parsed).toHaveProperty('summary');
    expect(parsed).toHaveProperty('results');
    expect(parsed).toHaveProperty('version');
  });
});

describe('MarkdownReporter', () => {
  it('should format results as Markdown', () => {
    const reporter = new MarkdownReporter();
    const output = reporter.format(mockResults, mockSummary);

    expect(output).toContain('# Mermaid Diagram Analysis Report');
    expect(output).toContain('## Summary');
    expect(output).toContain('## Issues Found');
    expect(output).toContain('## Diagram Metrics');
  });

  it('should include issue table', () => {
    const reporter = new MarkdownReporter();
    const output = reporter.format(mockResults, mockSummary);

    expect(output).toContain('| Line | Severity | Rule | Message |');
    expect(output).toContain('| 10 | error | test-rule |');
  });

  it('should include metrics table', () => {
    const reporter = new MarkdownReporter();
    const output = reporter.format(mockResults, mockSummary);

    expect(output).toContain('| Metric | Value |');
    expect(output).toContain('| Nodes | 2 |');
    expect(output).toContain('| Edges | 1 |');
  });

  it('should escape special characters', () => {
    const results: AnalysisResult[] = [
      {
        ...mockResults[0],
        issues: [
          {
            ...mockResults[0].issues![0],
            message: 'Message with | pipe',
          },
        ],
      },
    ];

    const reporter = new MarkdownReporter();
    const output = reporter.format(results, mockSummary);

    expect(output).toContain('\\|');
  });
});

describe('GitHubReporter', () => {
  it('should format results as GitHub Actions annotations', () => {
    const reporter = new GitHubReporter();
    const output = reporter.format(mockResults, mockSummary);

    expect(output).toContain('::error file=test.md,line=10::Test error message');
  });

  it('should convert severity levels correctly', () => {
    const results: AnalysisResult[] = [
      {
        ...mockResults[0],
        issues: [
          { ...mockResults[0].issues![0], severity: 'error' },
          { ...mockResults[0].issues![0], severity: 'warning' },
          { ...mockResults[0].issues![0], severity: 'info' },
        ],
      },
    ];

    const reporter = new GitHubReporter();
    const output = reporter.format(results, {
      ...mockSummary,
      totalIssues: 3,
      warningCount: 1,
      infoCount: 1,
    });

    expect(output).toContain('::error');
    expect(output).toContain('::warning');
    expect(output).toContain('::notice');
  });

  it('should include summary notice', () => {
    const reporter = new GitHubReporter();
    const output = reporter.format(mockResults, mockSummary);

    expect(output).toContain('::notice::Mermaid Sonar found');
  });
});

describe('JUnitReporter', () => {
  it('should format results as valid XML', () => {
    const reporter = new JUnitReporter();
    const output = reporter.format(mockResults, mockSummary);

    expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(output).toContain('<testsuites');
    expect(output).toContain('</testsuites>');
  });

  it('should include test suite for each file', () => {
    const reporter = new JUnitReporter();
    const output = reporter.format(mockResults, mockSummary);

    expect(output).toContain('<testsuite name="test.md"');
    expect(output).toContain('</testsuite>');
  });

  it('should include test cases for diagrams', () => {
    const reporter = new JUnitReporter();
    const output = reporter.format(mockResults, mockSummary);

    expect(output).toContain('<testcase name="Diagram at line 10"');
  });

  it('should include failures for errors', () => {
    const reporter = new JUnitReporter();
    const output = reporter.format(mockResults, mockSummary);

    expect(output).toContain('<failure message="Test error message">');
  });

  it('should escape XML special characters', () => {
    const results: AnalysisResult[] = [
      {
        ...mockResults[0],
        issues: [
          {
            ...mockResults[0].issues![0],
            message: 'Error with <tags> & "quotes"',
          },
        ],
      },
    ];

    const reporter = new JUnitReporter();
    const output = reporter.format(results, mockSummary);

    expect(output).toContain('&lt;');
    expect(output).toContain('&gt;');
    expect(output).toContain('&amp;');
    expect(output).toContain('&quot;');
  });
});
