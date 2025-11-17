/**
 * File discovery utilities for CLI
 *
 * Handles glob patterns, recursive directory scanning, and file filtering
 */

import { glob } from 'glob';
import { stat } from 'fs/promises';
import { join } from 'path';
import { readdir } from 'fs/promises';

/**
 * Options for file discovery
 */
export interface FileDiscoveryOptions {
  /** Enable recursive directory traversal */
  recursive?: boolean;
  /** File extensions to include (default: ['.md']) */
  extensions?: string[];
}

/**
 * Finds files matching the provided patterns
 *
 * Supports:
 * - Direct file paths: `docs/README.md`
 * - Glob patterns: `docs/**\/*.md`
 * - Directories: `docs/` (with --recursive)
 * - Multiple patterns: `["*.md", "docs/**\/*.md"]`
 *
 * @param patterns - Array of file paths, glob patterns, or directories
 * @param options - Discovery options
 * @returns Array of absolute file paths
 */
export async function findFiles(
  patterns: string[],
  options: FileDiscoveryOptions = {}
): Promise<string[]> {
  const { recursive = false, extensions = ['.md'] } = options;

  const allFiles = new Set<string>();

  for (const pattern of patterns) {
    // Check if pattern is a directory
    try {
      const stats = await stat(pattern);

      if (stats.isDirectory()) {
        // Scan directory
        const dirFiles = await scanDirectory(pattern, recursive, extensions);
        dirFiles.forEach((file) => allFiles.add(file));
        continue;
      } else if (stats.isFile()) {
        // Direct file path
        if (matchesExtension(pattern, extensions)) {
          allFiles.add(pattern);
        }
        continue;
      }
    } catch {
      // Not a file or directory, try as glob pattern
    }

    // Try as glob pattern
    const matches = await glob(pattern, {
      nodir: true,
      absolute: true,
    });

    matches
      .filter((file) => matchesExtension(file, extensions))
      .forEach((file) => allFiles.add(file));
  }

  return Array.from(allFiles).sort();
}

/**
 * Recursively scans a directory for files
 */
async function scanDirectory(
  dir: string,
  recursive: boolean,
  extensions: string[]
): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (recursive) {
          const subFiles = await scanDirectory(fullPath, recursive, extensions);
          files.push(...subFiles);
        }
      } else if (entry.isFile() && matchesExtension(entry.name, extensions)) {
        files.push(fullPath);
      }
    }
  } catch (_error) {
    // Ignore permission errors and continue
  }

  return files;
}

/**
 * Checks if a file matches one of the allowed extensions
 */
function matchesExtension(filename: string, extensions: string[]): boolean {
  return extensions.some((ext) => filename.endsWith(ext));
}
