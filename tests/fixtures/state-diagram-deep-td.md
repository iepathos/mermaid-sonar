# Deep TD State Diagram

This is a deep TD layout state diagram that should trigger vertical height warnings.

```mermaid
stateDiagram-v2
    direction TD
    [*] --> Layer1
    Layer1 --> Layer2
    Layer2 --> Layer3
    Layer3 --> Layer4
    Layer4 --> Layer5
    Layer5 --> Layer6
    Layer6 --> Layer7
    Layer7 --> Layer8
    Layer8 --> Layer9
    Layer9 --> Layer10
    Layer10 --> Layer11
    Layer11 --> Layer12
    Layer12 --> [*]
```

Expected issues:
- Should trigger vertical-height-readability warning
- Deep graph with 14 levels (including start/end)
