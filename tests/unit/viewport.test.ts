/**
 * Unit tests for viewport configuration functionality
 */

import {
  resolveViewportConfig,
  applyViewportToRuleConfig,
  type CliViewportOptions,
} from '../../src/config/viewport-resolver';
import type { ViewportConfig } from '../../src/config/types';
import { getBuiltInProfile, getDefaultProfile } from '../../src/config/viewport-profiles';

describe('Viewport Configuration', () => {
  describe('Built-in Profiles', () => {
    it('should have default profile', () => {
      const profile = getDefaultProfile();
      expect(profile).toBeDefined();
      expect(profile.name).toBe('default');
      expect(profile.maxWidth).toBe(2500);
      expect(profile.maxHeight).toBe(2000);
    });

    it('should have mkdocs profile', () => {
      const profile = getBuiltInProfile('mkdocs');
      expect(profile).toBeDefined();
      expect(profile?.name).toBe('mkdocs');
      expect(profile?.maxWidth).toBe(800);
      expect(profile?.maxHeight).toBe(1500);
    });

    it('should have docusaurus profile', () => {
      const profile = getBuiltInProfile('docusaurus');
      expect(profile).toBeDefined();
      expect(profile?.name).toBe('docusaurus');
      expect(profile?.maxWidth).toBe(900);
      expect(profile?.maxHeight).toBe(1500);
    });

    it('should have github profile', () => {
      const profile = getBuiltInProfile('github');
      expect(profile).toBeDefined();
      expect(profile?.name).toBe('github');
      expect(profile?.maxWidth).toBe(1000);
      expect(profile?.maxHeight).toBe(1800);
    });

    it('should have mobile profile', () => {
      const profile = getBuiltInProfile('mobile');
      expect(profile).toBeDefined();
      expect(profile?.name).toBe('mobile');
      expect(profile?.maxWidth).toBe(400);
      expect(profile?.maxHeight).toBe(800);
    });

    it('should return undefined for unknown profile', () => {
      const profile = getBuiltInProfile('nonexistent');
      expect(profile).toBeUndefined();
    });

    it('should have valid threshold progressions', () => {
      const profile = getBuiltInProfile('mkdocs');
      expect(profile?.widthThresholds?.info).toBeLessThan(profile?.widthThresholds?.warning ?? 0);
      expect(profile?.widthThresholds?.warning).toBeLessThan(profile?.widthThresholds?.error ?? 0);
      expect(profile?.widthThresholds?.error).toBe(profile?.maxWidth);
    });
  });

  describe('resolveViewportConfig - Priority Order', () => {
    it('should use default profile when no config provided', () => {
      const resolved = resolveViewportConfig(undefined, undefined);

      expect(resolved.maxWidth).toBe(2500);
      expect(resolved.maxHeight).toBe(2000);
      expect(resolved.source).toBe('default');
    });

    it('should use built-in profile when specified in config', () => {
      const config: ViewportConfig = {
        profile: 'mkdocs',
      };
      const resolved = resolveViewportConfig(config, undefined);

      expect(resolved.maxWidth).toBe(800);
      expect(resolved.maxHeight).toBe(1500);
      expect(resolved.source).toBe('profile');
    });

    it('should use custom profile from config', () => {
      const config: ViewportConfig = {
        profile: 'custom',
        profiles: {
          custom: {
            name: 'custom',
            description: 'Custom profile',
            maxWidth: 1100,
            maxHeight: 1600,
            widthThresholds: { info: 800, warning: 950, error: 1100 },
            heightThresholds: { info: 1200, warning: 1400, error: 1600 },
          },
        },
      };
      const resolved = resolveViewportConfig(config, undefined);

      expect(resolved.maxWidth).toBe(1100);
      expect(resolved.maxHeight).toBe(1600);
      expect(resolved.source).toBe('profile');
    });

    it('should override profile with config direct values', () => {
      const config: ViewportConfig = {
        profile: 'mkdocs',
        maxWidth: 900,
      };
      const resolved = resolveViewportConfig(config, undefined);

      expect(resolved.maxWidth).toBe(900); // Overrides mkdocs 800
      expect(resolved.maxHeight).toBe(1500); // From mkdocs profile
      expect(resolved.source).toBe('config-direct');
    });

    it('should override config with CLI flags', () => {
      const config: ViewportConfig = {
        profile: 'mkdocs',
        maxWidth: 900,
      };
      const cli: CliViewportOptions = {
        maxWidth: 1200,
      };
      const resolved = resolveViewportConfig(config, cli);

      expect(resolved.maxWidth).toBe(1200); // CLI wins
      expect(resolved.maxHeight).toBe(1500); // From mkdocs profile
      expect(resolved.source).toBe('cli');
    });

    it('should use CLI profile selection', () => {
      const config: ViewportConfig = {
        profile: 'mkdocs',
      };
      const cli: CliViewportOptions = {
        viewportProfile: 'github',
      };
      const resolved = resolveViewportConfig(config, cli);

      expect(resolved.maxWidth).toBe(1000); // github profile
      expect(resolved.maxHeight).toBe(1800); // github profile
      expect(resolved.source).toBe('profile');
    });

    it('should prioritize CLI profile over config profile', () => {
      const config: ViewportConfig = {
        profile: 'mkdocs',
      };
      const cli: CliViewportOptions = {
        viewportProfile: 'github',
        maxWidth: 1500,
      };
      const resolved = resolveViewportConfig(config, cli);

      expect(resolved.maxWidth).toBe(1500); // CLI maxWidth wins
      expect(resolved.maxHeight).toBe(1800); // github profile (from CLI)
      expect(resolved.source).toBe('cli');
    });

    it('should handle partial CLI overrides', () => {
      const config: ViewportConfig = {
        profile: 'mkdocs',
      };
      const cli: CliViewportOptions = {
        maxHeight: 2000,
      };
      const resolved = resolveViewportConfig(config, cli);

      expect(resolved.maxWidth).toBe(800); // From mkdocs
      expect(resolved.maxHeight).toBe(2000); // CLI override
      expect(resolved.source).toBe('cli');
    });
  });

  describe('resolveViewportConfig - Threshold Calculation', () => {
    it('should use profile thresholds when provided', () => {
      const config: ViewportConfig = {
        profile: 'mkdocs',
      };
      const resolved = resolveViewportConfig(config, undefined);

      expect(resolved.widthThresholds.info).toBe(600);
      expect(resolved.widthThresholds.warning).toBe(700);
      expect(resolved.widthThresholds.error).toBe(800);
    });

    it('should recalculate thresholds when maxWidth/maxHeight provided', () => {
      const config: ViewportConfig = {
        maxWidth: 1000,
        maxHeight: 1500,
      };
      const resolved = resolveViewportConfig(config, undefined);

      // When direct maxWidth/maxHeight provided, thresholds are recalculated
      // based on the new max values (60%, 80%, 100%)
      expect(resolved.widthThresholds.info).toBe(600); // 1000 * 0.6
      expect(resolved.widthThresholds.warning).toBe(800); // 1000 * 0.8
      expect(resolved.widthThresholds.error).toBe(1000); // maxWidth

      expect(resolved.heightThresholds.info).toBe(900); // 1500 * 0.6
      expect(resolved.heightThresholds.warning).toBe(1200); // 1500 * 0.8
      expect(resolved.heightThresholds.error).toBe(1500); // maxHeight
    });

    it('should use custom profile thresholds as-is', () => {
      const config: ViewportConfig = {
        profile: 'custom',
        profiles: {
          custom: {
            name: 'custom',
            description: 'Custom',
            maxWidth: 1000,
            maxHeight: 1200,
            widthThresholds: { info: 500, warning: 750, error: 900 },
            heightThresholds: { info: 600, warning: 900, error: 1100 },
          },
        },
      };
      const resolved = resolveViewportConfig(config, undefined);

      // Profile defines error threshold as 900/1100 but maxWidth/maxHeight are 1000/1200
      // Resolved config should override error to match maxWidth/maxHeight
      expect(resolved.widthThresholds.error).toBe(1000); // Updated to maxWidth
      expect(resolved.heightThresholds.error).toBe(1200); // Updated to maxHeight

      // info and warning come from profile's thresholds
      expect(resolved.widthThresholds.info).toBe(500);
      expect(resolved.widthThresholds.warning).toBe(750);
    });
  });

  describe('resolveViewportConfig - Invalid Profile Handling', () => {
    it('should fall back to default for invalid profile name', () => {
      const config: ViewportConfig = {
        profile: 'nonexistent',
      };
      const resolved = resolveViewportConfig(config, undefined);

      expect(resolved.maxWidth).toBe(2500); // default
      expect(resolved.maxHeight).toBe(2000); // default
      expect(resolved.source).toBe('default');
    });

    it('should handle empty config object', () => {
      const config: ViewportConfig = {};
      const resolved = resolveViewportConfig(config, undefined);

      expect(resolved.maxWidth).toBe(2500);
      expect(resolved.maxHeight).toBe(2000);
      expect(resolved.source).toBe('default');
    });

    it('should handle empty CLI options', () => {
      const cli: CliViewportOptions = {};
      const resolved = resolveViewportConfig(undefined, cli);

      expect(resolved.maxWidth).toBe(2500);
      expect(resolved.maxHeight).toBe(2000);
      expect(resolved.source).toBe('default');
    });
  });

  describe('applyViewportToRuleConfig', () => {
    it('should apply viewport config to rule config', () => {
      const ruleConfig = {
        enabled: true,
        severity: 'warning' as const,
        threshold: 100,
      };
      const viewportConfig: ViewportConfig = {
        profile: 'mkdocs',
      };

      const updated = applyViewportToRuleConfig(ruleConfig, viewportConfig, undefined);

      expect(updated.targetWidth).toBe(800);
      expect(updated.targetHeight).toBe(1500);
      expect(updated.enabled).toBe(true);
      expect(updated.severity).toBe('warning');
    });

    it('should preserve existing rule config properties', () => {
      const ruleConfig = {
        enabled: false,
        severity: 'error' as const,
        threshold: 50,
        customProperty: 'test',
      };
      const viewportConfig: ViewportConfig = {
        profile: 'github',
      };

      const updated = applyViewportToRuleConfig(ruleConfig, viewportConfig, undefined);

      expect(updated.enabled).toBe(false);
      expect(updated.severity).toBe('error');
      expect(updated.threshold).toBe(50);
      expect((updated as { customProperty?: string }).customProperty).toBe('test');
    });

    it('should apply CLI overrides to rule config', () => {
      const ruleConfig = {
        enabled: true,
        severity: 'warning' as const,
        threshold: 100,
      };
      const viewportConfig: ViewportConfig = {
        profile: 'mkdocs',
      };
      const cli: CliViewportOptions = {
        maxWidth: 1200,
        maxHeight: 1000,
      };

      const updated = applyViewportToRuleConfig(ruleConfig, viewportConfig, cli);

      expect(updated.targetWidth).toBe(1200);
      expect(updated.targetHeight).toBe(1000);
    });

    it('should merge thresholds from viewport', () => {
      const ruleConfig = {
        enabled: true,
        severity: 'warning' as const,
        threshold: 100,
        thresholds: {
          info: 500,
          warning: 700,
          error: 900,
        },
      };
      const viewportConfig: ViewportConfig = {
        profile: 'mkdocs',
      };

      const updated = applyViewportToRuleConfig(ruleConfig, viewportConfig, undefined);

      expect((updated.thresholds as { info: number }).info).toBe(600); // From mkdocs
      expect((updated.thresholds as { warning: number }).warning).toBe(700); // From mkdocs
      expect((updated.thresholds as { error: number }).error).toBe(800); // From mkdocs
    });
  });
});
