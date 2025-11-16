/**
 * File discovery tests
 */

import { describe, it, expect } from '@jest/globals';
import { findFiles } from '../../src/cli/files';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(__dirname, '../__fixtures__/file-discovery');

// Setup test files
function setupTestFiles() {
  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }

  mkdirSync(TEST_DIR, { recursive: true });
  mkdirSync(join(TEST_DIR, 'subdir'), { recursive: true });
  mkdirSync(join(TEST_DIR, 'subdir/nested'), { recursive: true });

  writeFileSync(join(TEST_DIR, 'file1.md'), '# Test');
  writeFileSync(join(TEST_DIR, 'file2.md'), '# Test');
  writeFileSync(join(TEST_DIR, 'file3.txt'), 'text');
  writeFileSync(join(TEST_DIR, 'subdir/file4.md'), '# Test');
  writeFileSync(join(TEST_DIR, 'subdir/nested/file5.md'), '# Test');
}

// Cleanup test files
function cleanupTestFiles() {
  try {
    rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {
    // Ignore
  }
}

describe('File Discovery', () => {
  beforeEach(() => {
    setupTestFiles();
  });

  afterEach(() => {
    cleanupTestFiles();
  });

  it('should find single file', async () => {
    const files = await findFiles([join(TEST_DIR, 'file1.md')]);

    expect(files).toHaveLength(1);
    expect(files[0]).toContain('file1.md');
  });

  it('should find multiple files', async () => {
    const files = await findFiles([join(TEST_DIR, 'file1.md'), join(TEST_DIR, 'file2.md')]);

    expect(files).toHaveLength(2);
  });

  it('should filter by extension', async () => {
    const files = await findFiles([join(TEST_DIR, '*')]);

    // Should only include .md files, not .txt
    expect(files.every((f) => f.endsWith('.md'))).toBe(true);
    expect(files.some((f) => f.endsWith('.txt'))).toBe(false);
  });

  it('should handle glob patterns', async () => {
    const files = await findFiles([join(TEST_DIR, '*.md')]);

    expect(files.length).toBeGreaterThanOrEqual(2);
    expect(files.every((f) => f.endsWith('.md'))).toBe(true);
  });

  it('should scan directory non-recursively by default', async () => {
    const files = await findFiles([TEST_DIR]);

    // Should find file1.md and file2.md but not subdirectory files
    expect(files).toHaveLength(2);
  });

  it('should scan directory recursively when enabled', async () => {
    const files = await findFiles([TEST_DIR], { recursive: true });

    // Should find all .md files including in subdirectories
    expect(files.length).toBeGreaterThanOrEqual(4);
    expect(files.some((f) => f.includes('subdir'))).toBe(true);
  });

  it('should handle nested glob patterns', async () => {
    const files = await findFiles([join(TEST_DIR, '**/*.md')]);

    // Should find all .md files recursively
    expect(files.length).toBeGreaterThanOrEqual(4);
  });

  it('should deduplicate files', async () => {
    const files = await findFiles([
      join(TEST_DIR, 'file1.md'),
      join(TEST_DIR, 'file1.md'), // Duplicate
      join(TEST_DIR, '*.md'),
    ]);

    // Should not have duplicates
    const uniqueFiles = new Set(files);
    expect(uniqueFiles.size).toBe(files.length);
  });

  it('should return empty array for non-existent paths', async () => {
    const files = await findFiles([join(TEST_DIR, 'nonexistent.md')]);

    expect(files).toHaveLength(0);
  });

  it('should sort results', async () => {
    const files = await findFiles([join(TEST_DIR, '*.md')]);

    const sorted = [...files].sort();
    expect(files).toEqual(sorted);
  });
});
