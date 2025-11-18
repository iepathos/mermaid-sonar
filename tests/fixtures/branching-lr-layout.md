# Branching LR Layout Test Fixture

This fixture tests the horizontal-width-readability rule for LR layouts with branching.
The diagram has branching and reconvergence, so the longest chain should be shorter than the total node count.

```mermaid
graph LR
  START[Start] --> BRANCH1[Branch 1]
  START --> BRANCH2[Branch 2]
  START --> BRANCH3[Branch 3]
  BRANCH1 --> CONVERGE[Converge Point]
  BRANCH2 --> CONVERGE
  BRANCH3 --> CONVERGE
  CONVERGE --> END[End]
```

Total nodes: 6
Longest chain: 3 (START → BRANCH1 → CONVERGE → END or similar)
Old calculation would use 6 nodes (overestimate)
New calculation uses 3 nodes (accurate)
