# 🧜‍♀️ Mermaid-Sonar

> **Detect hidden complexity in your Mermaid diagrams**

A complexity analyzer and readability linter for Mermaid diagrams. Like sonar detects underwater obstacles, Mermaid-Sonar detects hidden complexity issues before they cause readability problems.

[![npm version](https://badge.fury.io/js/mermaid-sonar.svg)](https://www.npmjs.com/package/mermaid-sonar)
[![Coverage](https://github.com/iepathos/mermaid-sonar/workflows/Coverage/badge.svg)](https://github.com/iepathos/mermaid-sonar/actions/workflows/coverage.yml)
[![Release](https://github.com/iepathos/mermaid-sonar/workflows/Release/badge.svg)](https://github.com/iepathos/mermaid-sonar/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Mermaid-Sonar?

Mermaid diagrams are great for documentation, but complex diagrams can hurt more than they help. Mermaid-Sonar analyzes your diagrams using:

- **Graph theory metrics** (density, branching, connectivity)
- **Cognitive load research** (50/100 node thresholds)
- **Mermaid best practices** (100 connection O(n²) limit)
- **Layout intelligence** (LR vs TD recommendations)

## Features

- ✅ **Syntax validation** - Detects Mermaid syntax errors before rendering
- ✅ **Research-backed thresholds** - Not arbitrary limits
- ✅ **Actionable recommendations** - Not just "too complex"
- ✅ **Multiple output formats** - Terminal, JSON, Markdown, GitHub Actions
- ✅ **Zero rendering dependencies** - Pure static analysis
- ✅ **Fast** - Analyzes hundreds of diagrams in seconds
- ✅ **Configurable** - Adjust thresholds to your needs

## Quick Start

```bash
# Install
npm install -g mermaid-sonar

# Analyze diagrams in your docs
mermaid-sonar docs/**/*.md

# With custom config
mermaid-sonar --config .sonarrc.json docs/
```

## Syntax Validation

Mermaid-Sonar validates Mermaid syntax using the official Mermaid parser, catching errors before they cause rendering failures:

**Invalid syntax example:**
````markdown
<!-- Invalid syntax - missing arrow -->
```mermaid
graph TD
  A B
```
````

**Detected error:**
```
❌ docs/example.md:3
   Syntax error: Parse error on line 2:
   A B
   ---^
   Expecting 'SEMI', 'NEWLINE', 'EOF', 'AMP', 'START_LINK', 'LINK', got 'ALPHA'
   → Fix the Mermaid syntax or consult the Mermaid documentation
```

Syntax validation runs automatically on all diagrams and reports errors with:
- **Line numbers**: Exact location of the syntax error
- **Error context**: What the parser expected vs. what it found
- **Exit code**: Non-zero exit code (1) for CI/CD integration

This ensures your diagrams are syntactically correct before analyzing complexity.

## Example Output

```
Analyzing Mermaid diagrams...

❌ docs/architecture.md:42
   Wide tree diagram with 12 parallel branches (>8 max)
   → Consider using 'graph LR' or split into multiple diagrams

⚠️  docs/workflow.md:156
   Complex diagram with 85 nodes
   → Consider breaking into focused sub-diagrams

✓ docs/overview.md:15 - Valid and readable

Summary:
  Total diagrams: 23
  Valid & Readable: 20
  Warnings: 2
  Errors: 1
```

## Installation

```bash
# Global installation
npm install -g mermaid-sonar

# Project dependency
npm install --save-dev mermaid-sonar

# Using npx (no installation)
npx mermaid-sonar docs/
```

## Usage

### Command Line

```bash
# Analyze specific files
mermaid-sonar README.md docs/architecture.md

# Glob patterns
mermaid-sonar "docs/**/*.md"

# Output formats
mermaid-sonar --format json docs/     # JSON output
mermaid-sonar --format markdown docs/ # Markdown report

# With config file
mermaid-sonar --config .sonarrc.json docs/
```

### Programmatic API

```typescript
import { analyzeDiagrams } from 'mermaid-sonar';

const results = await analyzeDiagrams(['docs/**/*.md']);

console.log(`Found ${results.issues.length} issues`);
```

### JSON Output Schema

When using `--format json`, the output follows this TypeScript schema:

```typescript
interface JSONOutput {
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
  results: Array<{
    diagram: {
      content: string;     // Raw Mermaid code
      startLine: number;   // 1-indexed line number
      filePath: string;    // Source file path
      type: 'flowchart' | 'graph' | 'unknown';
    };
    metrics: {
      nodeCount: number;
      edgeCount: number;
      graphDensity: number;      // edges / (nodes × (nodes-1))
      maxBranchWidth: number;    // Max children from any node
      averageDegree: number;     // Avg connections per node
    };
    issues: Array<{
      rule: string;           // Rule identifier
      severity: 'error' | 'warning' | 'info';
      message: string;        // Human-readable message
      filePath: string;       // Source file path
      line: number;           // Line number
      suggestion?: string;    // Fix suggestion
      citation?: string;      // Research citation URL
    }>;
  }>;
}
```

**Example JSON output**:

```json
{
  "version": "1.0.0",
  "summary": {
    "filesAnalyzed": 3,
    "diagramsAnalyzed": 5,
    "totalIssues": 2,
    "errorCount": 1,
    "warningCount": 1,
    "infoCount": 0,
    "duration": 42
  },
  "results": [
    {
      "diagram": {
        "content": "graph TD\n  A --> B\n  ...",
        "startLine": 42,
        "filePath": "docs/architecture.md",
        "type": "graph"
      },
      "metrics": {
        "nodeCount": 55,
        "edgeCount": 78,
        "graphDensity": 0.026,
        "maxBranchWidth": 12,
        "averageDegree": 2.84
      },
      "issues": [
        {
          "rule": "max-branch-width",
          "severity": "error",
          "message": "Wide tree diagram with 12 parallel branches (>8 max)",
          "filePath": "docs/architecture.md",
          "line": 42,
          "suggestion": "Consider using 'graph LR' or split into multiple diagrams",
          "citation": "https://example.com/visual-hierarchy-research"
        }
      ]
    }
  ]
}
```

## CLI Reference

### Command Syntax

```bash
mermaid-sonar [options] <files...>
```

### Arguments

- `<files...>` - Files, directories, or glob patterns to analyze (required)
  - Examples: `README.md`, `docs/`, `"src/**/*.md"`
  - Supports multiple arguments: `docs/ README.md examples/`

### Options

#### Output Control

- `-f, --format <format>` - Output format (default: `console`)
  - **console**: Colorized terminal output with detailed metrics
  - **json**: Machine-readable JSON for CI/CD integration
  - **markdown**: Formatted markdown report with tables
  - **github**: GitHub-flavored markdown with collapsible sections
  - **junit**: JUnit XML format for test result integration

- `-o, --output <file>` - Write output to file instead of stdout
  - Example: `--output report.json`
  - Works with all formats

- `-q, --quiet` - Suppress non-error output
  - Only shows errors, no progress or summary
  - Useful for silent CI/CD runs

- `-v, --verbose` - Show detailed analysis information
  - Displays file counts and processing details
  - Cannot be used with `--quiet`

#### Analysis Control

- `-r, --recursive` - Recursively scan directories
  - Example: `mermaid-sonar -r docs/` scans all subdirectories
  - Without this flag, only top-level files are analyzed

- `-s, --strict` - Treat warnings as errors
  - Exit code 1 if any warnings are found
  - Useful for enforcing zero-warning policies in CI

- `--max-warnings <number>` - Maximum warnings before failing
  - Example: `--max-warnings 5`
  - Exit code 1 if warnings exceed this threshold
  - Requires numeric value

- `--no-rules` - Disable rule validation (only show metrics)
  - Shows raw metrics without applying rules
  - Useful for understanding diagram characteristics

#### Configuration

- `-c, --config <path>` - Path to configuration file
  - Example: `--config custom-config.json`
  - Overrides automatic config discovery
  - See [Configuration](#configuration) section

### Exit Codes

Mermaid-Sonar uses standard exit codes for CI/CD integration:

- **0**: Success - No errors found
  - All diagrams analyzed successfully
  - No errors, or only warnings (without `--strict`)

- **1**: Validation failure - Errors or warnings with `--strict`
  - Found errors in one or more diagrams
  - Found warnings when `--strict` is enabled
  - Exceeded `--max-warnings` threshold

- **2**: Execution failure - Tool error
  - No files found matching pattern
  - Invalid configuration file
  - File system errors or parsing failures

### Examples

#### Basic Analysis

```bash
# Analyze single file
mermaid-sonar README.md

# Analyze multiple files
mermaid-sonar README.md docs/architecture.md

# Analyze directory (non-recursive)
mermaid-sonar docs/

# Analyze directory recursively
mermaid-sonar -r docs/

# Glob patterns (quote to prevent shell expansion)
mermaid-sonar "docs/**/*.md"
mermaid-sonar "src/**/*.{md,mdx}"
```

#### Output Formats

```bash
# JSON output for CI/CD
mermaid-sonar --format json docs/ > report.json

# Markdown report
mermaid-sonar --format markdown -o report.md docs/

# GitHub-flavored markdown
mermaid-sonar --format github docs/

# JUnit XML for test integration
mermaid-sonar --format junit -o junit.xml docs/
```

For detailed examples and use cases for each format, see the [Output Formats Guide](./docs/output-formats.md).

#### CI/CD Usage

```bash
# Strict mode - fail on any warning
mermaid-sonar --strict docs/

# Allow up to 5 warnings
mermaid-sonar --max-warnings 5 docs/

# Quiet mode for CI logs
mermaid-sonar --quiet --format json -o report.json docs/

# Verbose mode for debugging
mermaid-sonar --verbose docs/
```

#### Configuration

```bash
# Use custom config
mermaid-sonar --config .sonarrc.json docs/

# Disable rules, show only metrics
mermaid-sonar --no-rules docs/
```

### CI/CD Integration

#### GitHub Actions

```yaml
name: Lint Diagrams
on: [pull_request]
jobs:
  lint-diagrams:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npx mermaid-sonar docs/
```

#### GitLab CI

```yaml
# .gitlab-ci.yml
lint-diagrams:
  stage: test
  image: node:20
  script:
    - npx mermaid-sonar --format junit -o junit.xml docs/
  artifacts:
    when: always
    reports:
      junit: junit.xml
```

#### Jenkins

```groovy
// Jenkinsfile
pipeline {
  agent any
  stages {
    stage('Lint Diagrams') {
      steps {
        sh 'npx mermaid-sonar --format junit -o junit.xml docs/'
        junit 'junit.xml'
      }
    }
  }
}
```

#### VS Code Tasks

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Lint Mermaid Diagrams",
      "type": "shell",
      "command": "npx mermaid-sonar --format console docs/",
      "problemMatcher": [],
      "group": {
        "kind": "test",
        "isDefault": true
      }
    },
    {
      "label": "Generate Diagram Report",
      "type": "shell",
      "command": "npx mermaid-sonar --format markdown -o diagram-report.md docs/",
      "problemMatcher": []
    }
  ]
}
```

#### Pre-commit Hook

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: mermaid-sonar
        name: Mermaid Complexity Check
        entry: npx mermaid-sonar
        language: system
        files: \\.md$
```

## Configuration

Create `.sonarrc.json`, `.sonarrc.yaml`, or add to `package.json`:

```json
{
  "mermaid-sonar": {
    "rules": {
      "max-nodes": {
        "enabled": true,
        "high-density": 50,
        "low-density": 100,
        "severity": "error"
      },
      "max-edges": {
        "enabled": true,
        "limit": 100,
        "severity": "warning"
      },
      "graph-density": {
        "enabled": true,
        "threshold": 0.3,
        "severity": "warning"
      },
      "cyclomatic-complexity": {
        "enabled": true,
        "limit": 15,
        "severity": "warning"
      }
    }
  }
}
```

## Rules

| Rule | Default | Research Basis |
|------|---------|----------------|
| `max-nodes` | 50/100 | [Cognitive load research](https://arxiv.org/abs/2008.07944) |
| `max-edges` | 100 | [Mermaid O(n²) docs](https://docs.mermaidchart.com/blog/posts/flow-charts-are-on2-complex-so-dont-go-over-100-connections) |
| `graph-density` | 0.3 | Graph theory best practices |
| `cyclomatic-complexity` | 15 | Software engineering standards |
| `max-branch-width` | 8 | Visual hierarchy research |
| `layout-hint` | enabled | Mermaid layout best practices |
| `horizontal-chain-too-long` | LR: 8, TD: 12 | Viewport width constraints & scrolling UX |

See [docs/rules.md](./docs/rules.md) for detailed rule documentation.

## Research Backing

All thresholds are based on published research:

- **Node limits**: "[Scalability of Network Visualisation from a Cognitive Load Perspective](https://arxiv.org/abs/2008.07944)" - Study showing 50-node limit for high-density graphs
- **Connection limit**: [Mermaid official blog](https://docs.mermaidchart.com/blog/posts/flow-charts-are-on2-complex-so-dont-go-over-100-connections) - O(n²) complexity warning
- **Cyclomatic complexity**: McCabe's original research on code complexity

## Development

```bash
# Setup
git clone https://github.com/iepathos/mermaid-sonar.git
cd mermaid-sonar
npm install

# Development
npm run dev         # Watch mode
npm test           # Run tests
npm run build      # Build for production
npm run typecheck  # Type checking

# Before commit
npm run format     # Format code
npm run lint       # Lint code
npm test          # Run tests
```

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

## License

MIT © Glen Baker <iepathos@gmail.com>

## Acknowledgments

- Built on research from cognitive load and graph theory studies
- Inspired by the Mermaid.js community
- Initial implementation based on internal diagram validation tools

---

**Like sonar reveals what's hidden underwater, Mermaid-Sonar reveals hidden complexity in your diagrams** 🌊
