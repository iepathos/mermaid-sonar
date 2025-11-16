# 🧜‍♀️ Mermaid-Sonar

> **Detect hidden complexity in your Mermaid diagrams**

A complexity analyzer and readability linter for Mermaid diagrams. Like sonar detects underwater obstacles, Mermaid-Sonar detects hidden complexity issues before they cause readability problems.

[![npm version](https://badge.fury.io/js/mermaid-sonar.svg)](https://www.npmjs.com/package/mermaid-sonar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Mermaid-Sonar?

Mermaid diagrams are great for documentation, but complex diagrams can hurt more than they help. Mermaid-Sonar analyzes your diagrams using:

- **Graph theory metrics** (density, branching, connectivity)
- **Cognitive load research** (50/100 node thresholds)
- **Mermaid best practices** (100 connection O(n²) limit)
- **Layout intelligence** (LR vs TD recommendations)

## Features

✅ **Research-backed thresholds** - Not arbitrary limits
✅ **Actionable recommendations** - Not just "too complex"
✅ **Multiple output formats** - Terminal, JSON, Markdown, GitHub Actions
✅ **Zero rendering dependencies** - Pure static analysis
✅ **Fast** - Analyzes hundreds of diagrams in seconds
✅ **Configurable** - Adjust thresholds to your needs

## Quick Start

```bash
# Install
npm install -g mermaid-sonar

# Analyze diagrams in your docs
mermaid-sonar docs/**/*.md

# With custom config
mermaid-sonar --config .sonarrc.json docs/
```

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

See [docs/rules.md](./docs/rules.md) for detailed rule documentation.

## Research Backing

All thresholds are based on published research:

- **Node limits**: "[Scalability of Network Visualisation from a Cognitive Load Perspective](https://arxiv.org/abs/2008.07944)" - Study showing 50-node limit for high-density graphs
- **Connection limit**: [Mermaid official blog](https://docs.mermaidchart.com/blog/posts/flow-charts-are-on2-complex-so-dont-go-over-100-connections) - O(n²) complexity warning
- **Cyclomatic complexity**: McCabe's original research on code complexity

## Development

```bash
# Setup
git clone https://github.com/yourusername/mermaid-sonar.git
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

MIT © Glen

## Acknowledgments

- Built on research from cognitive load and graph theory studies
- Inspired by the Mermaid.js community
- Initial implementation based on internal diagram validation tools

---

**Like sonar reveals what's hidden underwater, Mermaid-Sonar reveals hidden complexity in your diagrams** 🌊
