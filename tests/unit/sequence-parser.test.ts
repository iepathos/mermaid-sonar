/**
 * Unit tests for sequence diagram parser
 */

import { parseSequenceDiagram } from '../../src/graph/sequence-parser';

describe('Sequence Parser', () => {
  describe('Diagram Type Detection', () => {
    it('should parse basic sequence diagram', () => {
      const content = `
sequenceDiagram
    Alice->>Bob: Hello
`;
      const result = parseSequenceDiagram(content);

      expect(result.participants.size).toBe(2);
      expect(result.participants.has('Alice')).toBe(true);
      expect(result.participants.has('Bob')).toBe(true);
      expect(result.messageCount).toBe(1);
    });
  });

  describe('Participant Parsing', () => {
    it('should parse explicit participants', () => {
      const content = `
sequenceDiagram
    participant Alice
    participant Bob
`;
      const result = parseSequenceDiagram(content);

      expect(result.participants.size).toBe(2);
      expect(result.participants.has('Alice')).toBe(true);
      expect(result.participants.has('Bob')).toBe(true);

      const alice = result.participants.get('Alice')!;
      expect(alice.type).toBe('participant');
      expect(alice.label).toBe('Alice');
    });

    it('should parse actors', () => {
      const content = `
sequenceDiagram
    actor User
    participant System
`;
      const result = parseSequenceDiagram(content);

      expect(result.participants.size).toBe(2);
      const user = result.participants.get('User')!;
      expect(user.type).toBe('actor');

      const system = result.participants.get('System')!;
      expect(system.type).toBe('participant');
    });

    it('should parse participant aliases', () => {
      const content = `
sequenceDiagram
    participant A as Alice
    participant B as Bob
`;
      const result = parseSequenceDiagram(content);

      expect(result.participants.size).toBe(2);
      const alice = result.participants.get('A')!;
      expect(alice.id).toBe('A');
      expect(alice.label).toBe('Alice');
    });

    it('should detect implicit participants from messages', () => {
      const content = `
sequenceDiagram
    Alice->>Bob: Hello
    Bob-->>Charlie: Hi
`;
      const result = parseSequenceDiagram(content);

      expect(result.participants.size).toBe(3);
      expect(result.participants.has('Alice')).toBe(true);
      expect(result.participants.has('Bob')).toBe(true);
      expect(result.participants.has('Charlie')).toBe(true);
    });

    it('should combine explicit and implicit participants', () => {
      const content = `
sequenceDiagram
    participant Alice
    Alice->>Bob: Hello
`;
      const result = parseSequenceDiagram(content);

      expect(result.participants.size).toBe(2);
      const alice = result.participants.get('Alice')!;
      expect(alice.type).toBe('participant');

      const bob = result.participants.get('Bob')!;
      expect(bob.type).toBe('participant');
    });
  });

  describe('Message Parsing', () => {
    it('should parse synchronous messages', () => {
      const content = `
sequenceDiagram
    Alice->>Bob: Request
`;
      const result = parseSequenceDiagram(content);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].from).toBe('Alice');
      expect(result.messages[0].to).toBe('Bob');
      expect(result.messages[0].type).toBe('sync');
      expect(result.messages[0].label).toBe('Request');
    });

    it('should parse asynchronous messages', () => {
      const content = `
sequenceDiagram
    Alice-)Bob: Async message
`;
      const result = parseSequenceDiagram(content);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].type).toBe('async');
    });

    it('should parse return messages', () => {
      const content = `
sequenceDiagram
    Alice->>Bob: Request
    Bob-->>Alice: Response
`;
      const result = parseSequenceDiagram(content);

      expect(result.messages).toHaveLength(2);
      expect(result.messages[1].type).toBe('return');
      expect(result.messages[1].from).toBe('Bob');
      expect(result.messages[1].to).toBe('Alice');
    });

    it('should parse solid line messages', () => {
      const content = `
sequenceDiagram
    Alice->Bob: Simple
`;
      const result = parseSequenceDiagram(content);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].type).toBe('solid');
    });

    it('should parse dotted line messages', () => {
      const content = `
sequenceDiagram
    Alice-->Bob: Dotted
`;
      const result = parseSequenceDiagram(content);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].type).toBe('dotted');
    });

    it('should count messages correctly', () => {
      const content = `
sequenceDiagram
    Alice->>Bob: Request 1
    Bob-->>Alice: Response 1
    Alice->>Charlie: Request 2
    Charlie-->>Alice: Response 2
`;
      const result = parseSequenceDiagram(content);

      expect(result.messageCount).toBe(4);
      expect(result.messages).toHaveLength(4);
    });

    it('should handle messages without labels', () => {
      const content = `
sequenceDiagram
    Alice->>Bob
`;
      const result = parseSequenceDiagram(content);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].label).toBe('');
    });
  });

  describe('Control Structure Parsing', () => {
    it('should detect loop blocks', () => {
      const content = `
sequenceDiagram
    loop Every minute
        Alice->>Bob: Ping
    end
`;
      const result = parseSequenceDiagram(content);

      expect(result.hasLoops).toBe(true);
      expect(result.nestingDepth).toBe(1);
    });

    it('should detect alt/else blocks', () => {
      const content = `
sequenceDiagram
    alt Success
        Alice->>Bob: OK
    else Failure
        Alice->>Bob: Error
    end
`;
      const result = parseSequenceDiagram(content);

      expect(result.hasAlts).toBe(true);
      expect(result.nestingDepth).toBe(1);
    });

    it('should detect parallel blocks', () => {
      const content = `
sequenceDiagram
    par Thread 1
        Alice->>Bob: Request 1
    and Thread 2
        Alice->>Charlie: Request 2
    end
`;
      const result = parseSequenceDiagram(content);

      expect(result.hasPar).toBe(true);
      expect(result.nestingDepth).toBe(1);
    });

    it('should calculate nesting depth correctly', () => {
      const content = `
sequenceDiagram
    loop Outer
        alt Condition
            loop Inner
                Alice->>Bob: Message
            end
        end
    end
`;
      const result = parseSequenceDiagram(content);

      expect(result.nestingDepth).toBe(3);
    });

    it('should handle multiple control structures at same level', () => {
      const content = `
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
`;
      const result = parseSequenceDiagram(content);

      expect(result.hasLoops).toBe(true);
      expect(result.hasAlts).toBe(true);
      expect(result.hasPar).toBe(true);
      expect(result.nestingDepth).toBe(1);
    });
  });

  describe('Comment Handling', () => {
    it('should skip comment lines', () => {
      const content = `
sequenceDiagram
    %% This is a comment
    Alice->>Bob: Hello
    %% Another comment
`;
      const result = parseSequenceDiagram(content);

      expect(result.messages).toHaveLength(1);
    });
  });

  describe('Self Messages', () => {
    it('should parse self-referencing messages', () => {
      const content = `
sequenceDiagram
    Alice->>Alice: Self call
`;
      const result = parseSequenceDiagram(content);

      expect(result.participants.size).toBe(1);
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].from).toBe('Alice');
      expect(result.messages[0].to).toBe('Alice');
    });
  });

  describe('Graph Representation', () => {
    it('should build graph from messages', () => {
      const content = `
sequenceDiagram
    Alice->>Bob: Message 1
    Bob->>Charlie: Message 2
`;
      const result = parseSequenceDiagram(content);

      expect(result.graph.nodes).toHaveLength(3);
      expect(result.graph.nodes).toContain('Alice');
      expect(result.graph.nodes).toContain('Bob');
      expect(result.graph.nodes).toContain('Charlie');

      expect(result.graph.edges).toHaveLength(2);
    });
  });
});
