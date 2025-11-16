# Simple Linear Flow

This is a simple linear flowchart with 5 nodes and 4 edges.

```mermaid
flowchart TD
    A[Start] --> B[Process 1]
    B --> C[Process 2]
    C --> D[Process 3]
    D --> E[End]
```

Expected metrics:
- Nodes: 5
- Edges: 4
- Density: 0.2 (4 / (5 × 4) = 0.2)
- Max Branch Width: 1
- Average Degree: 1.6 (8 / 5)
