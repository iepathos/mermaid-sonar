/**
 * Markdown reporter - human-readable report format
 */

import type { AnalysisResult } from '../analyzers/types';
import type { Issue } from '../rules/types';
import type { Reporter, Summary } from './types';

/**
 * Markdown reporter for generating readable reports
 */
export class MarkdownReporter implements Reporter {
  /**
   * Formats analysis results as Markdown
   */
  format(results: AnalysisResult[], summary: Summary): string {
    const output: string[] = [];

    // Title
    output.push('# Mermaid Diagram Analysis Report\n');

    // Summary section
    output.push('## Summary\n');
    output.push(`- **Files Analyzed**: ${summary.filesAnalyzed}`);
    output.push(`- **Diagrams Found**: ${summary.diagramsAnalyzed}`);
    output.push(`- **Total Issues**: ${summary.totalIssues}`);
    output.push(`  - Errors: ${summary.errorCount}`);
    output.push(`  - Warnings: ${summary.warningCount}`);
    output.push(`  - Info: ${summary.infoCount}`);
    output.push(`- **Analysis Duration**: ${summary.duration}ms\n`);

    // Issues by file
    if (summary.totalIssues > 0) {
      output.push('## Issues Found\n');

      const resultsByFile = this.groupByFile(results);

      for (const [filePath, fileResults] of Object.entries(resultsByFile)) {
        const allIssues = fileResults.flatMap((r) => r.issues ?? []);

        if (allIssues.length > 0) {
          output.push(`### ${filePath}\n`);
          output.push('| Line | Severity | Rule | Message |');
          output.push('|------|----------|------|---------|');

          for (const issue of allIssues) {
            output.push(this.formatIssueRow(issue));
          }

          output.push('');
        }
      }
    } else {
      output.push('## Issues Found\n');
      output.push('No issues found.\n');
    }

    // Diagram metrics
    output.push('## Diagram Metrics\n');

    const resultsByFile = this.groupByFile(results);

    for (const [filePath, fileResults] of Object.entries(resultsByFile)) {
      output.push(`### ${filePath}\n`);

      for (const result of fileResults) {
        output.push(`**Diagram at line ${result.diagram.startLine}**\n`);
        output.push('| Metric | Value |');
        output.push('|--------|-------|');
        output.push(`| Nodes | ${result.metrics.nodeCount} |`);
        output.push(`| Edges | ${result.metrics.edgeCount} |`);
        output.push(`| Density | ${result.metrics.graphDensity.toFixed(3)} |`);
        output.push(`| Max Branch Width | ${result.metrics.maxBranchWidth} |`);
        output.push(`| Average Degree | ${result.metrics.averageDegree.toFixed(2)} |`);
        output.push('');
      }
    }

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
   * Formats a single issue as a table row
   */
  private formatIssueRow(issue: Issue): string {
    return `| ${issue.line} | ${issue.severity} | ${issue.rule} | ${this.escapeMarkdown(issue.message)} |`;
  }

  /**
   * Escapes special Markdown characters in text
   */
  private escapeMarkdown(text: string): string {
    return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  }
}
