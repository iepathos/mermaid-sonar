---
number: 003
title: Layout & Pattern Intelligence
category: optimization
priority: high
status: draft
dependencies: [001, 002]
created: 2025-11-15
---

# Specification 003: Layout & Pattern Intelligence

**Category**: optimization
**Priority**: high
**Status**: draft
**Dependencies**: Spec 001 (Foundation), Spec 002 (Heuristics)

## Context

Not all diagram structures are created equal. A sequential process benefits from left-to-right (LR) layout, while hierarchical relationships work better with top-down (TD). Many readability issues stem from using the wrong layout for the diagram's inherent structure.

This specification adds pattern detection to recognize diagram structure (sequential, hierarchical, branching) and provides intelligent recommendations for optimal layout, subgraph usage, and diagram organization.

## Objective

Implement pattern detection and layout recommendation system that analyzes diagram structure to suggest optimal layout direction (LR vs TD), identify subgraph opportunities, detect disconnected components, and provide actionable refactoring suggestions.

## Requirements

### Functional Requirements

- Detect sequential/linear progression patterns in diagrams
- Detect hierarchical tree structure patterns
- Detect wide parallel branching patterns
- Detect reconvergence patterns (fan-out then fan-in)
- Recommend LR layout for sequential processes, timelines, pipelines
- Recommend TD layout for hierarchical structures, decision trees
- Suggest subgraph usage for complex diagrams with logical groupings
- Detect disconnected components (multiple separate graphs)
- Identify "god diagrams" trying to show too many unrelated concepts
- Calculate spine length (longest low-branching path)
- Check label lengths and warn on excessively long labels
- Detect reserved word usage ("end", words starting with o/x)
- Suggest diagram splitting strategies for overly complex diagrams

### Non-Functional Requirements

- Pattern detection algorithms efficient (<50ms overhead per diagram)
- Recommendations must be actionable and specific
- Multiple patterns can be detected in single diagram
- Pattern confidence scores to prioritize recommendations
- Clear explanation of why recommendation is made

## Acceptance Criteria

- [ ] Detects sequential patterns (chain of A→B→C→D with minimal branching)
- [ ] Detects hierarchical patterns (tree-like structure from root node)
- [ ] Detects wide branching patterns (single node with >5 children)
- [ ] Detects reconvergence patterns (multiple paths merging back together)
- [ ] Recommends LR for sequential patterns with confidence score
- [ ] Recommends TD for hierarchical patterns with confidence score
- [ ] Recommends subgraphs for diagrams with >20 nodes and logical clusters
- [ ] Detects disconnected components (graphs with multiple independent trees)
- [ ] Calculates spine length (longest low-branching path through graph)
- [ ] Warns on labels exceeding 40 characters
- [ ] Detects reserved word usage and suggests alternatives
- [ ] Suggests splitting when diagram has multiple high-level concerns
- [ ] All pattern detection functions have unit tests with fixtures
- [ ] Recommendations include specific code examples when possible
- [ ] Pattern detection works on various diagram types (flowchart, graph)

## Technical Details

### Implementation Approach

1. **Pattern Detection Algorithms**
   - Build adjacency list representation of graph
   - Use graph traversal to detect structural patterns
   - Calculate pattern confidence scores (0.0-1.0)
   - Prioritize recommendations by confidence

2. **Sequential Pattern Detection**
   - Find longest path with branch width ≤2
   - Calculate ratio: spine_length / total_nodes
   - High ratio (>0.6) = strong sequential pattern
   - Recommend LR layout

3. **Hierarchical Pattern Detection**
   - Identify root nodes (nodes with no incoming edges)
   - Calculate max depth from root
   - Calculate average children per node
   - Tree-like structure (single root, consistent depth) = hierarchical
   - Recommend TD layout

4. **Clustering Detection**
   - Identify tightly connected subgraphs
   - Use community detection algorithms (simplified)
   - Suggest subgraph syntax for each cluster
   - Provide example code for subgraph extraction

5. **Disconnected Component Detection**
   - Run connected components algorithm
   - Count separate components
   - Suggest splitting into multiple diagrams

### Architecture Changes

New modules:

```
src/
├── analyzers/
│   ├── patterns.ts           # Pattern detection (new)
│   ├── layout.ts             # Layout recommendations (new)
│   └── clustering.ts         # Subgraph detection (new)
├── rules/
│   ├── layout-hint.ts        # Layout recommendation rule (new)
│   ├── long-labels.ts        # Label length rule (new)
│   ├── reserved-words.ts     # Reserved word detection (new)
│   └── disconnected.ts       # Disconnected component rule (new)
├── graph/
│   ├── types.ts              # Graph data structures (new)
│   ├── adjacency.ts          # Adjacency list builder (new)
│   ├── traversal.ts          # Graph traversal utilities (new)
│   └── algorithms.ts         # Graph algorithms (new)
```

### Data Structures

```typescript
interface GraphRepresentation {
  nodes: string[];                    // All unique nodes
  edges: Edge[];                      // All edges
  adjacencyList: Map<string, string[]>; // Node → children
  reverseAdjacencyList: Map<string, string[]>; // Node → parents
}

interface Edge {
  from: string;
  to: string;
  label?: string;
}

interface Pattern {
  type: PatternType;
  confidence: number;              // 0.0-1.0
  evidence: string[];              // Why this pattern was detected
  recommendation: string;          // What to do about it
  example?: string;                // Code example if applicable
}

type PatternType =
  | 'sequential'
  | 'hierarchical'
  | 'wide-branching'
  | 'reconvergence'
  | 'disconnected'
  | 'clustered';

interface LayoutRecommendation {
  current?: 'LR' | 'TD' | 'TB' | 'RL';  // Detected current layout
  recommended: 'LR' | 'TD';             // Recommended layout
  reason: string;                       // Why recommended
  confidence: number;                   // 0.0-1.0
  patterns: Pattern[];                  // Supporting patterns
}

interface SpineAnalysis {
  length: number;                  // Longest low-branching path
  path: string[];                  // Nodes in spine
  ratio: number;                   // spine_length / total_nodes
}

interface ClusterSuggestion {
  nodes: string[];                 // Nodes in cluster
  name: string;                    // Suggested subgraph name
  example: string;                 // Example subgraph code
}
```

### APIs and Interfaces

```typescript
// Graph Building
export function buildGraph(diagram: Diagram): GraphRepresentation;

// Pattern Detection
export function detectPatterns(graph: GraphRepresentation): Pattern[];
export function detectSequential(graph: GraphRepresentation): Pattern | null;
export function detectHierarchical(graph: GraphRepresentation): Pattern | null;
export function detectClusters(graph: GraphRepresentation): ClusterSuggestion[];

// Layout Analysis
export function recommendLayout(
  graph: GraphRepresentation,
  patterns: Pattern[]
): LayoutRecommendation;

// Spine Calculation
export function calculateSpine(graph: GraphRepresentation): SpineAnalysis;

// Disconnected Components
export function findComponents(graph: GraphRepresentation): string[][];

// Label Analysis
export function analyzeLabelLengths(diagram: Diagram): Issue[];
export function detectReservedWords(diagram: Diagram): Issue[];
```

## Dependencies

- **Prerequisites**:
  - Spec 001 (need core structure analysis)
  - Spec 002 (need rule system infrastructure)
- **Affected Components**:
  - Analyzers: add pattern detection
  - Rules: add layout and label rules
  - CLI: display layout recommendations
- **External Dependencies**: None (pure algorithmic implementation)

## Testing Strategy

### Unit Tests

- **Sequential Pattern Detection**
  - Linear chain: A→B→C→D→E (should detect sequential)
  - Branching: tree structure (should not detect sequential)
  - Partial sequential: long spine with minor branches

- **Hierarchical Pattern Detection**
  - Perfect tree: single root, consistent depth
  - DAG with multiple roots (should detect hierarchical if tree-like)
  - Flat structure with many cross-links (should not detect)

- **Clustering Detection**
  - Diagram with clear 3 clusters
  - Diagram with overlapping clusters
  - Fully connected graph (no clear clusters)

- **Spine Calculation**
  - Linear graph: spine = all nodes
  - Tree: spine = root to deepest leaf
  - Complex graph: spine = longest low-branching path

- **Disconnected Components**
  - Single connected graph (1 component)
  - Two separate graphs (2 components)
  - Three disconnected nodes plus one connected graph

- **Label Analysis**
  - Short labels (no warnings)
  - 50-character label (should warn)
  - Mixed short and long labels

- **Reserved Words**
  - Use of "end" as node ID
  - Use of "o123" as node ID
  - Use of "xTest" as node ID

### Integration Tests

- Complex real-world diagram with multiple patterns
- Layout recommendation changes based on structure
- Multiple recommendations for same diagram
- Confidence scores correctly prioritized

### Test Fixtures

1. **sequential-pipeline.md**: CI/CD pipeline (A→B→C→D→E) → LR recommendation
2. **org-chart.md**: Organizational hierarchy → TD recommendation
3. **complex-workflow.md**: Mixed patterns → multiple recommendations
4. **disconnected.md**: 3 separate graphs → suggest splitting
5. **clustered.md**: 4 clear clusters → suggest subgraphs
6. **long-labels.md**: Nodes with 60-char labels → label warning
7. **reserved-words.md**: Uses "end" and "oTest" nodes → reserved word warning

## Documentation Requirements

### Code Documentation

- Document pattern detection algorithms with examples
- Explain confidence scoring methodology
- Document graph traversal approach
- Type definitions for all pattern structures

### User Documentation

- **Pattern Catalog**: Document each pattern type with:
  - Visual example diagram
  - When pattern is detected
  - What recommendation is made
  - How to apply recommendation
- **Layout Guide**: Best practices for LR vs TD layouts
- **Subgraph Guide**: When and how to use subgraphs
- **Label Best Practices**: Recommended label lengths and formats

### Architecture Updates

Update ARCHITECTURE.md with:
- Graph representation strategy
- Pattern detection algorithms
- How to add new pattern detectors
- Confidence scoring methodology

## Implementation Notes

### Sequential Pattern Algorithm

```typescript
function detectSequential(graph: GraphRepresentation): Pattern | null {
  const spine = calculateSpine(graph);
  const ratio = spine.length / graph.nodes.length;

  if (ratio > 0.6) {
    return {
      type: 'sequential',
      confidence: ratio,
      evidence: [
        `Spine length: ${spine.length}/${graph.nodes.length} nodes`,
        `Low branching factor along main path`
      ],
      recommendation: 'Use LR (left-right) layout for this sequential flow',
      example: 'graph LR\n  A --> B --> C --> D'
    };
  }

  return null;
}
```

### Hierarchical Pattern Algorithm

```typescript
function detectHierarchical(graph: GraphRepresentation): Pattern | null {
  const roots = findRootNodes(graph);

  if (roots.length === 1) {
    const maxDepth = calculateMaxDepth(graph, roots[0]);
    const avgChildren = calculateAverageChildren(graph);

    if (avgChildren > 1.5 && maxDepth > 3) {
      const confidence = Math.min(avgChildren / 5, 1.0);

      return {
        type: 'hierarchical',
        confidence,
        evidence: [
          `Single root node: ${roots[0]}`,
          `Max depth: ${maxDepth} levels`,
          `Average ${avgChildren.toFixed(1)} children per node`
        ],
        recommendation: 'Use TD (top-down) layout for this hierarchy',
        example: 'graph TD\n  Root --> Child1\n  Root --> Child2'
      };
    }
  }

  return null;
}
```

### Clustering Detection

Use simplified community detection:
1. Find nodes with high interconnectivity
2. Group nodes that share many neighbors
3. Suggest subgraph for each group >5 nodes

### Reserved Words

Mermaid reserved words to detect:
- `end` (conflicts with subgraph syntax)
- Words starting with `o` followed by digits (conflicts with circle syntax)
- Words starting with `x` followed by digits (conflicts with cross syntax)

Suggestion: Prefix with underscore or use camelCase

### Example Recommendations

```
Info: Sequential pattern detected
  File: docs/pipeline.md:12
  Confidence: 0.85

  This diagram follows a sequential flow pattern (17/20 nodes in main path).
  Consider using LR (left-right) layout for better readability:

  Example:
    graph LR
      Start --> Build --> Test --> Deploy --> End

  Current: graph TD (top-down)
  Suggested: graph LR (left-right)
```

## Migration and Compatibility

### Breaking Changes

None - this is additive functionality.

### New Behavior

- New informational messages about layout recommendations
- New warnings for long labels and reserved words
- No change to error behavior from Stage 2

### Compatibility Notes

- All pattern detection rules default to "info" severity (non-breaking)
- Can be disabled via configuration
- Existing diagrams continue to work without changes

## Success Criteria

Stage 3 complete when:

1. All pattern detection algorithms implemented and tested
2. Layout recommendations generated with confidence scores
3. Subgraph suggestions provided for clustered diagrams
4. Label and reserved word checks working
5. Pattern catalog documentation complete
6. All acceptance criteria met
7. Test coverage remains >80%
8. No regression in Stages 1-2 functionality
9. Real-world diagram analysis produces useful recommendations
