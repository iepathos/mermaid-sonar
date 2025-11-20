# Blog Post Examples: Detecting Hidden Complexity in Diagrams

These examples correspond to the blog post "Mermaid-Sonar: Detecting Hidden Complexity in Diagram Documentation" at [entropicdrift.com](https://entropicdrift.com/blog/mermaid-sonar-complexity-analyzer/).

Each example is split into separate "before" (problematic) and "after" (fixed) files so you can run mermaid-sonar on them independently to see the validation differences.

## Quick Start

From the mermaid-sonar project root:

```bash
# Validate all examples
npx mermaid-sonar --viewport-profile mkdocs examples/mermaid-sonar-complexity-analyzer/

# See errors/warnings in "before" examples
npx mermaid-sonar --viewport-profile mkdocs examples/mermaid-sonar-complexity-analyzer/*-before.md

# See passing validation in "after" examples
npx mermaid-sonar --viewport-profile mkdocs examples/mermaid-sonar-complexity-analyzer/*-after.md

# Compare specific example before vs after
npx mermaid-sonar --viewport-profile mkdocs examples/mermaid-sonar-complexity-analyzer/example-1-before.md
npx mermaid-sonar --viewport-profile mkdocs examples/mermaid-sonar-complexity-analyzer/example-1-after.md
```

## Examples Overview

### Example 1: Layout Conversion (TD → LR)

**Files**:
- `example-1-before.md` - Problematic TD layout
- `example-1-after.md` - Fixed with LR layout

**Problem**: Wide tree with 8 parallel branches in TD layout creates excessive horizontal width

**Fix**: Convert to LR layout for natural vertical scrolling

**Results**:
- Before: ❌ 1302px width ERROR (502px over 800px limit, 63% over)
- After: ✅ Passes validation (~400px width)
- **Improvement**: 1302px → ~400px (69% reduction)

**Strategy**: Pure layout orientation change - works when branches are parallel, not sequential

---

### Example 2: Using Subgraphs (Two Solutions)

**Files**:
- `example-2-before.md` - Problematic parallel branches
- `example-2-after.md` - Fixed with subgraph (TD layout)
- `example-2-after-alternative.md` - Fixed by splitting into 3 phases (LR layout)

**Problem**: Multiple parallel nodes (worker threads) create wide diagram

**Fix Option A (Subgraph)**: Group related parallel nodes into a single subgraph
- Width reduction: 712px → ~500px (28%)
- ⚠️ Gets layout hint (acceptable tradeoff)

**Fix Option B (Split)**: Break into 3 sequential phase diagrams
- Width: ~400px per diagram
- ✅ Zero warnings (perfect validation)

**Strategy**: Choose subgraph for overview, split for step-by-step explanation

---

### Example 3: Simplification + Layout Choice (Two Solutions)

**Files**:
- `example-3-before.md` - Overly complex 64-node flow
- `example-3-after.md` - Simplified 13-node flow (TD layout)
- `example-3-after-alternative.md` - Simplified + split into 3 phases (LR layout)

**Problem**: Overly detailed 64-node flowchart with excessive complexity

**Fix Option A (Simplified TD)**: Reduce to 13 nodes + TD layout for viewport
- Complexity reduction: 64 → 13 nodes (80%)
- Width: ~350px (viewport-friendly)
- ⚠️ Gets layout hint (acceptable tradeoff)

**Fix Option B (Simplified + Split)**: Reduce to 13 nodes + split into 3 LR diagrams
- Complexity reduction: 64 → 13 nodes (80%)
- Width: ~350-450px per diagram
- ✅ Zero warnings (perfect validation)

**Strategy**: Choose TD for single overview, split for tutorial-style explanation

---

## Expected Validation Results

### Running on "Before" Files (Should Show Issues)

```bash
npx mermaid-sonar --viewport-profile mkdocs examples/mermaid-sonar-complexity-analyzer/*-before.md
```

**Expected output:**
- `example-1-before.md`: ❌ 1 error (1302px width - 63% over limit)
- `example-2-before.md`: ℹ️ 1 info (616px width, 4 parallel branches)
- `example-3-before.md`: No issues detected (intentional baseline)

**Total**: 1 error, 1 info demonstrating problematic diagrams

### Running on "After" Files (Should Pass or Have Acceptable Warnings)

```bash
npx mermaid-sonar --viewport-profile mkdocs examples/mermaid-sonar-complexity-analyzer/*-after.md
```

**Expected output:**
- `example-1-after.md`: ✅ No issues
- `example-2-after.md`: ⚠️ Layout hint only (acceptable tradeoff)
- `example-3-after.md`: ⚠️ Layout hint only (acceptable tradeoff)

**Total**: No errors, only layout hints which are acceptable tradeoffs

### Running on "Alternative" Files (Zero Warnings)

```bash
npx mermaid-sonar --viewport-profile mkdocs examples/mermaid-sonar-complexity-analyzer/*-alternative.md
```

**Expected output:**
- `example-2-after-alternative.md`: ✅ No issues (3 diagrams, all pass)
- `example-3-after-alternative.md`: ✅ No issues (3 diagrams, all pass)

**Total**: Zero warnings, perfect validation

## Understanding the Results

### Errors vs Warnings

- **Errors**: Diagrams that will cause real problems (unreadable, won't render, too complex)
- **Warnings**: Diagrams that work but could be improved
- **Layout hints**: Suggestions that may conflict with viewport constraints (often acceptable)

### Two Approaches to "After" Examples

This repo demonstrates **two valid solutions** for Examples 2 and 3:

#### Approach A: Single Diagram with Acceptable Tradeoff
- Files: `*-after.md`
- Uses TD layout or subgraphs
- Gets layout hints (suggests LR for sequential flows)
- **When to use**: Need overview, limited vertical space, viewport width matters most

#### Approach B: Split Diagrams with Zero Warnings
- Files: `*-after-alternative.md`
- Splits workflow into multiple smaller LR diagrams
- Zero warnings (perfect validation)
- **When to use**: Plenty of vertical space, tutorial-style mkdocs, step-by-step explanation

Both approaches are correct - choose based on your documentation context.

### Why Example 3 Has a Warning

The "after" diagram gets a layout hint suggesting LR instead of TD. This is expected and acceptable:

```
⚠️  Sequential flow pattern detected - consider LR layout
```

**Why we ignore it**: LR layout would create a 1552px wide diagram (752px over limit). The TD layout keeps width at ~350px while maintaining readability. This demonstrates a real-world tradeoff: viewport constraints matter more than theoretical layout ideals.

## Learning Points

### When to Use Each Strategy

| Strategy | Use Case | Width Reduction | Complexity Impact |
|----------|----------|-----------------|-------------------|
| **Layout conversion** | Wide trees, parallel branches | 40-60% | None (same nodes) |
| **Subgraphs** | Multiple parallel nodes doing similar work | 20-40% | Improves (consolidates) |
| **Simplification** | 20+ nodes, high complexity | N/A | Major (60-80% node reduction) |

### The Viewport Constraint Principle

The most important lesson from these examples:

> Sometimes the "theoretically optimal" layout (LR for sequential flows) conflicts with real-world rendering constraints (800px MkDocs content width). When in doubt for documentation, prioritize readability in the actual rendering environment.

This is why Example 3 uses TD layout despite the warning - it's the right choice for the target platform.

## Integration with Blog Post

These examples are referenced in the blog post at: https://entropicdrift.com/blog/mermaid-sonar-complexity-analyzer/

The blog post includes:
- Visual side-by-side comparisons of before/after
- Detailed explanation of each fix strategy
- Real-world results from fixing 87 diagrams in ripgrep documentation
- Research-backed thresholds for complexity metrics
- Platform-specific viewport profiles (MkDocs, GitHub, Confluence)

## Contributing

Found a good example of diagram improvement? Open a PR to add it to this collection!

## Related Resources

- **Blog Post**: [Mermaid-Sonar: Detecting Hidden Complexity](https://entropicdrift.com/blog/mermaid-sonar-complexity-analyzer/)
- **Project Page**: [Full CLI reference and integration examples](https://entropicdrift.com/projects/mermaid-sonar/)
- **GitHub**: [iepathos/mermaid-sonar](https://github.com/iepathos/mermaid-sonar)
- **npm**: [mermaid-sonar](https://www.npmjs.com/package/mermaid-sonar)
