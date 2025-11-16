/**
 * Exit code tests
 */

import { describe, it, expect } from '@jest/globals';
import { determineExitCode, ExitCode } from '../../src/cli/exit-codes';
import type { Summary } from '../../src/reporters/types';

describe('Exit Codes', () => {
  it('should return SUCCESS when no issues', () => {
    const summary: Summary = {
      filesAnalyzed: 1,
      diagramsAnalyzed: 1,
      totalIssues: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      duration: 100,
    };

    expect(determineExitCode(summary)).toBe(ExitCode.SUCCESS);
  });

  it('should return ERRORS_FOUND when errors exist', () => {
    const summary: Summary = {
      filesAnalyzed: 1,
      diagramsAnalyzed: 1,
      totalIssues: 1,
      errorCount: 1,
      warningCount: 0,
      infoCount: 0,
      duration: 100,
    };

    expect(determineExitCode(summary)).toBe(ExitCode.ERRORS_FOUND);
  });

  it('should return SUCCESS for warnings by default', () => {
    const summary: Summary = {
      filesAnalyzed: 1,
      diagramsAnalyzed: 1,
      totalIssues: 1,
      errorCount: 0,
      warningCount: 1,
      infoCount: 0,
      duration: 100,
    };

    expect(determineExitCode(summary)).toBe(ExitCode.SUCCESS);
  });

  it('should return ERRORS_FOUND for warnings in strict mode', () => {
    const summary: Summary = {
      filesAnalyzed: 1,
      diagramsAnalyzed: 1,
      totalIssues: 1,
      errorCount: 0,
      warningCount: 1,
      infoCount: 0,
      duration: 100,
    };

    expect(determineExitCode(summary, { strict: true })).toBe(ExitCode.ERRORS_FOUND);
  });

  it('should return ERRORS_FOUND when max warnings exceeded', () => {
    const summary: Summary = {
      filesAnalyzed: 1,
      diagramsAnalyzed: 1,
      totalIssues: 3,
      errorCount: 0,
      warningCount: 3,
      infoCount: 0,
      duration: 100,
    };

    expect(determineExitCode(summary, { maxWarnings: 2 })).toBe(ExitCode.ERRORS_FOUND);
  });

  it('should return SUCCESS when warnings under max', () => {
    const summary: Summary = {
      filesAnalyzed: 1,
      diagramsAnalyzed: 1,
      totalIssues: 2,
      errorCount: 0,
      warningCount: 2,
      infoCount: 0,
      duration: 100,
    };

    expect(determineExitCode(summary, { maxWarnings: 5 })).toBe(ExitCode.SUCCESS);
  });

  it('should prioritize errors over warning settings', () => {
    const summary: Summary = {
      filesAnalyzed: 1,
      diagramsAnalyzed: 1,
      totalIssues: 2,
      errorCount: 1,
      warningCount: 1,
      infoCount: 0,
      duration: 100,
    };

    // Should return ERRORS_FOUND regardless of strict mode
    expect(determineExitCode(summary, { strict: false })).toBe(ExitCode.ERRORS_FOUND);
  });

  it('should ignore info messages', () => {
    const summary: Summary = {
      filesAnalyzed: 1,
      diagramsAnalyzed: 1,
      totalIssues: 5,
      errorCount: 0,
      warningCount: 0,
      infoCount: 5,
      duration: 100,
    };

    expect(determineExitCode(summary)).toBe(ExitCode.SUCCESS);
    expect(determineExitCode(summary, { strict: true })).toBe(ExitCode.SUCCESS);
  });
});
