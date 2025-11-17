/**
 * Configuration type definitions
 *
 * Defines the structure of mermaid-sonar configuration files
 */

import type { RuleConfig } from '../rules/types';

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
    'long-labels': RuleConfig;
    'reserved-words': RuleConfig;
    'disconnected-components': RuleConfig;
  };
}

/**
 * Partial configuration (user-provided overrides)
 */
export type PartialConfig = {
  rules?: Partial<Config['rules']>;
};
