---
number: 002
title: Research-Backed Heuristics
category: foundation
priority: critical
status: draft
dependencies: [001]
created: 2025-11-15
---

# Specification 002: Research-Backed Heuristics

**Category**: foundation
**Priority**: critical
**Status**: draft
**Dependencies**: Spec 001 (Foundation & Core Analysis)

## Context

Research in cognitive psychology and software engineering has established concrete thresholds for comprehensibility. The famous "Miller's Law" suggests humans can hold 7±2 items in working memory. For diagrams, research shows that complexity beyond certain thresholds significantly degrades comprehension.

This specification implements evidence-based rules that warn when diagrams exceed cognitive load limits, connection complexity thresholds (O(n²) rendering), and decision complexity (cyclomatic complexity).

## Objective

Implement configurable, research-backed complexity checks that detect when diagrams exceed cognitive load limits, connection complexity thresholds, or cyclomatic complexity limits, with all thresholds backed by published research or official documentation.

## Requirements

### Functional Requirements

- Check total connection count against 100-edge limit (O(n²) complexity threshold)
- Check node count against cognitive load thresholds: 50 nodes (high-density) and 100 nodes (low-density)
- Calculate and check cyclomatic complexity for decision-heavy diagrams
- Detect high-density diagrams (>50 nodes AND density >0.3) and warn appropriately
- Support configuration file for overriding default thresholds
- Enable/disable individual rules via configuration
- Set severity levels per rule (error, warning, info)
- Generate actionable warnings with research citations

### Non-Functional Requirements

- All thresholds must have documented research backing
- Rules must be independently configurable
- Fast rule evaluation (<10ms overhead per diagram)
- Clear, actionable warning messages
- Configuration must support JSON and YAML formats

## Acceptance Criteria

- [ ] Detects and warns when edge count exceeds 100 connections
- [ ] Detects and warns when node count exceeds 50 with density >0.3
- [ ] Detects and warns when node count exceeds 100 with density ≤0.3
- [ ] Calculates cyclomatic complexity from decision nodes (diamond shapes)
- [ ] Warns when cyclomatic complexity exceeds 10-15 (configurable)
- [ ] Loads configuration from `.sonarrc.json` or `.sonarrc.yml`
- [ ] Supports `package.json` field: `"mermaid-sonar": {...}`
- [ ] Each rule can be individually enabled/disabled in config
- [ ] Each rule can have custom thresholds in config
- [ ] Each rule can have custom severity (error, warning, info) in config
- [ ] Warning messages include research citations and links
- [ ] All rules have unit tests with fixtures that trigger them
- [ ] Configuration schema is documented and validated

## Technical Details

### Implementation Approach

1. **Rule System Architecture**
   - Create pluggable rule system where each heuristic is a separate rule
   - Each rule implements common interface: `Rule<T>`
   - Rules receive metrics and configuration, return issues
   - Rules are pure functions with no side effects

2. **Cognitive Load Rules**
   - **High-Density Rule**: `nodeCount > 50 && density > 0.3`
   - **Low-Density Rule**: `nodeCount > 100 && density <= 0.3`
   - Citations: arXiv:2008.07944 (cognitive load research)

3. **Connection Complexity Rule**
   - Check: `edgeCount > 100`
   - Rationale: Mermaid rendering is O(n²) in edges
   - Citation: Mermaid official docs

4. **Cyclomatic Complexity**
   - Detect decision nodes: `A{label}` (diamond shape)
   - Formula: `cyclomaticComplexity = decisionNodeCount + 1`
   - Threshold: Default 10 (configurable 10-15 range)
   - Based on software engineering standards (McCabe's cyclomatic complexity)

### Architecture Changes

New modules:

```
src/
├── rules/
│   ├── index.ts              # Rule registry
│   ├── rule.ts               # Rule interface and types
│   ├── max-nodes.ts          # Cognitive load node rules
│   ├── max-edges.ts          # Connection complexity rule
│   ├── graph-density.ts      # Density-based rules
│   └── cyclomatic.ts         # Cyclomatic complexity rule
├── config/
│   ├── defaults.ts           # Default configuration
│   ├── loader.ts             # Config file loader (cosmiconfig)
│   ├── schema.ts             # Config validation schema
│   └── types.ts              # Config type definitions
└── analyzers/
    └── cognitive-load.ts     # Cognitive load analysis (new)
```

### Data Structures

```typescript
interface Rule {
  name: string;                    // Rule identifier
  severity: Severity;              // Default severity
  check(metrics: Metrics, config: RuleConfig): Issue | null;
}

type Severity = 'error' | 'warning' | 'info';

interface Issue {
  rule: string;                    // Rule that triggered
  severity: Severity;              // Issue severity
  message: string;                 // Human-readable message
  filePath: string;                // Source file
  line: number;                    // Line number in file
  suggestion?: string;             // Actionable suggestion
  citation?: string;               // Research citation with URL
}

interface RuleConfig {
  enabled: boolean;                // Enable/disable rule
  severity?: Severity;             // Override default severity
  threshold?: number;              // Override threshold
  [key: string]: any;              // Rule-specific config
}

interface Config {
  rules: {
    'max-edges': RuleConfig;
    'max-nodes-high-density': RuleConfig;
    'max-nodes-low-density': RuleConfig;
    'cyclomatic-complexity': RuleConfig;
  };
}
```

### APIs and Interfaces

```typescript
// Rule Registry
export function registerRule(rule: Rule): void;
export function getRule(name: string): Rule | undefined;
export function getAllRules(): Rule[];

// Config Loader
export async function loadConfig(searchFrom?: string): Promise<Config>;
export function validateConfig(config: unknown): Config;

// Analysis with Rules
export function analyzeWithRules(
  diagram: Diagram,
  config: Config
): AnalysisResult;
```

### Configuration Schema

**Default `.sonarrc.json`**:

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
    },
    "max-nodes-low-density": {
      "enabled": true,
      "severity": "warning",
      "threshold": 100
    },
    "cyclomatic-complexity": {
      "enabled": true,
      "severity": "warning",
      "threshold": 10
    }
  }
}
```

## Dependencies

- **Prerequisites**: Spec 001 (must have core metrics calculated)
- **Affected Components**:
  - CLI: must load and apply configuration
  - Analyzers: must integrate rule evaluation
- **External Dependencies**:
  - `cosmiconfig`: Configuration file discovery and loading
  - `ajv` (optional): JSON schema validation for config

## Testing Strategy

### Unit Tests

- **Rule Evaluation**
  - Each rule tested with fixtures that trigger it
  - Each rule tested with fixtures that don't trigger it
  - Threshold boundary testing (49 vs 50 nodes, 99 vs 100 edges)
  - Custom severity and threshold configuration

- **Cyclomatic Complexity**
  - Diagrams with 0, 1, 5, 10, 15 decision nodes
  - Mixed node types (some diamonds, some squares)
  - Nested decisions

- **Configuration Loading**
  - Load from `.sonarrc.json`
  - Load from `.sonarrc.yml`
  - Load from `package.json` field
  - Config file discovery (search up directory tree)
  - Invalid config handling
  - Missing config (use defaults)

### Integration Tests

- Full analysis with custom config
- Multiple rules triggering on same diagram
- Config overrides changing analysis results
- CLI respects configuration file

### Test Fixtures

1. **high-density.md**: 60 nodes, density 0.5 → triggers high-density rule
2. **low-density.md**: 110 nodes, density 0.1 → triggers low-density rule
3. **too-many-edges.md**: 50 nodes, 120 edges → triggers max-edges rule
4. **complex-decisions.md**: 12 decision nodes → triggers cyclomatic rule
5. **clean.md**: 30 nodes, 35 edges, 2 decisions → triggers no rules

## Documentation Requirements

### Code Documentation

- JSDoc for all rule functions with examples
- Document research citations in code comments
- Document configuration options for each rule
- Type definitions for all config interfaces

### User Documentation

- **Configuration Guide**: Complete reference for all config options
- **Rule Catalog**: Each rule documented with:
  - Description and rationale
  - Research citation with links
  - Default threshold and how to override
  - Example diagrams that trigger the rule
  - Example config to customize behavior
- **Migration Guide**: How to migrate from Stage 1 to Stage 2

### Architecture Updates

Update ARCHITECTURE.md with:
- Rule system design and extension points
- Configuration loading strategy
- How to add new rules
- Research backing for all thresholds

## Implementation Notes

### Research Citations

All warning messages should include citations:

**Max Edges (100)**:
- Source: [Mermaid Official Docs](https://docs.mermaidchart.com/blog/posts/flow-charts-are-on2-complex-so-dont-go-over-100-connections)
- Rationale: O(n²) rendering complexity

**Max Nodes (50/100)**:
- Source: [arXiv:2008.07944](https://arxiv.org/abs/2008.07944)
- Rationale: Cognitive load research on diagram comprehension

**Cyclomatic Complexity (10)**:
- Source: Software engineering standards (McCabe)
- Rationale: Decision complexity threshold for maintainability

**Graph Density (0.3)**:
- Source: Graph theory best practices
- Rationale: High-density graphs become visual clutter

### Decision Node Detection

Detect decision nodes using regex:
```typescript
// Diamond shape: A{label}
const decisionPattern = /\b([A-Z][A-Z0-9]*)\s*\{[^}]*\}/g;
```

### Example Warning Messages

```
Error: Too many connections (120 > 100)
  File: docs/architecture.md:15

  This diagram has 120 connections, exceeding the recommended maximum of 100.
  Mermaid's rendering is O(n²) complex, which can cause performance issues.

  Suggestion: Split into multiple diagrams or use subgraphs to reduce complexity.

  Research: https://docs.mermaidchart.com/blog/posts/flow-charts-are-on2-complex-so-dont-go-over-100-connections
```

### Configuration File Discovery

Use cosmiconfig search strategy:
1. `.sonarrc.json`
2. `.sonarrc.yml`
3. `package.json` → `"mermaid-sonar"` field
4. Search up directory tree until found or reach root

## Migration and Compatibility

### Breaking Changes

None - this is additive to Stage 1.

### New Behavior

- Diagrams may now produce warnings/errors that didn't before
- Exit code may change if errors are found (for CI/CD integration)

### Compatibility Notes

- Config file is optional - defaults work without configuration
- Existing Stage 1 functionality remains unchanged
- All rules can be disabled via config for gradual adoption

## Success Criteria

Stage 2 complete when:

1. All 4 core rules implemented and tested
2. Configuration system loads from multiple formats
3. All thresholds documented with research citations
4. CLI respects configuration and generates proper warnings
5. Rule catalog documentation complete
6. Test coverage remains >80%
7. All acceptance criteria met
8. No regression in Stage 1 functionality
