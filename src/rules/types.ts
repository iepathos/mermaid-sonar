/**
 * Rule system types and interfaces
 *
 * Defines the core types for the pluggable rule system that validates
 * diagram complexity against research-backed heuristics.
 */

import type { Metrics } from '../analyzers/types';
import type { Diagram } from '../extractors/types';

/**
 * Severity levels for rule violations
 */
export type Severity = 'error' | 'warning' | 'info';

/**
 * Issue detected by a rule
 */
export interface Issue {
  /** Rule identifier that triggered this issue */
  rule: string;
  /** Severity level */
  severity: Severity;
  /** Human-readable message */
  message: string;
  /** Source file path */
  filePath: string;
  /** Line number in source file */
  line: number;
  /** Actionable suggestion for fixing */
  suggestion?: string;
  /** Research citation with URL */
  citation?: string;
}

/**
 * Configuration for a single rule
 */
export interface RuleConfig {
  /** Whether this rule is enabled */
  enabled: boolean;
  /** Override default severity */
  severity?: Severity;
  /** Override default threshold */
  threshold?: number;
  /** Additional rule-specific configuration */
  [key: string]: unknown;
}

/**
 * Rule interface - all rules must implement this
 */
export interface Rule {
  /** Unique rule identifier */
  name: string;
  /** Default severity level */
  defaultSeverity: Severity;
  /** Default threshold value (if applicable) */
  defaultThreshold?: number;
  /** Check if rule is violated (supports both sync and async) */
  check(
    diagram: Diagram,
    metrics: Metrics,
    config: RuleConfig
  ): Issue | null | Promise<Issue | null>;
}

/**
 * Context passed to rule check functions
 */
export interface RuleContext {
  diagram: Diagram;
  metrics: Metrics;
  config: RuleConfig;
}
