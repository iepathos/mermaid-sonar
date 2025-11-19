/**
 * Viewport configuration resolution
 *
 * Handles the priority order for resolving viewport constraints from
 * CLI flags, config files, profiles, and defaults.
 */

import type { ViewportProfile, ViewportConfig } from './types';
import type { RuleConfig } from '../rules/types';
import { getBuiltInProfile, getDefaultProfile } from './viewport-profiles';

/**
 * Resolved viewport configuration passed to rules
 */
export interface ResolvedViewportConfig {
  /** Maximum allowed width - diagrams exceeding this will ERROR */
  maxWidth: number;
  /** Maximum allowed height - diagrams exceeding this will ERROR */
  maxHeight: number;
  /** Granular thresholds for progressive severity levels */
  widthThresholds: {
    info: number; // Diagram approaching width limit
    warning: number; // Diagram significantly wide
    error: number; // Diagram exceeds max width (same as maxWidth)
  };
  /** Granular thresholds for progressive severity levels */
  heightThresholds: {
    info: number; // Diagram approaching height limit
    warning: number; // Diagram significantly tall
    error: number; // Diagram exceeds max height (same as maxHeight)
  };
  /** Source of the configuration for debugging */
  source: 'cli' | 'config-direct' | 'profile' | 'rule' | 'default';
}

/**
 * CLI viewport options
 */
export interface CliViewportOptions {
  viewportProfile?: string;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Resolve viewport configuration from all sources
 *
 * Priority order (highest to lowest):
 * 1. CLI flags (--max-width, --max-height)
 * 2. Config file direct overrides (viewport.maxWidth, viewport.maxHeight)
 * 3. Selected profile (viewport.profile or --viewport-profile)
 * 4. Rule-level configuration (backward compatibility)
 * 5. Default profile
 */
export function resolveViewportConfig(
  viewportConfig: ViewportConfig | undefined,
  cliOptions: CliViewportOptions | undefined,
  _ruleConfig?: RuleConfig | undefined
): ResolvedViewportConfig {
  // Start with default profile
  let profile: ViewportProfile = getDefaultProfile();
  let source: ResolvedViewportConfig['source'] = 'default';

  // Try to get profile from config or CLI
  const profileName = cliOptions?.viewportProfile ?? viewportConfig?.profile;
  if (profileName) {
    const builtInProfile = getBuiltInProfile(profileName);
    if (builtInProfile) {
      profile = builtInProfile;
      source = 'profile';
    } else if (viewportConfig?.profiles?.[profileName]) {
      profile = viewportConfig.profiles[profileName];
      source = 'profile';
    }
  }

  // Apply config direct overrides
  if (viewportConfig?.maxWidth !== undefined || viewportConfig?.maxHeight !== undefined) {
    profile = {
      ...profile,
      maxWidth: viewportConfig.maxWidth ?? profile.maxWidth,
      maxHeight: viewportConfig.maxHeight ?? profile.maxHeight,
    };
    source = 'config-direct';
  }

  // Apply CLI overrides (highest priority)
  if (cliOptions?.maxWidth !== undefined || cliOptions?.maxHeight !== undefined) {
    profile = {
      ...profile,
      maxWidth: cliOptions.maxWidth ?? profile.maxWidth,
      maxHeight: cliOptions.maxHeight ?? profile.maxHeight,
    };
    source = 'cli';
  }

  // Build final resolved config
  // Note: error thresholds ALWAYS match maxWidth/maxHeight
  const resolved: ResolvedViewportConfig = {
    maxWidth: profile.maxWidth,
    maxHeight: profile.maxHeight,
    widthThresholds: {
      info: profile.widthThresholds?.info ?? Math.round(profile.maxWidth * 0.6),
      warning: profile.widthThresholds?.warning ?? Math.round(profile.maxWidth * 0.8),
      error: profile.maxWidth, // Always matches maxWidth
    },
    heightThresholds: {
      info: profile.heightThresholds?.info ?? Math.round(profile.maxHeight * 0.6),
      warning: profile.heightThresholds?.warning ?? Math.round(profile.maxHeight * 0.8),
      error: profile.maxHeight, // Always matches maxHeight
    },
    source,
  };

  return resolved;
}

/**
 * Apply viewport configuration to rule config
 *
 * Updates the rule config with viewport-resolved values for backward compatibility
 */
export function applyViewportToRuleConfig(
  ruleConfig: RuleConfig,
  viewportConfig: ViewportConfig | undefined,
  cliOptions: CliViewportOptions | undefined
): RuleConfig {
  const resolved = resolveViewportConfig(viewportConfig, cliOptions, ruleConfig);

  return {
    ...ruleConfig,
    // Keep existing rule-level config but allow viewport to override
    targetWidth: resolved.maxWidth,
    targetHeight: resolved.maxHeight,
    thresholds: {
      ...((ruleConfig.thresholds as object) ?? {}),
      ...resolved.widthThresholds,
    },
  };
}
