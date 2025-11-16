/**
 * JUnit XML reporter - CI/CD compatible test results format
 */

import type { AnalysisResult } from '../analyzers/types';
import type { Issue } from '../rules/types';
import type { Reporter, Summary } from './types';

/**
 * JUnit XML reporter for CI/CD systems
 */
export class JUnitReporter implements Reporter {
  /**
   * Formats analysis results as JUnit XML
   */
  format(results: AnalysisResult[], summary: Summary): string {
    const output: string[] = [];

    output.push('<?xml version="1.0" encoding="UTF-8"?>');
    output.push(
      `<testsuites name="mermaid-sonar" tests="${summary.diagramsAnalyzed}" failures="${summary.errorCount}" errors="${summary.warningCount}" time="${(summary.duration / 1000).toFixed(3)}">`
    );

    // Group results by file
    const resultsByFile = this.groupByFile(results);

    for (const [filePath, fileResults] of Object.entries(resultsByFile)) {
      const testCount = fileResults.length;
      const failures = fileResults.filter((r) =>
        r.issues?.some((i) => i.severity === 'error')
      ).length;

      output.push(
        `  <testsuite name="${this.escapeXml(filePath)}" tests="${testCount}" failures="${failures}" time="${(summary.duration / 1000 / summary.filesAnalyzed).toFixed(3)}">`
      );

      for (const result of fileResults) {
        const testName = `Diagram at line ${result.diagram.startLine}`;
        const className = this.extractClassName(filePath);

        output.push(
          `    <testcase name="${this.escapeXml(testName)}" classname="${this.escapeXml(className)}" time="0">`
        );

        // Add failures for errors
        const errors = result.issues?.filter((i) => i.severity === 'error') ?? [];
        const warnings = result.issues?.filter((i) => i.severity === 'warning') ?? [];

        for (const error of errors) {
          output.push(this.formatFailure(error));
        }

        // Add system-out for warnings and info
        if (warnings.length > 0) {
          output.push('      <system-out>');
          for (const warning of warnings) {
            output.push(`${warning.severity}: ${this.escapeXml(warning.message)}`);
          }
          output.push('      </system-out>');
        }

        output.push('    </testcase>');
      }

      output.push('  </testsuite>');
    }

    output.push('</testsuites>');

    return output.join('\n');
  }

  /**
   * Groups results by file path
   */
  private groupByFile(results: AnalysisResult[]): Record<string, AnalysisResult[]> {
    const grouped: Record<string, AnalysisResult[]> = {};

    for (const result of results) {
      const filePath = result.diagram.filePath;
      if (!grouped[filePath]) {
        grouped[filePath] = [];
      }
      grouped[filePath].push(result);
    }

    return grouped;
  }

  /**
   * Formats a failure element
   */
  private formatFailure(issue: Issue): string {
    const message = this.escapeXml(issue.message);
    const details = issue.suggestion
      ? `${issue.rule}: ${message}\nSuggestion: ${this.escapeXml(issue.suggestion)}`
      : `${issue.rule}: ${message}`;

    return `      <failure message="${message}">${this.escapeXml(details)}</failure>`;
  }

  /**
   * Extracts class name from file path
   */
  private extractClassName(filePath: string): string {
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace(/\.md$/, '');
  }

  /**
   * Escapes special XML characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
