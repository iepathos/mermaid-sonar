/**
 * Configuration file loader
 *
 * Uses cosmiconfig to discover and load configuration from:
 * - .sonarrc.json
 * - .sonarrc.yml / .sonarrc.yaml
 * - package.json (mermaid-sonar field)
 */

import { cosmiconfig } from 'cosmiconfig';
import { defaultConfig } from './defaults';
import type { Config, PartialConfig } from './types';

const explorer = cosmiconfig('sonar', {
  searchPlaces: ['.sonarrc.json', '.sonarrc.yml', '.sonarrc.yaml', 'package.json'],
  cache: false, // Disable caching for testing
});

/**
 * Validates viewport configuration values
 *
 * @param config - User-provided configuration to validate
 * @throws Error if configuration is invalid
 */
function validateViewportConfig(config: PartialConfig): void {
  const viewport = config.viewport;
  if (!viewport) {
    return;
  }

  // Validate direct maxWidth/maxHeight overrides
  if (viewport.maxWidth !== undefined) {
    if (typeof viewport.maxWidth !== 'number' || viewport.maxWidth <= 0) {
      throw new Error(
        `Invalid viewport.maxWidth: must be a positive number, got ${viewport.maxWidth}`
      );
    }
  }

  if (viewport.maxHeight !== undefined) {
    if (typeof viewport.maxHeight !== 'number' || viewport.maxHeight <= 0) {
      throw new Error(
        `Invalid viewport.maxHeight: must be a positive number, got ${viewport.maxHeight}`
      );
    }
  }

  // Validate custom profiles
  if (viewport.profiles) {
    for (const [profileName, profile] of Object.entries(viewport.profiles)) {
      if (typeof profile.maxWidth !== 'number' || profile.maxWidth <= 0) {
        throw new Error(
          `Invalid maxWidth in profile "${profileName}": must be a positive number, got ${profile.maxWidth}`
        );
      }

      if (typeof profile.maxHeight !== 'number' || profile.maxHeight <= 0) {
        throw new Error(
          `Invalid maxHeight in profile "${profileName}": must be a positive number, got ${profile.maxHeight}`
        );
      }

      // Validate thresholds if provided
      if (profile.widthThresholds) {
        const { info, warning, error } = profile.widthThresholds;

        if (info !== undefined && (typeof info !== 'number' || info <= 0)) {
          throw new Error(
            `Invalid widthThresholds.info in profile "${profileName}": must be a positive number, got ${info}`
          );
        }

        if (warning !== undefined && (typeof warning !== 'number' || warning <= 0)) {
          throw new Error(
            `Invalid widthThresholds.warning in profile "${profileName}": must be a positive number, got ${warning}`
          );
        }

        if (error !== undefined && (typeof error !== 'number' || error <= 0)) {
          throw new Error(
            `Invalid widthThresholds.error in profile "${profileName}": must be a positive number, got ${error}`
          );
        }

        // Check ascending order
        if (info !== undefined && warning !== undefined && info >= warning) {
          throw new Error(
            `Invalid widthThresholds in profile "${profileName}": info (${info}) must be less than warning (${warning})`
          );
        }

        if (warning !== undefined && error !== undefined && warning > error) {
          throw new Error(
            `Invalid widthThresholds in profile "${profileName}": warning (${warning}) must be less than or equal to error (${error})`
          );
        }

        // Check error threshold matches maxWidth if specified
        if (error !== undefined && error !== profile.maxWidth) {
          throw new Error(
            `Invalid widthThresholds.error in profile "${profileName}": must match maxWidth (${profile.maxWidth}), got ${error}`
          );
        }
      }

      if (profile.heightThresholds) {
        const { info, warning, error } = profile.heightThresholds;

        if (info !== undefined && (typeof info !== 'number' || info <= 0)) {
          throw new Error(
            `Invalid heightThresholds.info in profile "${profileName}": must be a positive number, got ${info}`
          );
        }

        if (warning !== undefined && (typeof warning !== 'number' || warning <= 0)) {
          throw new Error(
            `Invalid heightThresholds.warning in profile "${profileName}": must be a positive number, got ${warning}`
          );
        }

        if (error !== undefined && (typeof error !== 'number' || error <= 0)) {
          throw new Error(
            `Invalid heightThresholds.error in profile "${profileName}": must be a positive number, got ${error}`
          );
        }

        // Check ascending order
        if (info !== undefined && warning !== undefined && info >= warning) {
          throw new Error(
            `Invalid heightThresholds in profile "${profileName}": info (${info}) must be less than warning (${warning})`
          );
        }

        if (warning !== undefined && error !== undefined && warning > error) {
          throw new Error(
            `Invalid heightThresholds in profile "${profileName}": warning (${warning}) must be less than or equal to error (${error})`
          );
        }

        // Check error threshold matches maxHeight if specified
        if (error !== undefined && error !== profile.maxHeight) {
          throw new Error(
            `Invalid heightThresholds.error in profile "${profileName}": must match maxHeight (${profile.maxHeight}), got ${error}`
          );
        }
      }
    }
  }
}

/**
 * Merges user configuration with defaults
 *
 * @param userConfig - User-provided partial configuration
 * @returns Complete configuration with defaults
 */
function mergeConfig(userConfig: PartialConfig): Config {
  // Validate before merging
  validateViewportConfig(userConfig);

  return {
    viewport: {
      ...defaultConfig.viewport,
      ...userConfig.viewport,
      // Merge profiles if both exist
      profiles: {
        ...defaultConfig.viewport?.profiles,
        ...userConfig.viewport?.profiles,
      },
    },
    rules: {
      'syntax-validation': {
        ...defaultConfig.rules['syntax-validation'],
        ...userConfig.rules?.['syntax-validation'],
      },
      'max-edges': {
        ...defaultConfig.rules['max-edges'],
        ...userConfig.rules?.['max-edges'],
      },
      'max-nodes-high-density': {
        ...defaultConfig.rules['max-nodes-high-density'],
        ...userConfig.rules?.['max-nodes-high-density'],
      },
      'max-nodes-low-density': {
        ...defaultConfig.rules['max-nodes-low-density'],
        ...userConfig.rules?.['max-nodes-low-density'],
      },
      'cyclomatic-complexity': {
        ...defaultConfig.rules['cyclomatic-complexity'],
        ...userConfig.rules?.['cyclomatic-complexity'],
      },
      'layout-hint': {
        ...defaultConfig.rules['layout-hint'],
        ...userConfig.rules?.['layout-hint'],
      },
      'horizontal-chain-too-long': {
        ...defaultConfig.rules['horizontal-chain-too-long'],
        ...userConfig.rules?.['horizontal-chain-too-long'],
      },
      'horizontal-width-readability': {
        ...defaultConfig.rules['horizontal-width-readability'],
        ...userConfig.rules?.['horizontal-width-readability'],
      },
      'vertical-height-readability': {
        ...defaultConfig.rules['vertical-height-readability'],
        ...userConfig.rules?.['vertical-height-readability'],
      },
      'long-labels': {
        ...defaultConfig.rules['long-labels'],
        ...userConfig.rules?.['long-labels'],
      },
      'reserved-words': {
        ...defaultConfig.rules['reserved-words'],
        ...userConfig.rules?.['reserved-words'],
      },
      'disconnected-components': {
        ...defaultConfig.rules['disconnected-components'],
        ...userConfig.rules?.['disconnected-components'],
      },
    },
  };
}

/**
 * Loads configuration from file system
 *
 * Searches for configuration files starting from the given directory
 * and walking up the directory tree. Falls back to defaults if no
 * config file is found.
 *
 * @param searchFrom - Directory to start searching from (defaults to cwd)
 * @returns Loaded and merged configuration
 */
export async function loadConfig(searchFrom?: string): Promise<Config> {
  try {
    const result = await explorer.search(searchFrom);

    if (result && result.config) {
      return mergeConfig(result.config as PartialConfig);
    }

    return defaultConfig;
  } catch {
    // If config file is malformed, log warning and use defaults
    console.warn('Warning: Failed to load config file, using defaults');
    return defaultConfig;
  }
}

/**
 * Loads configuration synchronously
 *
 * Note: cosmiconfig v9 doesn't have searchSync, so this is a wrapper
 * that returns defaults immediately. For true sync loading, use the async version.
 *
 * @param _searchFrom - Directory to start searching from (unused in sync version)
 * @returns Default configuration (sync version always returns defaults)
 */
export function loadConfigSync(_searchFrom?: string): Config {
  // cosmiconfig v9 removed searchSync, so we return defaults for sync calls
  // In practice, the async version should be used where possible
  return defaultConfig;
}
