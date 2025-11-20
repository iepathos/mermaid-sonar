# State Diagram with Labeled Transitions

This tests state diagrams with colon-labeled transitions.

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : start
    Processing --> Complete : finish
    Processing --> Error : fail
    Error --> Idle : retry
    Complete --> [*]
```

Expected metrics:
- Nodes: 6 (including __START__ and __END__)
- Edges: 6
- Diagram Type: state
- All transitions should have labels
