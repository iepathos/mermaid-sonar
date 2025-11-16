# Edge Cases

## Empty Diagram

```mermaid
flowchart TD
```

## Single Node

```mermaid
graph TD
    A[Alone]
```

## Disconnected Components

```mermaid
flowchart LR
    A[Node 1] --> B[Node 2]

    C[Node 3] --> D[Node 4]
```

## Multiple Diagrams

First diagram:

```mermaid
flowchart TD
    X[First]
```

Second diagram:

~~~mermaid
flowchart LR
    Y[Second] --> Z[End]
~~~
