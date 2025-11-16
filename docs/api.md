# API Reference

This document describes the programmatic API for using Mermaid-Sonar in your Node.js applications.

## Installation

```bash
npm install mermaid-sonar
```

## Quick Start

```typescript
import { analyzeDiagrams } from 'mermaid-sonar';

const results = await analyzeDiagrams(['docs/**/*.md']);

console.log(`Found ${results.summary.totalIssues} issues`);
```

## Core Functions

### analyzeDiagrams()

Analyzes Mermaid diagrams in files matching the provided patterns.

**Signature**:
```typescript
function analyzeDiagrams(
  patterns: string | string[],
  options?: AnalysisOptions
): Promise<AnalysisResult>
```

**Parameters**:
- `patterns` (string | string[]): File paths or glob patterns to analyze
- `options` (AnalysisOptions, optional): Configuration options

**Returns**: `Promise<AnalysisResult>` - Analysis results with metrics and issues

**Example**:
```typescript
import { analyzeDiagrams } from 'mermaid-sonar';

// Single file
const result1 = await analyzeDiagrams('README.md');

// Multiple files
const result2 = await analyzeDiagrams(['docs/api.md', 'docs/guide.md']);

// Glob patterns
const result3 = await analyzeDiagrams('docs/**/*.md');

// With options
const result4 = await analyzeDiagrams('docs/**/*.md', {
  rules: {
    'max-nodes': {
      enabled: true,
      'high-density': 60
    }
  }
});
```

### analyzeFile()

Analyzes a single file for Mermaid diagrams.

**Signature**:
```typescript
function analyzeFile(
  filePath: string,
  options?: AnalysisOptions
): Promise<FileAnalysisResult>
```

**Parameters**:
- `filePath` (string): Path to file to analyze
- `options` (AnalysisOptions, optional): Configuration options

**Returns**: `Promise<FileAnalysisResult>` - Analysis results for the file

**Example**:
```typescript
import { analyzeFile } from 'mermaid-sonar';

const result = await analyzeFile('docs/architecture.md');

console.log(`Found ${result.diagrams.length} diagrams`);
result.diagrams.forEach(diagram => {
  console.log(`Diagram at line ${diagram.startLine}: ${diagram.issues.length} issues`);
});
```

### analyzeContent()

Analyzes Mermaid diagram content directly (no file reading).

**Signature**:
```typescript
function analyzeContent(
  content: string,
  options?: AnalysisOptions
): DiagramAnalysisResult
```

**Parameters**:
- `content` (string): Mermaid diagram code
- `options` (AnalysisOptions, optional): Configuration options

**Returns**: `DiagramAnalysisResult` - Analysis results for the diagram

**Example**:
```typescript
import { analyzeContent } from 'mermaid-sonar';

const diagram = `
graph TD
  A --> B
  B --> C
  C --> A
`;

const result = analyzeContent(diagram);

console.log(`Metrics:`, result.metrics);
console.log(`Issues:`, result.issues);
```

## Type Definitions

### AnalysisResult

Complete analysis results for multiple files.

```typescript
interface AnalysisResult {
  version: string;
  summary: {
    filesAnalyzed: number;
    diagramsAnalyzed: number;
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    duration: number; // milliseconds
  };
  results: DiagramAnalysisResult[];
}
```

### FileAnalysisResult

Analysis results for a single file.

```typescript
interface FileAnalysisResult {
  filePath: string;
  diagrams: DiagramAnalysisResult[];
}
```

### DiagramAnalysisResult

Analysis results for a single diagram.

```typescript
interface DiagramAnalysisResult {
  diagram: {
    content: string;
    startLine: number;
    filePath?: string;
    type: 'flowchart' | 'graph' | 'unknown';
  };
  metrics: Metrics;
  issues: Issue[];
}
```

### Metrics

Complexity metrics for a diagram.

```typescript
interface Metrics {
  nodeCount: number;
  edgeCount: number;
  graphDensity: number;      // 0-1, edges / (nodes × (nodes-1))
  maxBranchWidth: number;    // Max children from any node
  averageDegree: number;     // Avg connections per node
  cyclomaticComplexity?: number; // edges - nodes + 2
}
```

### Issue

A rule violation or suggestion.

```typescript
interface Issue {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  filePath?: string;
  line?: number;
  suggestion?: string;
  citation?: string;
}
```

### AnalysisOptions

Configuration options for analysis.

```typescript
interface AnalysisOptions {
  rules?: RuleConfiguration;
  format?: 'console' | 'json' | 'markdown' | 'github' | 'junit';
  output?: string;
  quiet?: boolean;
  verbose?: boolean;
  strict?: boolean;
  maxWarnings?: number;
}
```

### RuleConfiguration

Configuration for individual rules.

```typescript
interface RuleConfiguration {
  'max-nodes'?: {
    enabled?: boolean;
    'high-density'?: number;
    'low-density'?: number;
    'density-threshold'?: number;
    severity?: 'error' | 'warning' | 'info';
  };
  'max-edges'?: {
    enabled?: boolean;
    limit?: number;
    severity?: 'error' | 'warning' | 'info';
  };
  'graph-density'?: {
    enabled?: boolean;
    threshold?: number;
    severity?: 'error' | 'warning' | 'info';
  };
  'cyclomatic-complexity'?: {
    enabled?: boolean;
    limit?: number;
    severity?: 'error' | 'warning' | 'info';
  };
  'max-branch-width'?: {
    enabled?: boolean;
    limit?: number;
    severity?: 'error' | 'warning' | 'info';
  };
  'layout-hint'?: {
    enabled?: boolean;
    'wide-threshold'?: number;
    'tall-threshold'?: number;
    severity?: 'error' | 'warning' | 'info';
  };
}
```

## Usage Examples

### Basic Analysis

```typescript
import { analyzeDiagrams } from 'mermaid-sonar';

async function checkDocs() {
  const results = await analyzeDiagrams('docs/**/*.md');

  if (results.summary.errorCount > 0) {
    console.error(`Found ${results.summary.errorCount} errors`);
    process.exit(1);
  }

  console.log('All diagrams are valid!');
}

checkDocs();
```

### Custom Configuration

```typescript
import { analyzeDiagrams } from 'mermaid-sonar';

async function strictAnalysis() {
  const results = await analyzeDiagrams('docs/**/*.md', {
    rules: {
      'max-nodes': {
        enabled: true,
        'high-density': 30,
        'low-density': 50,
        severity: 'error'
      },
      'max-edges': {
        enabled: true,
        limit: 75,
        severity: 'error'
      }
    },
    strict: true
  });

  return results;
}
```

### Filtering Results

```typescript
import { analyzeDiagrams } from 'mermaid-sonar';

async function findErrors() {
  const results = await analyzeDiagrams('docs/**/*.md');

  // Get only diagrams with errors
  const errors = results.results.filter(r =>
    r.issues.some(i => i.severity === 'error')
  );

  // Group by file
  const errorsByFile = errors.reduce((acc, result) => {
    const file = result.diagram.filePath || 'unknown';
    if (!acc[file]) acc[file] = [];
    acc[file].push(result);
    return acc;
  }, {} as Record<string, typeof errors>);

  return errorsByFile;
}
```

### Computing Statistics

```typescript
import { analyzeDiagrams } from 'mermaid-sonar';

async function getDiagramStats() {
  const results = await analyzeDiagrams('docs/**/*.md');

  const stats = {
    totalDiagrams: results.summary.diagramsAnalyzed,
    avgNodes: 0,
    avgEdges: 0,
    avgDensity: 0,
    largestDiagram: 0,
    mostComplex: 0
  };

  if (results.results.length > 0) {
    const metrics = results.results.map(r => r.metrics);

    stats.avgNodes = metrics.reduce((sum, m) => sum + m.nodeCount, 0) / metrics.length;
    stats.avgEdges = metrics.reduce((sum, m) => sum + m.edgeCount, 0) / metrics.length;
    stats.avgDensity = metrics.reduce((sum, m) => sum + m.graphDensity, 0) / metrics.length;
    stats.largestDiagram = Math.max(...metrics.map(m => m.nodeCount));
    stats.mostComplex = Math.max(...metrics.map(m => m.cyclomaticComplexity || 0));
  }

  return stats;
}
```

### Custom Reporter

```typescript
import { analyzeDiagrams } from 'mermaid-sonar';
import * as fs from 'fs/promises';

async function generateCustomReport() {
  const results = await analyzeDiagrams('docs/**/*.md');

  // Build custom HTML report
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Diagram Complexity Report</title>
      <style>
        .error { color: red; }
        .warning { color: orange; }
        .info { color: blue; }
      </style>
    </head>
    <body>
      <h1>Diagram Analysis Report</h1>
      <p>Total diagrams: ${results.summary.diagramsAnalyzed}</p>
      <p>Issues found: ${results.summary.totalIssues}</p>

      ${results.results.map(r => `
        <div>
          <h2>${r.diagram.filePath}:${r.diagram.startLine}</h2>
          <p>Nodes: ${r.metrics.nodeCount}, Edges: ${r.metrics.edgeCount}</p>
          <ul>
            ${r.issues.map(i => `
              <li class="${i.severity}">${i.message}</li>
            `).join('')}
          </ul>
        </div>
      `).join('')}
    </body>
    </html>
  `;

  await fs.writeFile('diagram-report.html', html);
}
```

### CI/CD Integration

```typescript
import { analyzeDiagrams } from 'mermaid-sonar';

async function ciCheck() {
  try {
    const results = await analyzeDiagrams('docs/**/*.md', {
      strict: true,
      maxWarnings: 5
    });

    // Log summary
    console.log(`Analyzed ${results.summary.diagramsAnalyzed} diagrams`);
    console.log(`Errors: ${results.summary.errorCount}`);
    console.log(`Warnings: ${results.summary.warningCount}`);

    // Fail if errors or too many warnings
    if (results.summary.errorCount > 0) {
      console.error('❌ Analysis failed with errors');
      process.exit(1);
    }

    if (results.summary.warningCount > 5) {
      console.error('❌ Too many warnings');
      process.exit(1);
    }

    console.log('✅ All diagrams passed validation');
    process.exit(0);

  } catch (error) {
    console.error('❌ Analysis error:', error);
    process.exit(2);
  }
}

ciCheck();
```

### Watch Mode

```typescript
import { analyzeFile } from 'mermaid-sonar';
import * as chokidar from 'chokidar';

function watchDiagrams() {
  const watcher = chokidar.watch('docs/**/*.md', {
    ignored: /node_modules/,
    persistent: true
  });

  watcher.on('change', async (filePath) => {
    console.log(`Analyzing ${filePath}...`);

    try {
      const result = await analyzeFile(filePath);
      const issueCount = result.diagrams.reduce(
        (sum, d) => sum + d.issues.length,
        0
      );

      if (issueCount > 0) {
        console.log(`⚠️  Found ${issueCount} issues in ${filePath}`);
      } else {
        console.log(`✅ ${filePath} is valid`);
      }
    } catch (error) {
      console.error(`❌ Error analyzing ${filePath}:`, error);
    }
  });

  console.log('Watching for changes...');
}

watchDiagrams();
```

### Batch Processing

```typescript
import { analyzeFile } from 'mermaid-sonar';
import { glob } from 'glob';
import * as pLimit from 'p-limit';

async function analyzeInBatches() {
  const files = await glob('docs/**/*.md');
  const limit = pLimit(10); // Process 10 files concurrently

  const results = await Promise.all(
    files.map(file => limit(() => analyzeFile(file)))
  );

  // Aggregate results
  const totalIssues = results.reduce((sum, r) =>
    sum + r.diagrams.reduce((s, d) => s + d.issues.length, 0),
    0
  );

  console.log(`Analyzed ${files.length} files`);
  console.log(`Found ${totalIssues} total issues`);

  return results;
}
```

## Error Handling

All API functions can throw errors. Always use try-catch:

```typescript
import { analyzeDiagrams } from 'mermaid-sonar';

async function safeAnalysis() {
  try {
    const results = await analyzeDiagrams('docs/**/*.md');
    return results;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('File not found');
    } else if (error.code === 'EACCES') {
      console.error('Permission denied');
    } else {
      console.error('Analysis failed:', error.message);
    }
    throw error;
  }
}
```

## TypeScript Support

Mermaid-Sonar is written in TypeScript and includes full type definitions.

```typescript
import {
  analyzeDiagrams,
  AnalysisResult,
  Issue,
  Metrics
} from 'mermaid-sonar';

async function typedAnalysis(): Promise<AnalysisResult> {
  const results = await analyzeDiagrams('docs/**/*.md');

  // Full type safety
  results.results.forEach((result) => {
    const metrics: Metrics = result.metrics;
    const issues: Issue[] = result.issues;

    console.log(`Nodes: ${metrics.nodeCount}`);
    issues.forEach(issue => {
      console.log(`${issue.severity}: ${issue.message}`);
    });
  });

  return results;
}
```

## Performance Considerations

### File System Caching

The analysis caches file reads. For repeated analysis, consider:

```typescript
import { analyzeContent } from 'mermaid-sonar';
import * as fs from 'fs/promises';

const cache = new Map<string, string>();

async function analyzeWithCache(filePath: string) {
  let content = cache.get(filePath);

  if (!content) {
    content = await fs.readFile(filePath, 'utf-8');
    cache.set(filePath, content);
  }

  return analyzeContent(content);
}
```

### Parallelization

Use parallel processing for large codebases:

```typescript
import { analyzeFile } from 'mermaid-sonar';
import * as pLimit from 'p-limit';

async function parallelAnalysis(files: string[]) {
  const limit = pLimit(navigator.hardwareConcurrency || 4);

  return Promise.all(
    files.map(file => limit(() => analyzeFile(file)))
  );
}
```

## Additional Resources

- [Configuration Guide](./configuration.md) - Detailed configuration options
- [Rule Catalog](./rules.md) - Rule descriptions and research
- [Output Formats](./output-formats.md) - Format documentation
- [GitHub Examples](../examples/) - Working code examples
