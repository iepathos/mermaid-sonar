/**
 * Reporter module - output formatting for analysis results
 */

import type { Reporter, OutputFormat } from './types';
import { ConsoleReporter } from './console';
import { JSONReporter } from './json';
import { MarkdownReporter } from './markdown';
import { GitHubReporter } from './github';
import { JUnitReporter } from './junit';

// Re-export types
export type { Reporter, OutputFormat, Summary } from './types';
export type { JSONOutput } from './json';

// Re-export reporters
export { ConsoleReporter } from './console';
export { JSONReporter } from './json';
export { MarkdownReporter } from './markdown';
export { GitHubReporter } from './github';
export { JUnitReporter } from './junit';

// Re-export utilities
export { generateSummary } from './summary';

/**
 * Creates a reporter for the specified output format
 *
 * @param format - Output format
 * @param version - Package version (for JSON output)
 * @returns Reporter instance
 */
export function createReporter(format: OutputFormat, version?: string): Reporter {
  switch (format) {
    case 'console':
      return new ConsoleReporter();
    case 'json':
      return new JSONReporter(version);
    case 'markdown':
      return new MarkdownReporter();
    case 'github':
      return new GitHubReporter();
    case 'junit':
      return new JUnitReporter();
    default:
      throw new Error(`Unknown output format: ${format}`);
  }
}
