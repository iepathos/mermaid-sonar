# Wide LR State Diagram

This is a wide LR layout state diagram that should trigger horizontal width warnings.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Idle
    Idle --> Initializing
    Initializing --> Connecting
    Connecting --> Authenticating
    Authenticating --> Validating
    Validating --> Processing
    Processing --> Finalizing
    Finalizing --> Complete
    Complete --> [*]
```

Expected issues:
- Should trigger horizontal-width-readability warning
- Wide sequential chain in LR layout
