/**
 * Rule Registry
 *
 * Central registry for all validation rules
 */

import type { Rule, Issue } from './types';
import type { Diagram } from '../extractors/types';
import type { Metrics } from '../analyzers/types';
import type { Config } from '../config/types';

import { maxEdgesRule } from './max-edges';
import { maxNodesHighDensityRule, maxNodesLowDensityRule } from './cognitive-load';
import { cyclomaticComplexityRule } from './cyclomatic-complexity';
import { layoutHintRule } from './layout-hint';
import { longLabelsRule } from './long-labels';
import { reservedWordsRule } from './reserved-words';
import { disconnectedRule } from './disconnected';
import { syntaxValidationRule } from './syntax-validation';

/**
 * Registry of all available rules
 */
const ruleRegistry = new Map<string, Rule>([
  [syntaxValidationRule.name, syntaxValidationRule], // Run syntax validation first (fail fast)
  [maxEdgesRule.name, maxEdgesRule],
  [maxNodesHighDensityRule.name, maxNodesHighDensityRule],
  [maxNodesLowDensityRule.name, maxNodesLowDensityRule],
  [cyclomaticComplexityRule.name, cyclomaticComplexityRule],
  [layoutHintRule.name, layoutHintRule],
  [longLabelsRule.name, longLabelsRule],
  [reservedWordsRule.name, reservedWordsRule],
  [disconnectedRule.name, disconnectedRule],
]);

/**
 * Gets a rule by name
 *
 * @param name - Rule name
 * @returns Rule implementation or undefined
 */
export function getRule(name: string): Rule | undefined {
  return ruleRegistry.get(name);
}

/**
 * Gets all registered rules
 *
 * @returns Array of all rules
 */
export function getAllRules(): Rule[] {
  return Array.from(ruleRegistry.values());
}

/**
 * Runs all enabled rules against a diagram
 *
 * @param diagram - Diagram to check
 * @param metrics - Pre-calculated metrics
 * @param config - Configuration with rule settings
 * @returns Promise of array of issues found
 */
export async function runRules(
  diagram: Diagram,
  metrics: Metrics,
  config: Config
): Promise<Issue[]> {
  const issues: Issue[] = [];

  for (const [ruleName, rule] of ruleRegistry) {
    const ruleConfig = config.rules[ruleName as keyof typeof config.rules];

    // Skip disabled rules
    if (!ruleConfig || !ruleConfig.enabled) {
      continue;
    }

    // Support both sync and async rules
    const issue = await rule.check(diagram, metrics, ruleConfig);

    if (issue) {
      issues.push(issue);
    }
  }

  return issues;
}

// Re-export types
export type { Rule, Issue, RuleConfig, Severity } from './types';
