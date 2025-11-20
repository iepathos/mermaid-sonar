/**
 * Rule Registry
 *
 * Central registry for all validation rules
 */

import type { Rule, Issue } from './types';
import type { Diagram } from '../extractors/types';
import type { Metrics } from '../analyzers/types';
import type { Config } from '../config/types';
import { resolveViewportConfig } from '../config/viewport-resolver';

import { maxEdgesRule } from './max-edges';
import { maxNodesHighDensityRule, maxNodesLowDensityRule } from './cognitive-load';
import { cyclomaticComplexityRule } from './cyclomatic-complexity';
import { layoutHintRule } from './layout-hint';
import { longLabelsRule } from './long-labels';
import { reservedWordsRule } from './reserved-words';
import { disconnectedRule } from './disconnected';
import { syntaxValidationRule } from './syntax-validation';
import { horizontalChainLengthRule } from './horizontal-chain-length';
import { horizontalWidthReadabilityRule } from './horizontal-width-readability';
import { verticalHeightReadabilityRule } from './vertical-height-readability';
import { classDiagramWidthRule } from './class-diagram-width';

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
  [horizontalChainLengthRule.name, horizontalChainLengthRule],
  [horizontalWidthReadabilityRule.name, horizontalWidthReadabilityRule],
  [verticalHeightReadabilityRule.name, verticalHeightReadabilityRule],
  [classDiagramWidthRule.name, classDiagramWidthRule],
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

  // Only resolve viewport config if viewport configuration exists
  const hasViewportConfig =
    config.viewport &&
    (config.viewport.profile ||
      config.viewport.maxWidth ||
      config.viewport.maxHeight ||
      config.viewport.profiles);

  const viewportConfig = hasViewportConfig
    ? resolveViewportConfig(config.viewport, undefined, undefined)
    : null;

  for (const [ruleName, rule] of ruleRegistry) {
    let ruleConfig = config.rules[ruleName as keyof typeof config.rules];

    // Skip disabled rules
    if (!ruleConfig || !ruleConfig.enabled) {
      continue;
    }

    // Apply viewport configuration to width/height rules only if viewport config exists
    if (
      viewportConfig &&
      (ruleName === 'horizontal-width-readability' || ruleName === 'vertical-height-readability')
    ) {
      const isWidth = ruleName === 'horizontal-width-readability';
      const thresholds = isWidth ? viewportConfig.widthThresholds : viewportConfig.heightThresholds;

      ruleConfig = {
        ...ruleConfig,
        targetWidth: isWidth ? viewportConfig.maxWidth : (ruleConfig.targetWidth as number),
        targetHeight: isWidth ? (ruleConfig.targetHeight as number) : viewportConfig.maxHeight,
        thresholds: {
          info: thresholds.info,
          warning: thresholds.warning,
          error: thresholds.error,
        },
      };
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
