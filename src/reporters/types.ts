/**
 * Reporter types and interfaces
 *
 * Defines the output formats and reporter interface for analysis results
 */

import type { AnalysisResult } from '../analyzers/types';

/**
 * Supported output formats
 */
export type OutputFormat = 'console' | 'json' | 'markdown' | 'github' | 'junit';

/**
 * Summary statistics for analysis results
 */
export interface Summary {
  /** Number of files analyzed */
  filesAnalyzed: number;
  /** Number of diagrams analyzed */
  diagramsAnalyzed: number;
  /** Total number of issues found */
  totalIssues: number;
  /** Number of error-level issues */
  errorCount: number;
  /** Number of warning-level issues */
  warningCount: number;
  /** Number of info-level issues */
  infoCount: number;
  /** Analysis duration in milliseconds */
  duration: number;
}

/**
 * Reporter interface - all output formatters must implement this
 */
export interface Reporter {
  /**
   * Formats analysis results into the reporter's output format
   *
   * @param results - Array of analysis results
   * @param summary - Summary statistics
   * @returns Formatted output string
   */
  format(results: AnalysisResult[], summary: Summary): string;
}
