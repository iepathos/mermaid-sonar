---
number: 004
title: Output Formats & Integration
category: compatibility
priority: high
status: draft
dependencies: [001, 002, 003]
created: 2025-11-15
---

# Specification 004: Output Formats & Integration

**Category**: compatibility
**Priority**: high
**Status**: draft
**Dependencies**: Spec 001, 002, 003 (all analysis stages)

## Context

Different use cases require different output formats. Developers need colorized terminal output for local development, CI/CD systems need machine-readable JSON with exit codes, GitHub Actions benefits from inline annotations, and test reporters can consume JUnit XML.

This specification adds multiple output formats, enhanced CLI capabilities (glob support, recursive scanning), and CI/CD integration features to make mermaid-sonar work seamlessly in various environments.

## Objective

Implement multiple output formats (human-readable terminal, JSON, Markdown, GitHub Actions annotations, JUnit XML) and enhance CLI with glob patterns, recursive directory scanning, config file discovery, and quiet/verbose modes for flexible integration.

## Requirements

### Functional Requirements

- **Terminal Output**: Colorized, human-readable output with file locations and actionable recommendations
- **JSON Output**: Structured machine-readable format with all metrics and issues
- **Markdown Output**: Report format with tables and summaries
- **GitHub Actions Output**: Annotations format for inline PR comments
- **JUnit XML Output**: XML format for Jenkins and other CI tools
- **Glob Support**: Accept file patterns like `docs/**/*.md`
- **Recursive Scanning**: Scan entire directories recursively
- **Config Discovery**: Search for config file up directory tree
- **Exit Codes**: Proper exit codes for CI/CD (0 = pass, 1 = errors found, 2 = execution error)
- **Quiet Mode**: Suppress all output except errors
- **Verbose Mode**: Show detailed analysis information
- **Summary Statistics**: Display summary of files analyzed, issues found, etc.

### Non-Functional Requirements

- Fast file scanning (handle 1000+ files efficiently)
- Streaming output for large repositories
- Memory-efficient processing (don't load all files at once)
- Consistent output format across all reporters
- Proper error handling and user-friendly error messages
- Cross-platform compatibility (Windows, macOS, Linux)

## Acceptance Criteria

- [ ] Default terminal output is colorized with chalk or similar
- [ ] Terminal output shows file paths, line numbers, and issue messages
- [ ] Terminal output includes summary statistics (files, diagrams, issues)
- [ ] `--format json` outputs valid JSON with all metrics and issues
- [ ] `--format markdown` outputs readable Markdown report
- [ ] `--format github` outputs GitHub Actions annotation commands
- [ ] `--format junit` outputs valid JUnit XML
- [ ] CLI accepts glob patterns: `mermaid-sonar "docs/**/*.md"`
- [ ] CLI accepts multiple file arguments: `mermaid-sonar file1.md file2.md`
- [ ] CLI accepts directory for recursive scanning: `mermaid-sonar docs/`
- [ ] `--recursive` flag enables recursive directory traversal
- [ ] Config file discovered automatically (search up tree)
- [ ] `--config` flag specifies explicit config file path
- [ ] Exit code 0 when no errors found
- [ ] Exit code 1 when errors found (configurable severity threshold)
- [ ] Exit code 2 when CLI execution fails (invalid args, file not found)
- [ ] `--quiet` suppresses info/warning output (only errors)
- [ ] `--verbose` shows detailed metric breakdown
- [ ] JSON output schema is documented and validated
- [ ] All output formats tested with integration tests
- [ ] Cross-platform path handling works correctly

## Technical Details

### Implementation Approach

1. **Reporter Architecture**
   - Abstract `Reporter` interface implemented by each format
   - Each reporter receives `AnalysisResult[]` and formats appropriately
   - CLI selects reporter based on `--format` flag
   - Reporters write to stdout (or file if `--output` specified)

2. **File Discovery**
   - Use `glob` package for pattern matching
   - Support multiple patterns: `mermaid-sonar "*.md" "docs/**/*.md"`
   - Recursive directory scanning with `--recursive`
   - Filter to `.md` files by default (configurable)

3. **CLI Enhancement**
   - Use `commander` or `yargs` for argument parsing
   - Support common flags: `--format`, `--config`, `--quiet`, `--verbose`, `--output`
   - Validate arguments before processing
   - Show helpful error messages for invalid input

4. **Exit Code Strategy**
   - Success (no issues): exit 0
   - Errors found: exit 1
   - Warnings only: exit 0 (unless `--strict` mode)
   - Execution failure: exit 2
   - `--max-warnings` flag to fail on warning threshold

### Architecture Changes

New modules:

```
src/
├── reporters/
│   ├── reporter.ts          # Reporter interface (new)
│   ├── console.ts           # Terminal reporter (new)
│   ├── json.ts              # JSON reporter (new)
│   ├── markdown.ts          # Markdown reporter (new)
│   ├── github.ts            # GitHub Actions reporter (new)
│   └── junit.ts             # JUnit XML reporter (new)
├── cli/
│   ├── args.ts              # Argument parsing (new)
│   ├── files.ts             # File discovery (new)
│   └── exit-codes.ts        # Exit code constants (new)
└── cli.ts                   # Enhanced CLI (update)
```

### Data Structures

```typescript
interface Reporter {
  format(results: AnalysisResult[]): string;
  write(output: string, destination?: string): Promise<void>;
}

interface CLIOptions {
  files: string[];                  // File patterns or paths
  format: OutputFormat;             // Output format
  output?: string;                  // Output file (stdout if not specified)
  config?: string;                  // Explicit config path
  quiet: boolean;                   // Suppress non-error output
  verbose: boolean;                 // Show detailed info
  recursive: boolean;               // Recursive directory scan
  strict: boolean;                  // Treat warnings as errors
  maxWarnings?: number;             // Max warnings before failure
}

type OutputFormat = 'console' | 'json' | 'markdown' | 'github' | 'junit';

interface Summary {
  filesAnalyzed: number;
  diagramsAnalyzed: number;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  duration: number;                 // Analysis duration in ms
}

interface JSONOutput {
  summary: Summary;
  results: AnalysisResult[];
  config: Config;
  version: string;
}
```

### APIs and Interfaces

```typescript
// Reporter Factory
export function createReporter(format: OutputFormat): Reporter;

// File Discovery
export async function findFiles(
  patterns: string[],
  options: { recursive?: boolean }
): Promise<string[]>;

// CLI
export async function runCLI(args: string[]): Promise<number>; // exit code

// Summary
export function generateSummary(results: AnalysisResult[]): Summary;
```

### Output Format Examples

**Console Output**:
```
Analyzing 3 files...

docs/architecture.md
  15:1  error    Too many connections (120 > 100)  max-edges
  15:1  warning  High-density diagram (60 nodes)   max-nodes-high-density
  15:1  info     Consider LR layout                layout-hint

docs/workflow.md
  ✓ No issues found

docs/api.md
  42:1  warning  Label too long (52 characters)    long-labels

3 files analyzed, 3 diagrams found
2 errors, 2 warnings, 1 info
```

**JSON Output**:
```json
{
  "summary": {
    "filesAnalyzed": 3,
    "diagramsAnalyzed": 3,
    "totalIssues": 5,
    "errorCount": 2,
    "warningCount": 2,
    "infoCount": 1,
    "duration": 142
  },
  "results": [
    {
      "filePath": "docs/architecture.md",
      "diagrams": [
        {
          "startLine": 15,
          "metrics": {
            "nodeCount": 60,
            "edgeCount": 120,
            "graphDensity": 0.51
          },
          "issues": [
            {
              "rule": "max-edges",
              "severity": "error",
              "message": "Too many connections (120 > 100)",
              "line": 15,
              "suggestion": "Split into multiple diagrams..."
            }
          ]
        }
      ]
    }
  ],
  "version": "1.0.0"
}
```

**GitHub Actions Output**:
```
::error file=docs/architecture.md,line=15::Too many connections (120 > 100)
::warning file=docs/architecture.md,line=15::High-density diagram (60 nodes)
::notice file=docs/api.md,line=42::Label too long (52 characters)
```

**JUnit XML Output**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="mermaid-sonar" tests="3" failures="2" errors="0">
  <testsuite name="docs/architecture.md" tests="1" failures="1">
    <testcase name="Diagram at line 15" classname="architecture">
      <failure message="Too many connections (120 > 100)">
        max-edges: Too many connections (120 > 100)
        Suggestion: Split into multiple diagrams...
      </failure>
    </testcase>
  </testsuite>
</testsuites>
```

## Dependencies

- **Prerequisites**: Specs 001, 002, 003 (all analysis functionality)
- **Affected Components**:
  - CLI: major enhancement
  - All analyzers: must return consistent result format
- **External Dependencies**:
  - `chalk`: Terminal colors
  - `glob`: File pattern matching
  - `commander` or `yargs`: CLI argument parsing
  - `fast-xml-parser` (optional): JUnit XML generation

## Testing Strategy

### Unit Tests

- **Reporter Tests**
  - Each reporter formats results correctly
  - Empty results handled gracefully
  - Large result sets don't break formatting
  - Special characters escaped properly (XML, JSON)

- **File Discovery**
  - Single file path
  - Glob pattern matching
  - Recursive directory scanning
  - Non-existent file handling
  - Empty directory handling

- **Exit Code Logic**
  - No issues → exit 0
  - Errors found → exit 1
  - Warnings with --strict → exit 1
  - Invalid arguments → exit 2
  - Max warnings exceeded → exit 1

### Integration Tests

- Full CLI execution with each output format
- Multi-file analysis with glob patterns
- Config file discovery in nested directories
- Cross-platform path handling (Windows vs Unix)
- Large repository scanning (100+ files)

### Test Fixtures

1. **Small repo**: 3 files, mixed issues → test all output formats
2. **Large repo**: 100 files → test performance and memory
3. **Windows paths**: Ensure Windows path handling works
4. **Config in parent**: Test config discovery up directory tree

## Documentation Requirements

### Code Documentation

- Document each reporter's output format
- Document CLI options with examples
- Document exit codes and when each is used
- Type definitions for all output structures

### User Documentation

- **CLI Reference**: Complete documentation of all flags and options
- **Output Formats Guide**: When to use each format with examples
- **Integration Examples**:
  - GitHub Actions workflow
  - GitLab CI pipeline
  - Jenkins pipeline
  - Pre-commit hook
  - VS Code task
- **Exit Codes**: Document exit code meanings for CI/CD

### Architecture Updates

Update ARCHITECTURE.md with:
- Reporter architecture and extension points
- File discovery strategy
- CLI design and argument parsing
- How to add new output formats

## Implementation Notes

### CLI Arguments

```bash
# Basic usage
mermaid-sonar docs/README.md

# Multiple files
mermaid-sonar file1.md file2.md file3.md

# Glob patterns
mermaid-sonar "docs/**/*.md"

# Recursive directory
mermaid-sonar docs/ --recursive

# JSON output
mermaid-sonar docs/ --format json

# Save to file
mermaid-sonar docs/ --format markdown --output report.md

# Quiet mode (CI/CD)
mermaid-sonar docs/ --quiet

# Strict mode (warnings = errors)
mermaid-sonar docs/ --strict

# Custom config
mermaid-sonar docs/ --config .sonar-custom.json

# Verbose analysis
mermaid-sonar docs/ --verbose
```

### GitHub Actions Integration

Example workflow:

```yaml
name: Diagram Complexity Check

on: [pull_request]

jobs:
  lint-diagrams:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g mermaid-sonar
      - run: mermaid-sonar "docs/**/*.md" --format github
```

### Performance Considerations

- Stream file processing (don't load all files into memory)
- Use async/await for file I/O
- Batch file discovery for large globs
- Cache config file location (don't search for each file)
- Consider worker threads for parallel processing (future enhancement)

## Migration and Compatibility

### Breaking Changes

- Default output format changes from simple text to colorized terminal
- Exit code now reflects issue severity (previously always 0)

### Migration Path

- Add `--format console` for new colorized output
- Add `--format plain` for old-style simple output (compatibility)
- Document exit code changes for CI/CD users

### Compatibility Notes

- All existing functionality remains available
- Config file format unchanged
- Analysis behavior unchanged (only output format changes)

## Success Criteria

Stage 4 complete when:

1. All 5 output formats implemented and tested
2. CLI supports glob patterns and recursive scanning
3. Config file discovery works correctly
4. Exit codes properly reflect analysis results
5. Integration examples documented for major CI/CD platforms
6. Test coverage remains >80%
7. Performance handles large repositories (100+ files) efficiently
8. All acceptance criteria met
9. No regression in Stages 1-3 functionality
10. Cross-platform compatibility verified (Windows, macOS, Linux)
