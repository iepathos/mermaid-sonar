---
number: 001
title: Foundation & Core Analysis
category: foundation
priority: critical
status: draft
dependencies: []
created: 2025-11-15
---

# Specification 001: Foundation & Core Analysis

**Category**: foundation
**Priority**: critical
**Status**: draft
**Dependencies**: None

## Context

Mermaid-Sonar is a research-backed complexity analyzer and readability linter for Mermaid diagrams. Like sonar detects underwater obstacles, this tool detects hidden complexity issues in diagram code before they cause readability problems.

The foundation stage establishes the core project structure, TypeScript configuration, testing infrastructure, and basic complexity metrics needed for all subsequent features. This is the critical first step that all other specifications depend on.

## Objective

Set up a TypeScript-based CLI project with core graph analysis capabilities, including extracting Mermaid diagrams from markdown files and calculating fundamental complexity metrics (node count, edge count, graph density).

## Requirements

### Functional Requirements

- Extract Mermaid diagrams from markdown files with accurate line number tracking
- Parse Mermaid diagram content to identify nodes and edges
- Calculate core graph metrics: node count, edge count, graph density, max branch width, average degree
- Provide basic CLI interface for analyzing single files
- Output human-readable analysis results to terminal

### Non-Functional Requirements

- TypeScript-first with strict type checking enabled
- Zero rendering dependencies (no Puppeteer or mmdc required)
- Fast analysis performance (<100ms for typical diagrams)
- Comprehensive test coverage (unit tests for all core functions)
- Clean, maintainable code structure following functional programming principles
- Support Node.js 18+

## Acceptance Criteria

- [ ] Project builds successfully with TypeScript compiler
- [ ] Can extract Mermaid code blocks from markdown files with correct line numbers
- [ ] Accurately counts unique nodes in flowchart diagrams
- [ ] Accurately counts edges/connections in flowchart diagrams
- [ ] Calculates graph density using formula: `edges / (nodes × (nodes-1))`
- [ ] Calculates max branch width (maximum children from single node)
- [ ] Calculates average degree (average connections per node)
- [ ] CLI accepts file path as argument and outputs analysis
- [ ] All core metrics have unit tests with known fixture inputs
- [ ] Test suite runs and passes with `npm test`
- [ ] Build produces executable CLI with `npm run build`
- [ ] Code passes ESLint and Prettier checks

## Technical Details

### Implementation Approach

1. **Project Setup**
   - Initialize npm project with TypeScript configuration
   - Configure tsup or esbuild for fast bundling
   - Set up Jest with TypeScript support
   - Configure ESLint with TypeScript parser and Prettier integration
   - Create basic directory structure following plan architecture

2. **Diagram Extraction**
   - Port existing `validate-mermaid.js` extraction logic to TypeScript
   - Use regex to find ```mermaid code blocks in markdown
   - Track start line numbers for error reporting
   - Return structured Diagram objects with content, line numbers, and file path

3. **Graph Analysis**
   - Parse diagram content using regex patterns (no AST parsing in Stage 1)
   - Identify nodes by patterns like `A[label]`, `A{label}`, `A((label))`, etc.
   - Deduplicate nodes using Set data structure
   - Identify edges by arrow patterns: `-->`, `-.->`, `==>`, etc.
   - Calculate metrics using pure functions with no side effects

### Architecture Changes

New directory structure:

```
src/
├── extractors/
│   ├── markdown.ts          # Extract diagrams from .md files
│   └── types.ts             # Diagram type definitions
├── analyzers/
│   ├── structure.ts         # Graph structure analysis
│   └── types.ts             # Metrics type definitions
├── cli.ts                   # CLI entry point
└── index.ts                 # Main exports
tests/
├── fixtures/
│   ├── simple.md           # Simple test diagram
│   ├── complex.md          # Complex test diagram
│   └── edge-cases.md       # Edge case diagrams
└── unit/
    ├── extractor.test.ts   # Diagram extraction tests
    └── analyzer.test.ts    # Metrics calculation tests
```

### Data Structures

```typescript
interface Diagram {
  content: string;      // Raw Mermaid code
  startLine: number;    // Line number in source file
  filePath: string;     // Source file path
  type: DiagramType;    // flowchart, graph, etc.
}

type DiagramType = 'flowchart' | 'graph' | 'unknown';

interface Metrics {
  nodeCount: number;           // Unique node count
  edgeCount: number;           // Connection count
  graphDensity: number;        // edges / (nodes × (nodes-1))
  maxBranchWidth: number;      // Max children from single node
  averageDegree: number;       // Average connections per node
}

interface AnalysisResult {
  diagram: Diagram;
  metrics: Metrics;
}
```

### APIs and Interfaces

```typescript
// Extractor API
export function extractDiagrams(content: string, filePath: string): Diagram[];

// Analyzer API
export function analyzeStructure(diagram: Diagram): Metrics;

// CLI API
export function analyzeDiagramFile(filePath: string): AnalysisResult[];
```

## Dependencies

- **Prerequisites**: None (foundation specification)
- **Affected Components**: None (new project)
- **External Dependencies**:
  - Production: None in Stage 1
  - Development: `typescript`, `tsup`, `jest`, `@types/jest`, `@types/node`, `eslint`, `prettier`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`

## Testing Strategy

### Unit Tests

- **Diagram Extraction**
  - Single diagram extraction
  - Multiple diagrams in one file
  - Diagrams with various fence types (```mermaid, ~~~mermaid)
  - Line number accuracy
  - Empty files and files without diagrams

- **Node Counting**
  - Simple nodes: `A`, `B`, `C`
  - Labeled nodes: `A[label]`, `B{decision}`, `C((circle))`
  - Deduplication: same node referenced multiple times
  - Various node shapes and syntaxes

- **Edge Counting**
  - Different arrow types: `-->`, `-.->`, `==>`, `-..->`
  - Labeled edges: `A -->|label| B`
  - Multiple edges between same nodes

- **Metric Calculations**
  - Graph density with known inputs
  - Max branch width detection
  - Average degree calculation
  - Edge cases: single node, disconnected graphs

### Integration Tests

- Read actual markdown file
- Extract and analyze multiple diagrams
- CLI execution end-to-end
- Output format verification

### Test Fixtures

Create fixture files with known complexity:

1. **simple.md**: 5 nodes, 4 edges, linear flow
2. **complex.md**: 20 nodes, 30 edges, branching structure
3. **edge-cases.md**: Empty diagram, single node, disconnected components

## Documentation Requirements

### Code Documentation

- JSDoc comments for all public functions
- Type annotations for all function parameters and return values
- Inline comments explaining non-obvious regex patterns
- README with basic usage examples

### User Documentation

- Installation instructions
- Basic CLI usage
- Example output
- Supported Mermaid diagram types

### Architecture Updates

Create initial ARCHITECTURE.md documenting:
- Project structure
- Key design decisions (TypeScript-first, zero rendering deps)
- Core data flow
- Extension points for future stages

## Implementation Notes

### Regex Patterns

**Node Detection**:
- Basic: `/\b([A-Z][A-Z0-9]*)\b/g`
- With shapes: `/\b([A-Z][A-Z0-9]*)\s*[\[\{\(\)]/g`
- Extract node ID before shape characters

**Edge Detection**:
- Arrows: `/(-->|==>|-.->|===>|<-->|<-.->|o--|x--)/g`
- Count matches to get edge count

**Diagram Type Detection**:
- `/^\s*(graph|flowchart)\s+(TD|LR|TB|RL)/m`

### Known Limitations

- Stage 1 uses regex parsing, not full AST parsing
- Only supports flowchart and graph diagram types
- No syntax validation (assumes valid Mermaid code)
- No support for subgraphs in metric calculations (added in Stage 3)

### Performance Considerations

- Use Set for O(1) node deduplication
- Single-pass regex matching where possible
- Lazy loading of file contents
- No external process spawning

## Migration and Compatibility

No migration needed (new project). Ensure compatibility with:
- Node.js 18.x LTS (minimum version)
- Node.js 20.x LTS (tested version)
- Node.js 22.x (latest version)

Support for both CommonJS and ESM module systems via dual package exports in package.json.

## Success Criteria

Project is ready for Stage 2 when:

1. `npm install` completes without errors
2. `npm run build` produces executable CLI in dist/
3. `npm test` runs all tests with >80% coverage
4. `npm run lint` passes without errors
5. CLI can analyze a real markdown file and output metrics
6. All acceptance criteria are met
7. Code follows functional programming principles (pure functions, immutability)
