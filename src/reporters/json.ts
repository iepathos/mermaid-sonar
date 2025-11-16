/**
 * JSON reporter - machine-readable structured output
 */

import type { AnalysisResult } from '../analyzers/types';
import type { Reporter, Summary } from './types';

/**
 * JSON output structure
 */
export interface JSONOutput {
  summary: Summary;
  results: AnalysisResult[];
  version: string;
}

/**
 * JSON reporter for machine-readable output
 */
export class JSONReporter implements Reporter {
  private version: string;

  constructor(version: string = '0.1.0') {
    this.version = version;
  }

  /**
   * Formats analysis results as JSON
   */
  format(results: AnalysisResult[], summary: Summary): string {
    const output: JSONOutput = {
      summary,
      results,
      version: this.version,
    };

    return JSON.stringify(output, null, 2);
  }
}
