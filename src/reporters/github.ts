/**
 * GitHub Actions reporter - workflow annotation format
 */

import type { AnalysisResult } from '../analyzers/types';
import type { Issue } from '../rules/types';
import type { Reporter, Summary } from './types';

/**
 * GitHub Actions reporter for inline PR annotations
 */
export class GitHubReporter implements Reporter {
  /**
   * Formats analysis results as GitHub Actions workflow commands
   */
  format(results: AnalysisResult[], summary: Summary): string {
    const output: string[] = [];

    // Process all issues
    for (const result of results) {
      if (result.issues) {
        for (const issue of result.issues) {
          output.push(this.formatAnnotation(issue));
        }
      }
    }

    // Add summary as notice
    if (summary.totalIssues > 0) {
      output.push(
        `::notice::Mermaid Sonar found ${summary.errorCount} errors, ${summary.warningCount} warnings, ${summary.infoCount} info messages in ${summary.filesAnalyzed} files`
      );
    }

    return output.join('\n');
  }

  /**
   * Formats a single issue as a GitHub Actions annotation
   */
  private formatAnnotation(issue: Issue): string {
    const command = this.severityToCommand(issue.severity);
    const file = issue.filePath;
    const line = issue.line;
    const message = this.escapeAnnotation(issue.message);

    return `::${command} file=${file},line=${line}::${message}`;
  }

  /**
   * Converts severity to GitHub Actions command
   */
  private severityToCommand(severity: string): string {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'notice';
      default:
        return 'notice';
    }
  }

  /**
   * Escapes special characters in annotation messages
   */
  private escapeAnnotation(text: string): string {
    return text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  }
}
