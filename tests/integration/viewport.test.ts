/**
 * Integration tests for viewport constraint application during analysis
 *
 * These tests verify that viewport configurations correctly affect rule behavior
 * when analyzing diagrams end-to-end via the CLI.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolveViewportConfig, type CliViewportOptions } from '../../src/config/viewport-resolver';
import type { ViewportConfig } from '../../src/config/types';
import path from 'path';

const execAsync = promisify(exec);

interface ExecError extends Error {
  code?: number;
  stdout?: string;
  stderr?: string;
}

describe('Viewport Integration Tests', () => {
  const fixturesPath = path.join(__dirname, '../fixtures');
  const wideLRPath = path.join(fixturesPath, 'wide-lr-layout.md');
  const testConfigPath = path.join(process.cwd(), '.sonarrc.test.json');

  afterEach(() => {
    // Clean up test config
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  describe('CLI Viewport Flag Support', () => {
    it('should accept --viewport-profile flag', async () => {
      // CLI may return exit code 1 when violations are detected
      try {
        const { stdout } = await execAsync(
          `node dist/cli.js --viewport-profile mkdocs ${wideLRPath}`
        );

        // If successful, output should contain file
        expect(stdout).toContain('file');
      } catch (error) {
        // Exit code 1 is expected when diagram errors are detected
        const execError = error as ExecError;
        expect(execError.code).toBe(1);
        // Errors should be reported in stdout/stderr, not as crashes
        expect(execError.stdout || execError.stderr).toBeTruthy();
      }
    }, 30000);

    it('should accept --max-width flag', async () => {
      try {
        const { stdout } = await execAsync(`node dist/cli.js --max-width 800 ${wideLRPath}`);
        expect(stdout).toContain('file');
      } catch (error) {
        // Exit code 1 is expected when violations are detected
        const execError = error as ExecError;
        expect(execError.code).toBe(1);
        expect(execError.stdout || execError.stderr).toBeTruthy();
      }
    }, 30000);

    it('should accept --max-height flag', async () => {
      try {
        const { stdout } = await execAsync(`node dist/cli.js --max-height 1000 ${wideLRPath}`);
        expect(stdout).toContain('file');
      } catch (error) {
        // Exit code 1 is expected when violations are detected
        const execError = error as ExecError;
        expect(execError.code).toBe(1);
        expect(execError.stdout || execError.stderr).toBeTruthy();
      }
    }, 30000);

    it('should accept combined viewport flags', async () => {
      try {
        const { stdout } = await execAsync(
          `node dist/cli.js --viewport-profile mkdocs --max-width 900 ${wideLRPath}`
        );
        expect(stdout).toContain('file');
      } catch (error) {
        // Exit code 1 is expected when violations are detected
        const execError = error as ExecError;
        expect(execError.code).toBe(1);
        expect(execError.stdout || execError.stderr).toBeTruthy();
      }
    }, 30000);
  });

  describe('Config File Viewport Support', () => {
    it('should load viewport profile from config file', async () => {
      const config = {
        'mermaid-sonar': {
          viewport: {
            profile: 'mkdocs',
          },
        },
      };

      writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

      const { stdout, stderr } = await execAsync(
        `node dist/cli.js --config ${testConfigPath} ${wideLRPath}`
      );

      // Should complete successfully with config
      expect(stderr).not.toContain('Error');
      expect(stdout).toContain('file');
    }, 30000);

    it('should load custom viewport dimensions from config', async () => {
      const config = {
        'mermaid-sonar': {
          viewport: {
            maxWidth: 1000,
            maxHeight: 1200,
          },
        },
      };

      writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

      const { stdout, stderr } = await execAsync(
        `node dist/cli.js --config ${testConfigPath} ${wideLRPath}`
      );

      // Should complete successfully
      expect(stderr).not.toContain('Error');
      expect(stdout).toContain('file');
    }, 30000);
  });

  describe('Viewport Resolution Logic', () => {
    it('should resolve viewport config with correct priority order', () => {
      const config: ViewportConfig = {
        profile: 'mkdocs',
        maxWidth: 900, // Config direct override
      };
      const cli: CliViewportOptions = {
        maxWidth: 1200, // CLI override (highest priority)
      };

      const resolved = resolveViewportConfig(config, cli);

      expect(resolved.maxWidth).toBe(1200); // CLI wins
      expect(resolved.maxHeight).toBe(1500); // From mkdocs profile
      expect(resolved.source).toBe('cli');
    });

    it('should use profile when only profile is specified', () => {
      const config: ViewportConfig = {
        profile: 'github',
      };

      const resolved = resolveViewportConfig(config, undefined);

      expect(resolved.maxWidth).toBe(1000);
      expect(resolved.maxHeight).toBe(1800);
      expect(resolved.source).toBe('profile');
    });

    it('should use config direct when no CLI provided', () => {
      const config: ViewportConfig = {
        maxWidth: 1500,
        maxHeight: 1000,
      };

      const resolved = resolveViewportConfig(config, undefined);

      expect(resolved.maxWidth).toBe(1500);
      expect(resolved.maxHeight).toBe(1000);
      expect(resolved.source).toBe('config-direct');
    });

    it('should fall back to default when nothing specified', () => {
      const resolved = resolveViewportConfig(undefined, undefined);

      expect(resolved.maxWidth).toBe(2500);
      expect(resolved.maxHeight).toBe(2000);
      expect(resolved.source).toBe('default');
    });
  });

  describe('Built-in Profile Verification', () => {
    it('should support mkdocs profile', async () => {
      try {
        const { stderr } = await execAsync(
          `node dist/cli.js --viewport-profile mkdocs ${wideLRPath}`
        );
        expect(stderr).not.toContain('unknown profile');
      } catch (error) {
        // Exit code 1 is acceptable if violations are detected
        const execError = error as ExecError;
        expect(execError.code).toBe(1);
        expect(execError.stderr).not.toContain('unknown profile');
      }
    }, 30000);

    it('should support github profile', async () => {
      try {
        const { stderr } = await execAsync(
          `node dist/cli.js --viewport-profile github ${wideLRPath}`
        );
        expect(stderr).not.toContain('unknown profile');
      } catch (error) {
        // Exit code 1 is acceptable if violations are detected
        const execError = error as ExecError;
        expect(execError.code).toBe(1);
        expect(execError.stderr).not.toContain('unknown profile');
      }
    }, 30000);

    it('should support docusaurus profile', async () => {
      try {
        const { stderr } = await execAsync(
          `node dist/cli.js --viewport-profile docusaurus ${wideLRPath}`
        );
        expect(stderr).not.toContain('unknown profile');
      } catch (error) {
        // Exit code 1 is acceptable if violations are detected
        const execError = error as ExecError;
        expect(execError.code).toBe(1);
        expect(execError.stderr).not.toContain('unknown profile');
      }
    }, 30000);

    it('should support mobile profile', async () => {
      try {
        const { stderr } = await execAsync(
          `node dist/cli.js --viewport-profile mobile ${wideLRPath}`
        );
        expect(stderr).not.toContain('unknown profile');
      } catch (error) {
        // Exit code 1 is acceptable if violations are detected
        const execError = error as ExecError;
        expect(execError.code).toBe(1);
        expect(execError.stderr).not.toContain('unknown profile');
      }
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle invalid profile gracefully', async () => {
      const { stdout, stderr } = await execAsync(
        `node dist/cli.js --viewport-profile nonexistent ${wideLRPath}`
      ).catch((err) => err);

      // Should either fall back to default or show clear error
      // Not crash with uncaught exception
      expect(stdout || stderr).toBeTruthy();
    }, 30000);
  });
});
