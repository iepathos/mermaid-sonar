/**
 * Summary statistics generation for analysis results
 */

import type { AnalysisResult } from '../analyzers/types';
import type { Summary } from './types';

/**
 * Generates summary statistics from analysis results
 *
 * @param results - Array of analysis results
 * @param duration - Analysis duration in milliseconds
 * @returns Summary statistics
 */
export function generateSummary(results: AnalysisResult[], duration: number = 0): Summary {
  const filesAnalyzed = new Set(results.map((r) => r.diagram.filePath)).size;
  const diagramsAnalyzed = results.length;

  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const result of results) {
    if (result.issues) {
      for (const issue of result.issues) {
        switch (issue.severity) {
          case 'error':
            errorCount++;
            break;
          case 'warning':
            warningCount++;
            break;
          case 'info':
            infoCount++;
            break;
        }
      }
    }
  }

  const totalIssues = errorCount + warningCount + infoCount;

  return {
    filesAnalyzed,
    diagramsAnalyzed,
    totalIssues,
    errorCount,
    warningCount,
    infoCount,
    duration,
  };
}
