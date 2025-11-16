/**
 * Exit code constants and utilities for CLI
 */

import type { Summary } from '../reporters/types';

/**
 * Exit codes for CLI
 */
export const ExitCode = {
  /** Success - no issues found */
  SUCCESS: 0,
  /** Errors found during analysis */
  ERRORS_FOUND: 1,
  /** Execution failure (invalid args, file not found, etc.) */
  EXECUTION_FAILURE: 2,
} as const;

/**
 * CLI options affecting exit code behavior
 */
export interface ExitCodeOptions {
  /** Treat warnings as errors */
  strict?: boolean;
  /** Maximum number of warnings before failing */
  maxWarnings?: number;
}

/**
 * Determines the appropriate exit code based on analysis results
 *
 * @param summary - Analysis summary
 * @param options - Exit code behavior options
 * @returns Exit code
 */
export function determineExitCode(summary: Summary, options: ExitCodeOptions = {}): number {
  const { strict = false, maxWarnings } = options;

  // Always fail on errors
  if (summary.errorCount > 0) {
    return ExitCode.ERRORS_FOUND;
  }

  // Fail on warnings in strict mode
  if (strict && summary.warningCount > 0) {
    return ExitCode.ERRORS_FOUND;
  }

  // Fail if max warnings exceeded
  if (maxWarnings !== undefined && summary.warningCount > maxWarnings) {
    return ExitCode.ERRORS_FOUND;
  }

  return ExitCode.SUCCESS;
}
