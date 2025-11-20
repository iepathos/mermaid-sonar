/**
 * Configuration type definitions
 *
 * Defines the structure of mermaid-sonar configuration files
 */

import type { RuleConfig } from '../rules/types';

/**
 * Viewport profile for different rendering contexts
 */
export interface ViewportProfile {
  /** Profile name */
  name: string;
  /** Optional description of the profile */
  description?: string;
  /** Maximum width in pixels - diagrams exceeding this will ERROR */
  maxWidth: number;
  /** Maximum height in pixels - diagrams exceeding this will ERROR */
  maxHeight: number;
  /** Optional granular thresholds for info/warning levels */
  widthThresholds?: {
    info?: number;
    warning?: number;
    error?: number; // Should match maxWidth if specified
  };
  /** Optional granular thresholds for info/warning levels */
  heightThresholds?: {
    info?: number;
    warning?: number;
    error?: number; // Should match maxHeight if specified
  };
}

/**
 * Viewport configuration
 */
export interface ViewportConfig {
  /** Active profile name */
  profile?: string;
  /** Named viewport profiles */
  profiles?: Record<string, ViewportProfile>;
  /** Direct overrides (takes precedence over profile) - sets ERROR threshold */
  maxWidth?: number;
  /** Direct overrides (takes precedence over profile) - sets ERROR threshold */
  maxHeight?: number;
}

/**
 * Complete mermaid-sonar configuration
 */
export interface Config {
  /** Rule configurations */
  rules: {
    'syntax-validation': RuleConfig;
    'max-edges': RuleConfig;
    'max-nodes-high-density': RuleConfig;
    'max-nodes-low-density': RuleConfig;
    'cyclomatic-complexity': RuleConfig;
    'layout-hint': RuleConfig;
    'horizontal-chain-too-long': RuleConfig;
    'horizontal-width-readability': RuleConfig;
    'vertical-height-readability': RuleConfig;
    'class-diagram-width': RuleConfig;
    'long-labels': RuleConfig;
    'reserved-words': RuleConfig;
    'disconnected-components': RuleConfig;
  };
  /** Viewport configuration */
  viewport?: ViewportConfig;
}

/**
 * Partial configuration (user-provided overrides)
 */
export type PartialConfig = {
  rules?: Partial<Config['rules']>;
  viewport?: ViewportConfig;
};
