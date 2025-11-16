# Architecture

Mermaid-Sonar is a TypeScript-based analyzer for detecting complexity in Mermaid diagrams. This document outlines the project structure, key design decisions, data flow, and extension points.

## Project Structure

```
mermaid-sonar/
├── src/
│   ├── extractors/          # Diagram extraction from markdown
│   │   ├── markdown.ts      # Core extraction logic
│   │   └── types.ts         # Diagram type definitions
│   ├── analyzers/           # Metric calculation and analysis
│   │   ├── structure.ts     # Graph structure metrics
│   │   └── types.ts         # Metrics type definitions
│   ├── cli.ts               # Command-line interface
│   └── index.ts             # Public API exports
├── tests/
│   ├── fixtures/            # Test markdown files with diagrams
│   │   ├── simple.md        # Basic test cases
│   │   ├── complex.md       # Complex diagram scenarios
│   │   └── edge-cases.md    # Edge cases and boundaries
│   └── unit/                # Unit tests
│       ├── extractor.test.ts
│       └── analyzer.test.ts
├── dist/                    # Compiled output (CJS + ESM)
└── specs/                   # Implementation specifications
```

### Module Organization

The project follows a **functional programming** approach with clear separation of concerns:

- **Extractors**: Pure functions for parsing markdown and extracting diagrams
- **Analyzers**: Pure functions for calculating metrics from diagram data
- **CLI**: Thin imperative shell for user interaction
- **Core API**: Composition layer exposing high-level functions

## Key Design Decisions

### 1. TypeScript-First Implementation

**Decision**: Build the analyzer in TypeScript with zero runtime dependencies on diagram rendering.

**Rationale**:
- Static typing provides compile-time safety and better IDE support
- Text-based analysis enables fast execution without rendering overhead
- Reduces complexity by avoiding browser/DOM dependencies
- Enables usage in any JavaScript environment (Node.js, browsers, CI/CD)

**Tradeoffs**:
- Regex-based parsing is less accurate than full AST parsing
- May miss some edge cases in complex diagram syntax
- Future stages may require more sophisticated parsing

### 2. Functional Programming Principles

**Decision**: Use pure functions with immutable data and explicit data flow.

**Implementation**:
- All extractor and analyzer functions are pure (no side effects)
- I/O operations isolated to boundaries (file reading in extractors, console output in CLI)
- Function composition over class hierarchies
- Data transformations over mutations

**Benefits**:
- Easy to test (no mocks needed for pure functions)
- Predictable behavior and debugging
- Composable and reusable functions
- Simple mental model

### 3. Regex-Based Parsing

**Decision**: Use regular expressions for diagram parsing instead of full parser.

**Rationale**:
- Sufficient for foundation metrics (nodes, edges, density)
- Fast implementation with minimal dependencies
- Good enough for 80% of common diagram patterns
- Can be extended with proper parser in future stages

**Limitations**:
- May not handle all Mermaid syntax variations
- Complex nested structures could be missed
- No semantic understanding of diagram meaning

**Future Path**: Stage 2+ can introduce proper parser if needed for advanced metrics.

### 4. Dual Module Format (CJS + ESM)

**Decision**: Compile to both CommonJS and ES Modules using tsup.

**Rationale**:
- CJS for compatibility with older Node.js projects
- ESM for modern tooling and tree-shaking
- Minimal build configuration with tsup
- Supports both `require()` and `import`

### 5. Zero Rendering Dependencies

**Decision**: No dependencies on Mermaid rendering libraries.

**Benefits**:
- Fast startup and execution
- Can run in any environment (no browser needed)
- Minimal attack surface
- Simple deployment

**Tradeoff**: Cannot validate if diagrams actually render correctly.

## Core Data Flow

### 1. Extraction Pipeline

```
Markdown File
    ↓
[Read File] (I/O boundary)
    ↓
Content String
    ↓
[Extract Diagrams] (pure function)
    ↓
Diagram[] { content, startLine, filePath, type }
```

**Key Functions**:
- `extractDiagramsFromFile(filePath: string): Diagram[]` - I/O wrapper
- `extractDiagrams(content: string, filePath: string): Diagram[]` - Pure extraction
- `detectDiagramType(content: string): DiagramType` - Type detection

**Extraction Strategy**:
1. Split markdown into lines
2. Track code fence state (`inMermaid` boolean)
3. Accumulate lines between ```mermaid and ```
4. Record accurate line numbers (1-indexed, starts after fence)
5. Detect diagram type from first line

### 2. Analysis Pipeline

```
Diagram
    ↓
[Extract Nodes] (pure function)
    ↓
Set<NodeID>
    ↓
[Count Edges] (pure function)
    ↓
EdgeCount
    ↓
[Calculate Metrics] (pure function)
    ↓
Metrics { nodeCount, edgeCount, graphDensity, maxBranchWidth, averageDegree }
```

**Key Functions**:
- `analyzeStructure(diagram: Diagram): Metrics` - Main analysis entry point
- `extractNodes(content: string): Set<string>` - Node identification
- `countEdges(content: string): number` - Edge counting
- `calculateDensity(nodes, edges): number` - Density metric
- `calculateMaxBranchWidth(content): number` - Branching analysis
- `calculateAverageDegree(nodes, edges): number` - Degree metric

**Analysis Strategy**:

**Node Extraction**:
1. Match node definitions: `A[label]`, `B{label}`, `C((label))`
2. Match edges to find referenced nodes: `A --> B`
3. Deduplicate using Set to get unique node IDs

**Edge Counting**:
- Regex match all arrow patterns: `-->`, `==>`, `-.->`, `<-->`, etc.
- Count total matches across entire diagram

**Metrics Calculation**:
- **Graph Density**: `edges / (nodes × (nodes - 1))` - measures connectivity
- **Max Branch Width**: Build adjacency map, find max children count
- **Average Degree**: `(2 × edges) / nodes` - average connections per node

### 3. End-to-End Flow

```
User Input (CLI)
    ↓
[Parse Args] (commander)
    ↓
File Paths
    ↓
[Extract Diagrams] → Diagram[]
    ↓
[Analyze Each] → AnalysisResult[]
    ↓
[Format Output] → Console
```

**CLI Flow**:
1. Parse command-line arguments with commander
2. Read and extract diagrams from each file
3. Analyze each diagram independently
4. Format results with chalk (colors)
5. Output to console with proper formatting

## Extension Points

This foundation provides clean extension points for future stages:

### 1. New Extractors (Stage 2+)

**Location**: `src/extractors/`

**Extension Strategy**:
```typescript
// Add new extractor type
export function extractFromJupyter(notebook: string): Diagram[] {
  // Implementation
}

// Update public API in src/index.ts
export { extractFromJupyter } from './extractors/jupyter';
```

**Future Extractors**:
- Jupyter notebooks (.ipynb)
- Standalone .mmd files
- HTML with embedded diagrams
- Git repository scanning

### 2. New Analyzers (Stage 2-3)

**Location**: `src/analyzers/`

**Extension Strategy**:
```typescript
// Add new analyzer module
// src/analyzers/cognitive.ts
export function analyzeCognitive(diagram: Diagram): CognitiveMetrics {
  return {
    cognitiveLoad: calculateCognitiveLoad(diagram),
    visualComplexity: calculateVisualComplexity(diagram),
    // ...
  };
}

// Compose with existing analyzers
export function analyzeComplete(diagram: Diagram): CompleteAnalysis {
  return {
    structure: analyzeStructure(diagram),
    cognitive: analyzeCognitive(diagram),
  };
}
```

**Planned Analyzers**:
- **Cognitive Load** (Stage 2): Working memory burden, element interactions
- **Layout Patterns** (Stage 3): Hierarchy detection, flow patterns, clustering
- **Best Practices** (Stage 2): Research-backed heuristics, readability checks

### 3. Output Formats (Stage 4) ✅ IMPLEMENTED

**Location**: `src/reporters/`

**Architecture**:
The reporter system uses a factory pattern with a unified interface:
```typescript
// src/reporters/types.ts
export type OutputFormat = 'console' | 'json' | 'markdown' | 'github' | 'junit';

export interface Reporter {
  format(results: AnalysisResult[], summary: Summary): string;
}

// src/reporters/index.ts
export function createReporter(format: OutputFormat, version: string): Reporter {
  switch (format) {
    case 'console': return new ConsoleReporter(version);
    case 'json': return new JSONReporter();
    case 'markdown': return new MarkdownReporter(version);
    case 'github': return new GitHubReporter(version);
    case 'junit': return new JUnitReporter();
  }
}
```

**Implemented Reporters**:
- **Console** (`src/reporters/console.ts`): Colorized terminal output with detailed metrics and issue formatting
- **JSON** (`src/reporters/json.ts`): Machine-readable JSON for CI/CD integration
- **Markdown** (`src/reporters/markdown.ts`): Formatted markdown reports with tables and emoji indicators
- **GitHub** (`src/reporters/github.ts`): GitHub-flavored markdown with collapsible sections
- **JUnit** (`src/reporters/junit.ts`): JUnit XML format for test result integration

**CLI Integration**:
```typescript
.option('-f, --format <format>', 'Output format (console, json, markdown, github, junit)', 'console')
.option('-o, --output <file>', 'Write output to file instead of stdout')
```

**Extension Points**:
Additional reporters can be added by:
1. Creating new reporter in `src/reporters/<name>.ts`
2. Implementing the `Reporter` interface
3. Adding to the factory in `src/reporters/index.ts`
4. Updating the `OutputFormat` type

**CLI Enhancements** (Stage 4):
The CLI was enhanced with comprehensive file discovery and control options:
- **File Discovery** (`src/cli/files.ts`): Recursive directory scanning with glob pattern support
- **Exit Code Management** (`src/cli/exit-codes.ts`): CI/CD-friendly exit codes (0 = success, 1 = errors/warnings with --strict, 2 = execution failure)
- **Control Flags**: `--quiet`, `--verbose`, `--recursive`, `--strict`, `--max-warnings`, `--no-rules`
- **Config Support**: Load thresholds and rules from `.mermaid-sonarrc.json` or package.json

### 4. Configuration System (Stage 5)

**Location**: `src/config/` (to be created)

**Extension Strategy**:
```typescript
// Already has cosmiconfig dependency
import { cosmiconfig } from 'cosmiconfig';

export interface Config {
  thresholds: {
    maxNodes: number;
    maxDensity: number;
    maxBranchWidth: number;
  };
  rules: {
    [ruleName: string]: 'error' | 'warn' | 'off';
  };
}

export async function loadConfig(): Promise<Config> {
  const explorer = cosmiconfig('mermaid-sonar');
  const result = await explorer.search();
  return result?.config ?? defaultConfig;
}
```

**Configuration Points**:
- Metric thresholds
- Rule enable/disable
- Custom severity levels
- Ignored patterns

### 5. Plugin System (Future)

**Location**: `src/plugins/` (to be created)

**Extension Strategy**:
```typescript
export interface Plugin {
  name: string;
  analyzers?: Analyzer[];
  formatters?: Formatter[];
  rules?: Rule[];
}

export function loadPlugin(pluginPath: string): Plugin {
  // Dynamic plugin loading
}
```

## Testing Strategy

### Current Test Coverage

- **Unit Tests**: 25 tests covering extractors and analyzers
- **Fixtures**: 3 markdown files with varied diagram complexity
- **Coverage**: >70% across all modules (enforced by Jest config)

### Test Organization

```
tests/
├── fixtures/              # Test data
│   ├── simple.md         # Basic 3-node diagrams
│   ├── complex.md        # 8+ nodes, multiple edges
│   └── edge-cases.md     # Empty, malformed, edge cases
└── unit/                 # Unit tests
    ├── extractor.test.ts # 13 extraction tests
    └── analyzer.test.ts  # 12 analysis tests
```

### Test Principles

1. **Pure Function Testing**: Most tests have no mocks (pure functions)
2. **Fixture-Based**: Real markdown files as test data
3. **Edge Case Coverage**: Empty diagrams, malformed syntax, boundary conditions
4. **Deterministic**: No flaky tests, no random data
5. **Fast**: All tests complete in <2 seconds

### Extension Testing

Future stages should:
- Add new fixtures for new diagram types
- Test new analyzers in isolation (pure functions)
- Integration tests for CLI workflows
- Performance tests for large diagram sets
- Snapshot tests for formatted output

## Build and Deployment

### Build Pipeline

```
TypeScript Source (src/)
    ↓
[TypeScript Compiler] (tsc --noEmit) - Type checking
    ↓
[tsup] - Bundling and compilation
    ↓
dist/
├── index.js      (CJS)
├── index.mjs     (ESM)
├── index.d.ts    (Types)
├── cli.js        (CJS)
└── cli.mjs       (ESM)
```

### Quality Gates

Pre-publish checks (enforced by `prepublishOnly` script):
1. Clean previous build
2. Compile TypeScript
3. Run all tests
4. Type checking (tsc --noEmit)
5. Linting (ESLint)
6. Format checking (Prettier)

### Package Distribution

- **Entry Points**: Dual CJS/ESM exports
- **CLI Binary**: `mermaid-sonar` command installed globally
- **Type Definitions**: Full TypeScript support with .d.ts files
- **Source Maps**: Included for debugging

## Performance Considerations

### Current Performance Profile

- **Extraction**: O(n) where n = lines in markdown file
- **Node Detection**: O(m) where m = lines in diagram (regex scanning)
- **Edge Counting**: O(m) single pass through diagram
- **Metrics**: O(m) additional passes for branching analysis

### Optimization Opportunities

1. **Caching**: Diagram extraction results could be cached by file hash
2. **Parallel Analysis**: Multiple files could be processed in parallel
3. **Lazy Evaluation**: Only calculate requested metrics
4. **Parser Upgrade**: Replace regex with proper parser for complex diagrams

### Scalability Targets

- **Single File**: <10ms for typical markdown file
- **Repository Scan**: <1s for 100 files
- **Large Diagram**: <100ms for 50+ node diagram

## Security Considerations

### Threat Model

- **Input**: Untrusted markdown files (user content, repositories)
- **Output**: Console output, file writes (formatted reports)
- **Execution**: Local file system access, no network

### Mitigations

1. **No Code Execution**: Pure text analysis, no eval() or dynamic imports
2. **File System Isolation**: Only reads files provided by user
3. **Regex Safety**: No ReDoS vulnerabilities (tested patterns)
4. **Dependency Auditing**: Regular npm audit and updates
5. **TypeScript Safety**: Strict type checking prevents many bugs

### Future Considerations

- Configuration file validation
- Plugin sandboxing
- Rate limiting for large repository scans

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Run tests in watch mode
npm run test:watch

# Run CLI in development mode
npm run dev -- path/to/file.md

# Type checking
npm run typecheck

# Linting and formatting
npm run lint
npm run format
```

### Contribution Guidelines

1. **Test First**: Write tests before implementation
2. **Pure Functions**: Keep logic pure, I/O at boundaries
3. **Type Safety**: No `any` types without justification
4. **Documentation**: Update ARCHITECTURE.md for structural changes
5. **Incremental**: Small commits that pass all tests

## Future Architecture Evolution

### Stage 2: Research-Backed Heuristics

**Changes**:
- Add `src/analyzers/cognitive.ts` for cognitive load metrics
- Add `src/analyzers/heuristics.ts` for best practice rules
- Extend `Metrics` type with new fields
- Update CLI to show rule violations

**Compatibility**: Additive changes, no breaking changes to existing API

### Stage 3: Layout Pattern Intelligence

**Changes**:
- Add `src/analyzers/layout.ts` for pattern detection
- Introduce graph algorithms (may need dependency)
- Add clustering and hierarchy detection
- Extend analysis results with pattern insights

**Compatibility**: New analyzer module, existing modules unchanged

### Stage 4: Output Formats

**Changes**:
- Add `src/formatters/` module
- Update CLI with `--format` flag
- Add `--output` file writing support
- Implement SARIF, JSON, Markdown formatters

**Compatibility**: CLI flag additions, programmatic API unchanged

### Stage 5: Polish and Release

**Changes**:
- Add `src/config/` for configuration loading
- Add plugin system infrastructure
- Performance optimizations
- Documentation and guides

**Compatibility**: Configuration is optional, defaults maintain current behavior

## Dependencies and Rationale

### Production Dependencies

- **chalk**: Terminal colors for CLI output (better UX)
- **commander**: CLI argument parsing (standard, well-maintained)
- **cosmiconfig**: Configuration file loading (future-ready for Stage 5)
- **glob**: File pattern matching for batch processing

### Development Dependencies

- **TypeScript**: Static typing and modern JavaScript features
- **Jest + ts-jest**: Testing framework with TypeScript support
- **tsup**: Zero-config bundler for TypeScript libraries
- **ESLint + Prettier**: Code quality and formatting
- **tsx**: Fast TypeScript execution for development

### Dependency Philosophy

- **Minimal Runtime Dependencies**: Keep the dependency tree small
- **Standard Tools**: Use well-established, maintained libraries
- **Dev-Only Heavy Tools**: Complex tools only in devDependencies
- **No Framework Lock-In**: Avoid heavy frameworks, prefer composable utilities

## Conclusion

Mermaid-Sonar's architecture prioritizes:

1. **Simplicity**: Pure functions, clear data flow, minimal abstraction
2. **Extensibility**: Clean module boundaries with obvious extension points
3. **Type Safety**: Full TypeScript coverage with strict checks
4. **Testability**: Pure functions enable easy testing without mocks
5. **Performance**: Fast text-based analysis without rendering overhead

The foundation established in Stage 1 provides a solid base for adding research-backed heuristics, layout intelligence, and multiple output formats in future stages.

## Spec 002: Research-Backed Heuristics and Rule System

### Overview

Spec 002 introduces a pluggable rule system that validates diagrams against research-backed complexity thresholds. The system provides configurable warnings and errors based on cognitive load research and performance considerations.

### Rule System Architecture

```
src/
├── rules/
│   ├── types.ts                  # Core rule interfaces
│   ├── index.ts                  # Rule registry
│   ├── max-edges.ts              # Connection complexity rule  
│   ├── cognitive-load.ts         # High/low density rules
│   └── cyclomatic-complexity.ts  # Decision complexity rule
├── config/
│   ├── types.ts                  # Configuration types
│   ├── defaults.ts               # Default thresholds
│   ├── loader.ts                 # Config file loading (cosmiconfig)
│   └── index.ts                  # Config module exports
```

### Rule Interface

All rules implement the `Rule` interface:

```typescript
interface Rule {
  name: string;                    // Unique identifier
  defaultSeverity: Severity;       // 'error' | 'warning' | 'info'
  defaultThreshold?: number;       // Default threshold value
  check(diagram, metrics, config): Issue | null;  // Validation logic
}
```

Rules are pure functions that:
- Accept diagram content and pre-calculated metrics
- Return an Issue if threshold exceeded, null otherwise
- Include research citations and actionable suggestions

### Implemented Rules

#### 1. Max Edges Rule (`max-edges`)

**Purpose**: Detects when edge count exceeds O(n²) performance threshold  
**Default Threshold**: 100 edges  
**Severity**: error  
**Research**: [Mermaid Official Docs](https://docs.mermaidchart.com/blog/posts/flow-charts-are-on2-complex-so-dont-go-over-100-connections)

#### 2. High-Density Cognitive Load (`max-nodes-high-density`)

**Purpose**: Warns when dense diagrams exceed cognitive capacity  
**Condition**: `nodeCount > 50 AND density > 0.3`  
**Severity**: warning  
**Research**: arXiv:2008.07944 (cognitive load research)

#### 3. Low-Density Cognitive Load (`max-nodes-low-density`)

**Purpose**: Warns when sparse diagrams have too many nodes  
**Condition**: `nodeCount > 100 AND density ≤ 0.3`  
**Severity**: warning  
**Research**: arXiv:2008.07944

#### 4. Cyclomatic Complexity (`cyclomatic-complexity`)

**Purpose**: Detects excessive decision complexity  
**Formula**: `complexity = decisionNodes + 1`  
**Default Threshold**: 10  
**Severity**: warning  
**Research**: McCabe's Cyclomatic Complexity (IEEE standards)

### Configuration System

Uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) for flexible configuration loading:

**Search Order**:
1. `.sonarrc.json`
2. `.sonarrc.yml` / `.sonarrc.yaml`
3. `package.json` → `"mermaid-sonar"` field

**Configuration Format**:

```json
{
  "rules": {
    "max-edges": {
      "enabled": true,
      "severity": "error",
      "threshold": 100
    },
    "max-nodes-high-density": {
      "enabled": true,
      "severity": "warning",
      "threshold": 50,
      "densityThreshold": 0.3
    }
  }
}
```

**Features**:
- Partial configuration merges with defaults
- Individual rules can be enabled/disabled
- Custom thresholds per rule
- Override severity levels
- No caching (for testing reliability)

### Data Flow

```
Markdown File
    ↓
extractDiagrams()
    ↓
analyzeStructure() → Metrics
    ↓
loadConfig() → Configuration
    ↓
runRules(diagram, metrics, config)
    ↓
[Rule1.check(), Rule2.check(), ...]
    ↓
Issues[] (violations with citations)
    ↓
CLI Output / Programmatic API
```

### Extension Points

#### Adding New Rules

1. Create rule file in `src/rules/`:

```typescript
export const myCustomRule: Rule = {
  name: 'my-custom-rule',
  defaultSeverity: 'warning',
  defaultThreshold: 42,
  check(diagram, metrics, config) {
    if (metrics.someMetric > config.threshold) {
      return {
        rule: this.name,
        severity: config.severity ?? this.defaultSeverity,
        message: 'Custom violation detected',
        filePath: diagram.filePath,
        line: diagram.startLine,
        suggestion: 'How to fix this',
        citation: 'https://research-paper.com'
      };
    }
    return null;
  }
};
```

2. Register in `src/rules/index.ts`:

```typescript
import { myCustomRule } from './my-custom-rule';

const ruleRegistry = new Map([
  // ... existing rules
  [myCustomRule.name, myCustomRule],
]);
```

3. Add to config types in `src/config/types.ts`
4. Add default config in `src/config/defaults.ts`
5. Write tests in `tests/unit/rules.test.ts`

### Research Citations

All thresholds are backed by published research or official documentation:

- **Max Edges (100)**: Mermaid rendering complexity documentation
- **Node Limits (50/100)**: Cognitive load research on diagram comprehension
- **Cyclomatic Complexity (10)**: Software engineering standards (McCabe)
- **Density Threshold (0.3)**: Graph theory best practices

### Testing Strategy

- **Unit Tests**: Each rule tested with fixtures that trigger/don't trigger
- **Boundary Tests**: Test threshold boundaries (49 vs 50, 99 vs 100)
- **Config Tests**: Verify custom thresholds and severity overrides
- **Integration Tests**: Full analysis pipeline with rules enabled/disabled

Test fixtures:
- `high-density.md`: Triggers high-density rule
- `low-density.md`: Triggers low-density rule  
- `too-many-edges.md`: Triggers max-edges rule
- `complex-decisions.md`: Triggers cyclomatic complexity
- `clean.md`: Triggers no rules (baseline)

### CLI Integration

Rules are enabled by default. Users can:

```bash
# Run with all rules
mermaid-sonar diagram.md

# Disable rules (metrics only)
mermaid-sonar --no-rules diagram.md
```

**Output Format**:
- Errors in red, warnings in yellow, info in blue
- Research citations included
- Actionable suggestions provided
- Exit code 1 if errors found, 0 otherwise

### Future Enhancements

Potential additions for later specs:
- Rule severity profiles (strict/relaxed)
- Custom rule plugins
- Rule disable comments in diagrams
- Performance profiling per rule
- Machine learning-based thresholds

