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
 * Merges user configuration with defaults
 *
 * @param userConfig - User-provided partial configuration
 * @returns Complete configuration with defaults
 */
function mergeConfig(userConfig: PartialConfig): Config {
  return {
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
  } catch (_error) {
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
