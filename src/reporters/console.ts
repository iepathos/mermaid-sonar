/**
 * Console reporter - colorized terminal output
 */

import chalk from 'chalk';
import type { AnalysisResult } from '../analyzers/types';
import type { Issue } from '../rules/types';
import type { Reporter, Summary } from './types';

/**
 * Console reporter for human-readable terminal output with colors
 */
export class ConsoleReporter implements Reporter {
  /**
   * Formats analysis results for terminal output
   */
  format(results: AnalysisResult[], summary: Summary): string {
    const output: string[] = [];

    // Group results by file
    const resultsByFile = this.groupByFile(results);

    // Output each file
    for (const [filePath, fileResults] of Object.entries(resultsByFile)) {
      output.push(chalk.bold(filePath));

      for (const result of fileResults) {
        if (result.issues && result.issues.length > 0) {
          for (const issue of result.issues) {
            output.push(this.formatIssue(issue));
          }
        } else {
          output.push(chalk.green('  ✓ No issues found'));
        }
      }

      output.push(''); // Blank line between files
    }

    // Add summary
    output.push(this.formatSummary(summary));

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
   * Formats a single issue for terminal output
   */
  private formatIssue(issue: Issue): string {
    const severityColors = {
      error: chalk.red,
      warning: chalk.yellow,
      info: chalk.blue,
    };

    const color = severityColors[issue.severity];
    const line = `${issue.line}:1`;

    return `  ${line}  ${color(issue.severity.padEnd(7))}  ${issue.message}  ${chalk.dim(issue.rule)}`;
  }

  /**
   * Formats summary statistics
   */
  private formatSummary(summary: Summary): string {
    const parts: string[] = [];

    parts.push(
      chalk.dim(
        `${summary.filesAnalyzed} ${summary.filesAnalyzed === 1 ? 'file' : 'files'} analyzed`
      )
    );
    parts.push(
      chalk.dim(
        `${summary.diagramsAnalyzed} ${summary.diagramsAnalyzed === 1 ? 'diagram' : 'diagrams'} found`
      )
    );

    if (summary.totalIssues > 0) {
      const issuesParts: string[] = [];

      if (summary.errorCount > 0) {
        issuesParts.push(
          chalk.red(`${summary.errorCount} error${summary.errorCount === 1 ? '' : 's'}`)
        );
      }
      if (summary.warningCount > 0) {
        issuesParts.push(
          chalk.yellow(`${summary.warningCount} warning${summary.warningCount === 1 ? '' : 's'}`)
        );
      }
      if (summary.infoCount > 0) {
        issuesParts.push(chalk.blue(`${summary.infoCount} info`));
      }

      parts.push(issuesParts.join(', '));
    }

    return parts.join(', ');
  }
}
