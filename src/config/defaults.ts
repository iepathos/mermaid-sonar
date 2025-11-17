/**
 * Default configuration values
 *
 * Research-backed default thresholds for all rules
 */

import type { Config } from './types';

/**
 * Default configuration with research-backed thresholds
 */
export const defaultConfig: Config = {
  rules: {
    'syntax-validation': {
      enabled: true,
      severity: 'error',
    },
    'max-edges': {
      enabled: true,
      severity: 'error',
      threshold: 100,
    },
    'max-nodes-high-density': {
      enabled: true,
      severity: 'warning',
      threshold: 50,
      densityThreshold: 0.3,
    },
    'max-nodes-low-density': {
      enabled: true,
      severity: 'warning',
      threshold: 100,
    },
    'cyclomatic-complexity': {
      enabled: true,
      severity: 'warning',
      threshold: 10,
    },
    'layout-hint': {
      enabled: true,
      severity: 'warning',
      minConfidence: 0.6,
    },
    'horizontal-chain-too-long': {
      enabled: true,
      severity: 'warning',
      thresholds: {
        LR: 8,
        TD: 12,
      },
    },
    'long-labels': {
      enabled: true,
      severity: 'warning',
      threshold: 40,
    },
    'reserved-words': {
      enabled: true,
      severity: 'warning',
    },
    'disconnected-components': {
      enabled: true,
      severity: 'warning',
      threshold: 2,
    },
  },
};
