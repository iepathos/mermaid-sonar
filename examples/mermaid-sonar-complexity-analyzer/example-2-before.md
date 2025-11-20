# Example 2 (Before): Multiple Parallel Branches

## Problem

Multiple parallel branches create excessive horizontal width even in TD layout. Each parallel node adds to the width.

**Issue**: 4 worker thread nodes + complex stealing logic = 712px width

```mermaid
graph TD
    Start[Directory Traversal] --> WorkQueue["Work Queue
Files to Search"]
    WorkQueue --> T1[Thread 1]
    WorkQueue --> T2[Thread 2]
    WorkQueue --> T3[Thread 3]
    WorkQueue --> TN[Thread N]

    T1 -->|Work Done| Steal1{More Work?}
    T2 -->|Work Done| Steal2{More Work?}
    T3 -->|Work Done| Steal3{More Work?}

    Steal1 -->|Queue Empty| StealFrom2[Steal from Thread 2]
    Steal2 -->|Queue Empty| StealFrom3[Steal from Thread 3]
    Steal3 -->|Queue Empty| StealFrom1[Steal from Thread 1]

    T1 --> Results[Aggregate Results]
    T2 --> Results
    T3 --> Results
    TN --> Results
```

## Expected Validation Result

When running `npx mermaid-sonar --viewport-profile mkdocs` on this file:

```
⚠️  Diagram width (712px) due to 4+ parallel branches
    Suggestions:
    1. Group related branches into subgraphs to reduce width
    2. Split wide branches into separate diagrams
```

## The Fix

See `example-2-after.md` for the corrected version using subgraph grouping.
