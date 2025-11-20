/**
 * Unit tests for sequence diagram analyzer
 */

import { analyzeSequenceDiagram } from '../../src/analyzers/sequence-analyzer';
import type { Diagram } from '../../src/extractors/types';

function createDiagram(content: string): Diagram {
  return {
    content,
    type: 'sequence',
    filePath: 'test.md',
    startLine: 1,
  };
}

describe('Sequence Analyzer', () => {
  describe('Participant Analysis', () => {
    it('should count participants correctly', () => {
      const diagram = createDiagram(`
sequenceDiagram
    participant Alice
    participant Bob
    participant Charlie
`);
      const analysis = analyzeSequenceDiagram(diagram);

      expect(analysis.participantCount).toBe(3);
    });

    it('should calculate average label length', () => {
      const diagram = createDiagram(`
sequenceDiagram
    participant A as Alice
    participant B as Bob
`);
      const analysis = analyzeSequenceDiagram(diagram);

      // "Alice" = 5, "Bob" = 3, avg = 4
      expect(analysis.avgLabelLength).toBe(4);
    });

    it('should calculate maximum label length', () => {
      const diagram = createDiagram(`
sequenceDiagram
    participant A as Alice
    participant B as Bobby
`);
      const analysis = analyzeSequenceDiagram(diagram);

      // "Alice" = 5, "Bobby" = 5, max = 5
      expect(analysis.maxLabelLength).toBe(5);
    });
  });

  describe('Width Estimation', () => {
    it('should estimate width for 2 participants', () => {
      const diagram = createDiagram(`
sequenceDiagram
    Alice->>Bob: Hello
`);
      const analysis = analyzeSequenceDiagram(diagram);

      // 2 participants × 200px = 400px
      expect(analysis.estimatedWidth).toBe(400);
    });

    it('should estimate width for 5 participants', () => {
      const diagram = createDiagram(`
sequenceDiagram
    A->>B: 1
    B->>C: 2
    C->>D: 3
    D->>E: 4
`);
      const analysis = analyzeSequenceDiagram(diagram);

      // 5 participants × 200px + 50px group overhead = 1050px
      expect(analysis.estimatedWidth).toBe(1050);
    });

    it('should return zero width for empty diagram', () => {
      const diagram = createDiagram(`
sequenceDiagram
`);
      const analysis = analyzeSequenceDiagram(diagram);

      expect(analysis.estimatedWidth).toBe(0);
    });
  });

  describe('Height Estimation', () => {
    it('should estimate height for simple messages', () => {
      const diagram = createDiagram(`
sequenceDiagram
    Alice->>Bob: Message 1
    Bob->>Alice: Message 2
    Alice->>Bob: Message 3
`);
      const analysis = analyzeSequenceDiagram(diagram);

      // 3 messages × 50px = 150px
      expect(analysis.estimatedHeight).toBe(150);
    });

    it('should add overhead for loop blocks', () => {
      const diagram = createDiagram(`
sequenceDiagram
    loop Every minute
        Alice->>Bob: Ping
    end
`);
      const analysis = analyzeSequenceDiagram(diagram);

      // 1 message × 50px + 80px loop overhead + 40px nesting = 170px
      expect(analysis.estimatedHeight).toBe(170);
    });

    it('should add overhead for alt blocks', () => {
      const diagram = createDiagram(`
sequenceDiagram
    alt Success
        Alice->>Bob: OK
    else Failure
        Alice->>Bob: Error
    end
`);
      const analysis = analyzeSequenceDiagram(diagram);

      // 2 messages × 50px + 60px alt overhead + 40px nesting = 200px
      expect(analysis.estimatedHeight).toBe(200);
    });

    it('should add overhead for parallel blocks', () => {
      const diagram = createDiagram(`
sequenceDiagram
    par Thread 1
        Alice->>Bob: Request 1
    and Thread 2
        Alice->>Charlie: Request 2
    end
`);
      const analysis = analyzeSequenceDiagram(diagram);

      // 2 messages × 50px + 70px par overhead + 40px nesting = 210px
      expect(analysis.estimatedHeight).toBe(210);
    });

    it('should calculate height for nested structures', () => {
      const diagram = createDiagram(`
sequenceDiagram
    loop Outer
        alt Condition
            Alice->>Bob: Message
        end
    end
`);
      const analysis = analyzeSequenceDiagram(diagram);

      // 1 message × 50px + 80px loop + 60px alt + (2 levels × 40px) = 270px
      expect(analysis.estimatedHeight).toBe(270);
    });

    it('should handle multiple control structures', () => {
      const diagram = createDiagram(`
sequenceDiagram
    loop First
        Alice->>Bob: A
    end
    alt Second
        Alice->>Bob: B
    end
    par Third
        Alice->>Bob: C
    end
`);
      const analysis = analyzeSequenceDiagram(diagram);

      // 3 messages × 50px + 80px loop + 60px alt + 70px par + 40px nesting = 400px
      expect(analysis.estimatedHeight).toBe(400);
    });
  });

  describe('Complex Scenarios', () => {
    it('should analyze real-world authentication flow', () => {
      const diagram = createDiagram(`
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database

    User->>Frontend: Login request
    Frontend->>API: POST /auth/login
    API->>Database: Validate credentials
    Database-->>API: User data
    alt Valid credentials
        API-->>Frontend: JWT token
        Frontend-->>User: Success
    else Invalid credentials
        API-->>Frontend: Error 401
        Frontend-->>User: Login failed
    end
`);
      const analysis = analyzeSequenceDiagram(diagram);

      expect(analysis.participantCount).toBe(4);
      expect(analysis.parse.messageCount).toBe(8);
      expect(analysis.parse.hasAlts).toBe(true);
      expect(analysis.estimatedWidth).toBe(850); // 4 participants × 200px + 50px overhead
      expect(analysis.estimatedHeight).toBeGreaterThan(400); // 8 messages + alt overhead
    });
  });
});
