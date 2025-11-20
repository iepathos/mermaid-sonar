# Configuration Guide

This guide explains how to configure Mermaid-Sonar for your project.

## Quick Start

Create a `.sonarrc.json` file in your project root:

```json
{
  "mermaid-sonar": {
    "rules": {
      "max-nodes": {
        "enabled": true,
        "high-density": 50,
        "low-density": 100
      }
    }
  }
}
```

## Configuration File Formats

Mermaid-Sonar supports multiple configuration formats using [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig):

### JSON (.sonarrc.json)

```json
{
  "mermaid-sonar": {
    "rules": {
      "max-nodes": {
        "enabled": true,
        "high-density": 50,
        "low-density": 100,
        "severity": "error"
      }
    }
  }
}
```

### YAML (.sonarrc.yaml or .sonarrc.yml)

```yaml
mermaid-sonar:
  rules:
    max-nodes:
      enabled: true
      high-density: 50
      low-density: 100
      severity: error
```

### JavaScript (.sonarrc.js)

```javascript
module.exports = {
  'mermaid-sonar': {
    rules: {
      'max-nodes': {
        enabled: true,
        'high-density': 50,
        'low-density': 100,
        severity: 'error'
      }
    }
  }
};
```

### Package.json

Add configuration to your `package.json`:

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "mermaid-sonar": {
    "rules": {
      "max-nodes": {
        "enabled": true,
        "high-density": 50
      }
    }
  }
}
```

## Configuration Discovery

Mermaid-Sonar searches for configuration in this order:

1. CLI flag: `--config path/to/config.json`
2. `.sonarrc.json`, `.sonarrc.yaml`, `.sonarrc.yml`
3. `.sonarrc.js` (JavaScript config)
4. `mermaid-sonar` field in `package.json`
5. Default configuration

Configuration is searched starting from the current directory and moving up to parent directories.

## Rule Configuration

### Complete Example

```json
{
  "mermaid-sonar": {
    "rules": {
      "max-nodes": {
        "enabled": true,
        "high-density": 50,
        "low-density": 100,
        "density-threshold": 0.3,
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
      },
      "max-branch-width": {
        "enabled": true,
        "limit": 8,
        "severity": "error"
      },
      "layout-hint": {
        "enabled": true,
        "wide-threshold": 8,
        "tall-threshold": 6,
        "severity": "info"
      }
    }
  }
}
```

### Rule Options

#### max-nodes

Checks for too many nodes in a diagram.

```json
{
  "max-nodes": {
    "enabled": true,
    "high-density": 50,
    "low-density": 100,
    "density-threshold": 0.3,
    "severity": "error"
  }
}
```

**Options**:
- `enabled` (boolean, default: `true`): Enable/disable rule
- `high-density` (number, default: `50`): Node limit for dense graphs
- `low-density` (number, default: `100`): Node limit for sparse graphs
- `density-threshold` (number, default: `0.3`): Density cutoff (0-1)
- `severity` ("error"|"warning"|"info", default: `"error"`): Violation severity

#### max-edges

Checks for too many connections.

```json
{
  "max-edges": {
    "enabled": true,
    "limit": 100,
    "severity": "warning"
  }
}
```

**Options**:
- `enabled` (boolean, default: `true`): Enable/disable rule
- `limit` (number, default: `100`): Maximum connections
- `severity` ("error"|"warning"|"info", default: `"warning"`): Violation severity

#### graph-density

Checks for excessive connection density.

```json
{
  "graph-density": {
    "enabled": true,
    "threshold": 0.3,
    "severity": "warning"
  }
}
```

**Options**:
- `enabled` (boolean, default: `true`): Enable/disable rule
- `threshold` (number, default: `0.3`): Maximum density (0-1)
- `severity` ("error"|"warning"|"info", default: `"warning"`): Violation severity

#### cyclomatic-complexity

Checks for high decision complexity.

```json
{
  "cyclomatic-complexity": {
    "enabled": true,
    "limit": 15,
    "severity": "warning"
  }
}
```

**Options**:
- `enabled` (boolean, default: `true`): Enable/disable rule
- `limit` (number, default: `15`): Maximum complexity
- `severity` ("error"|"warning"|"info", default: `"warning"`): Violation severity

#### max-branch-width

Checks for wide tree diagrams.

```json
{
  "max-branch-width": {
    "enabled": true,
    "limit": 8,
    "severity": "error"
  }
}
```

**Options**:
- `enabled` (boolean, default: `true`): Enable/disable rule
- `limit` (number, default: `8`): Maximum children per node
- `severity` ("error"|"warning"|"info", default: `"error"`): Violation severity

#### layout-hint

Suggests optimal layout direction.

```json
{
  "layout-hint": {
    "enabled": true,
    "wide-threshold": 8,
    "tall-threshold": 6,
    "severity": "info"
  }
}
```

**Options**:
- `enabled` (boolean, default: `true`): Enable/disable rule
- `wide-threshold` (number, default: `8`): Branch width for LR suggestion
- `tall-threshold` (number, default: `6`): Depth for TD suggestion
- `severity` ("error"|"warning"|"info", default: `"info"`): Violation severity

## Viewport Configuration

Mermaid-Sonar supports viewport constraints to ensure diagrams render properly within different documentation frameworks and screen sizes.

### Built-in Viewport Profiles

Use pre-configured profiles for common rendering contexts:

```bash
# MkDocs documentation sites (~800-900px content width)
mermaid-sonar --viewport-profile mkdocs docs/

# Docusaurus documentation (~900-1000px content width)
mermaid-sonar --viewport-profile docusaurus docs/

# GitHub README files (~1000px content width)
mermaid-sonar --viewport-profile github README.md

# Mobile devices (400px width)
mermaid-sonar --viewport-profile mobile docs/
```

**Available built-in profiles**:

| Profile | Max Width | Max Height | Use Case |
|---------|-----------|------------|----------|
| `default` | 2500px | 2000px | Standard browser viewport |
| `mkdocs` | 800px | 1500px | MkDocs with sidebar |
| `docusaurus` | 900px | 1500px | Docusaurus framework |
| `github` | 1000px | 1800px | GitHub markdown |
| `mobile` | 400px | 800px | Mobile devices |

### CLI Viewport Flags

Override viewport constraints with command-line flags:

```bash
# Set maximum width
mermaid-sonar --max-width 1200 docs/

# Set maximum height
mermaid-sonar --max-height 1000 docs/

# Set both dimensions
mermaid-sonar --max-width 1200 --max-height 1000 docs/

# Combine with profile (CLI overrides profile)
mermaid-sonar --viewport-profile mkdocs --max-width 1000 docs/
```

### Configuration File

Configure viewport constraints in `.sonarrc.json`:

```json
{
  "mermaid-sonar": {
    "viewport": {
      "profile": "mkdocs",
      "maxWidth": 800,
      "maxHeight": 1500
    },
    "rules": {
      "horizontal-width-readability": {
        "enabled": true
      },
      "vertical-height-readability": {
        "enabled": true
      }
    }
  }
}
```

### Custom Viewport Profiles

Define custom profiles for your specific rendering context:

```json
{
  "mermaid-sonar": {
    "viewport": {
      "profile": "custom-mkdocs",
      "profiles": {
        "custom-mkdocs": {
          "name": "custom-mkdocs",
          "description": "Custom documentation site",
          "maxWidth": 1100,
          "maxHeight": 1600,
          "widthThresholds": {
            "info": 800,
            "warning": 950,
            "error": 1100
          },
          "heightThresholds": {
            "info": 1200,
            "warning": 1400,
            "error": 1600
          }
        }
      }
    }
  }
}
```

### Configuration Priority

Viewport configuration is resolved in this priority order (highest to lowest):

1. **CLI flags**: `--max-width`, `--max-height`, `--viewport-profile`
2. **Config direct overrides**: `viewport.maxWidth`, `viewport.maxHeight`
3. **Profile selection**: `viewport.profile` or built-in profiles
4. **Default profile**: Standard browser viewport (2500×2000)

**Example priority demonstration**:

```json
{
  "mermaid-sonar": {
    "viewport": {
      "profile": "mkdocs",
      "maxWidth": 900
    }
  }
}
```

```bash
# Uses config maxWidth: 900px (overrides mkdocs profile's 800px)
mermaid-sonar docs/

# Uses CLI maxWidth: 1200px (overrides config's 900px)
mermaid-sonar --max-width 1200 docs/
```

### How Viewport Affects Rules

Viewport constraints are used by readability rules to detect diagrams that exceed comfortable viewing dimensions:

- **horizontal-width-readability**: Checks if estimated diagram width exceeds viewport max width
- **vertical-height-readability**: Checks if estimated diagram height exceeds viewport max height

These rules trigger at different severity levels based on thresholds:

```json
{
  "mermaid-sonar": {
    "viewport": {
      "profile": "mkdocs",
      "profiles": {
        "mkdocs": {
          "maxWidth": 800,
          "widthThresholds": {
            "info": 600,
            "warning": 700,
            "error": 800
          }
        }
      }
    }
  }
}
```

**Severity progression**:
- **Info**: Diagram approaching limit (600px for mkdocs)
- **Warning**: Diagram significantly exceeds safe size (700px for mkdocs)
- **Error**: Diagram exceeds hard limit (800px for mkdocs)

### Framework-Specific Examples

#### MkDocs Documentation

```json
{
  "mermaid-sonar": {
    "viewport": {
      "profile": "mkdocs"
    },
    "rules": {
      "horizontal-width-readability": {
        "enabled": true,
        "severity": "error"
      },
      "vertical-height-readability": {
        "enabled": true,
        "severity": "warning"
      }
    }
  }
}
```

```bash
# Analyze with mkdocs constraints
mermaid-sonar docs/
```

#### GitHub README

```bash
# Quick check for GitHub rendering
mermaid-sonar --viewport-profile github README.md
```

#### Docusaurus with Custom Width

```json
{
  "mermaid-sonar": {
    "viewport": {
      "profile": "docusaurus",
      "maxWidth": 950
    }
  }
}
```

### Debugging Viewport Configuration

Use verbose mode to see which viewport configuration is active:

```bash
mermaid-sonar --verbose docs/
```

Output includes:
```
Viewport configuration:
  Source: profile
  Profile: mkdocs
  Max Width: 800px
  Max Height: 1500px
  Width Thresholds: info=600px, warning=700px, error=800px
```

## Common Scenarios

### Strict Quality Gate

Enforce zero warnings in CI/CD:

```json
{
  "mermaid-sonar": {
    "rules": {
      "max-nodes": {
        "enabled": true,
        "high-density": 30,
        "low-density": 50,
        "severity": "error"
      },
      "max-edges": {
        "enabled": true,
        "limit": 75,
        "severity": "error"
      },
      "graph-density": {
        "enabled": true,
        "threshold": 0.25,
        "severity": "error"
      }
    }
  }
}
```

Run with `--strict` flag:
```bash
mermaid-sonar --strict docs/
```

### Relaxed for Legacy Docs

Allow larger diagrams in legacy documentation:

```json
{
  "mermaid-sonar": {
    "rules": {
      "max-nodes": {
        "enabled": true,
        "high-density": 75,
        "low-density": 150,
        "severity": "warning"
      },
      "max-edges": {
        "enabled": true,
        "limit": 150,
        "severity": "warning"
      }
    }
  }
}
```

### Minimal Rules

Only check critical issues:

```json
{
  "mermaid-sonar": {
    "rules": {
      "max-nodes": {
        "enabled": true
      },
      "max-edges": {
        "enabled": false
      },
      "graph-density": {
        "enabled": false
      },
      "cyclomatic-complexity": {
        "enabled": false
      },
      "max-branch-width": {
        "enabled": true
      },
      "layout-hint": {
        "enabled": false
      }
    }
  }
}
```

### Informational Only

Show metrics without failing:

```json
{
  "mermaid-sonar": {
    "rules": {
      "max-nodes": {
        "enabled": true,
        "severity": "info"
      },
      "max-edges": {
        "enabled": true,
        "severity": "info"
      },
      "graph-density": {
        "enabled": true,
        "severity": "info"
      }
    }
  }
}
```

Or use `--no-rules` flag:
```bash
mermaid-sonar --no-rules docs/
```

## Per-Directory Configuration

Place `.sonarrc.json` in subdirectories to override parent configuration:

```
project/
├── .sonarrc.json           # Global: strict rules
├── docs/
│   └── api/
│       └── .sonarrc.json   # API mkdocs: relaxed rules
└── examples/
    └── .sonarrc.json       # Examples: minimal rules
```

**Root .sonarrc.json** (strict):
```json
{
  "mermaid-sonar": {
    "rules": {
      "max-nodes": {
        "high-density": 40,
        "severity": "error"
      }
    }
  }
}
```

**docs/api/.sonarrc.json** (relaxed):
```json
{
  "mermaid-sonar": {
    "rules": {
      "max-nodes": {
        "high-density": 75,
        "severity": "warning"
      }
    }
  }
}
```

## Environment-Specific Configuration

### Development

`.sonarrc.dev.json`:
```json
{
  "mermaid-sonar": {
    "rules": {
      "max-nodes": {
        "severity": "warning"
      }
    }
  }
}
```

Use with:
```bash
mermaid-sonar --config .sonarrc.dev.json docs/
```

### CI/CD

`.sonarrc.ci.json`:
```json
{
  "mermaid-sonar": {
    "rules": {
      "max-nodes": {
        "severity": "error"
      }
    }
  }
}
```

Use with:
```bash
mermaid-sonar --config .sonarrc.ci.json --strict docs/
```

## Ignoring Files

Currently, Mermaid-Sonar analyzes all matched files. To exclude files:

### Using .gitignore

Excluded files in `.gitignore` are not analyzed by default when using glob patterns.

### Using Specific Paths

Analyze only specific directories:

```bash
# Only analyze docs/ and examples/, skip legacy/
mermaid-sonar docs/ examples/
```

### Using Custom Scripts

Create a script to filter files:

```bash
#!/bin/bash
# analyze-mkdocs.sh
find mkdocs -name "*.md" ! -path "*/legacy/*" -print0 | \
  xargs -0 mermaid-sonar
```

## Programmatic Configuration

When using the API, pass configuration directly:

```typescript
import { analyzeDiagrams } from 'mermaid-sonar';

const results = await analyzeDiagrams(['docs/**/*.md'], {
  rules: {
    'max-nodes': {
      enabled: true,
      'high-density': 60,
      severity: 'warning'
    }
  }
});
```

## Debugging Configuration

### Show Effective Configuration

```bash
# Run with verbose flag to see loaded config
mermaid-sonar --verbose docs/
```

Output includes:
```
Loaded configuration from: /path/to/.sonarrc.json
Active rules: max-nodes, max-edges, graph-density, ...
```

### Validate Configuration

Use JSON schema validation:

```bash
# Check if config file is valid JSON
cat .sonarrc.json | jq .
```

## Migration from Older Versions

### Version 0.x to 1.0

No breaking configuration changes. All 0.x configs work in 1.0.

### Future Deprecations

When rules or options are deprecated, you'll see warnings:

```
Warning: Rule 'old-rule-name' is deprecated. Use 'new-rule-name' instead.
Migration guide: https://github.com/iepathos/mermaid-sonar/blob/main/MIGRATION.md
```

## Best Practices

1. **Start with defaults**: Use default configuration initially
2. **Adjust based on feedback**: Tune thresholds based on team feedback
3. **Document exceptions**: Comment why you changed defaults
4. **Use CI config**: Stricter rules in CI than local development
5. **Version control config**: Commit `.sonarrc.json` to repository
6. **Avoid JavaScript config**: Prefer JSON/YAML for security

## Troubleshooting

### Configuration Not Loading

Check:
1. Configuration file name (`.sonarrc.json`, not `sonarrc.json`)
2. JSON syntax (use `jq` to validate)
3. Location (should be in project root or parent directory)
4. File permissions

### Rules Not Working

Check:
1. Rule is enabled: `"enabled": true`
2. Rule name is correct (see [rules.md](./rules.md))
3. Thresholds are reasonable
4. No typos in rule configuration

### Unexpected Severity

Verify:
1. Severity value: `"error"`, `"warning"`, or `"info"` (lowercase, in quotes)
2. No conflicting configuration in parent directories
3. CLI flags not overriding config

## Additional Resources

- [Rule Catalog](./rules.md) - Detailed rule documentation
- [API Reference](./api.md) - Programmatic usage
- [Output Formats](./output-formats.md) - Format-specific configuration
- [Examples](../examples/) - Working configuration examples
