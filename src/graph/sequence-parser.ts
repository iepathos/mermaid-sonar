/**
 * Sequence diagram parsing utilities
 *
 * Parses Mermaid sequence diagrams to extract participants, messages,
 * and control structures for width and height analysis.
 */

import type { GraphRepresentation, Edge } from './types';

/**
 * Represents a participant in a sequence diagram
 */
export interface Participant {
  /** Participant identifier */
  id: string;
  /** Display label (may differ from id if aliased) */
  label: string;
  /** Type of participant */
  type: 'participant' | 'actor';
}

/**
 * Message types in sequence diagrams
 */
export type MessageType = 'sync' | 'async' | 'return' | 'solid' | 'dotted';

/**
 * Represents a message between participants
 */
export interface Message {
  /** Source participant */
  from: string;
  /** Target participant */
  to: string;
  /** Message type */
  type: MessageType;
  /** Message label */
  label: string;
}

/**
 * Result of parsing a sequence diagram
 */
export interface SequenceAnalysis {
  /** Map of participant ID to participant */
  participants: Map<string, Participant>;
  /** All messages in sequence */
  messages: Message[];
  /** Total message count */
  messageCount: number;
  /** Maximum nesting depth (loops/alts/pars) */
  nestingDepth: number;
  /** Has loop blocks */
  hasLoops: boolean;
  /** Has alt/else blocks */
  hasAlts: boolean;
  /** Has parallel blocks */
  hasPar: boolean;
  /** Graph representation for analysis */
  graph: GraphRepresentation;
}

/**
 * Extracts participants from diagram content
 *
 * Matches patterns:
 * - participant Alice
 * - actor Bob
 * - participant A as Alice (with alias)
 * - Also detects implicit participants from messages
 */
function extractParticipants(content: string): Map<string, Participant> {
  const participants = new Map<string, Participant>();
  const lines = content.split('\n');

  // First pass: explicit participants
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('%%')) {
      continue;
    }

    // Match explicit participant: "participant Alice" or "participant A as Alice"
    const participantMatch = /^participant\s+([\w]+)(?:\s+as\s+(.+))?/.exec(trimmed);
    if (participantMatch) {
      const id = participantMatch[1];
      const label = participantMatch[2]?.trim() || id;
      participants.set(id, { id, label, type: 'participant' });
      continue;
    }

    // Match actor: "actor Alice" or "actor A as Alice"
    const actorMatch = /^actor\s+([\w]+)(?:\s+as\s+(.+))?/.exec(trimmed);
    if (actorMatch) {
      const id = actorMatch[1];
      const label = actorMatch[2]?.trim() || id;
      participants.set(id, { id, label, type: 'actor' });
      continue;
    }
  }

  // Second pass: implicit participants from messages
  const messagePattern = /([\w]+)\s*(->>?|-\)|-->>?|--\)|->|-->|-x|--x)\s*([\w]+)(?:\s*:\s*(.+))?/;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('%%')) {
      continue;
    }

    const match = messagePattern.exec(trimmed);
    if (match) {
      const from = match[1];
      const to = match[3];

      // Add implicit participants if not already defined
      if (!participants.has(from)) {
        participants.set(from, { id: from, label: from, type: 'participant' });
      }
      if (!participants.has(to)) {
        participants.set(to, { id: to, label: to, type: 'participant' });
      }
    }
  }

  return participants;
}

/**
 * Extracts messages from diagram content
 *
 * Message patterns:
 * - Alice->>Bob: Sync message
 * - Alice-)Bob: Async with open arrow
 * - Alice-->>Bob: Dotted with arrow
 * - Alice->Bob: Solid line
 * - Alice-->Bob: Dotted line
 * - Alice-xBob: Solid with cross
 * - Alice--xBob: Dotted with cross
 */
function extractMessages(content: string): Message[] {
  const messages: Message[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('%%')) {
      continue;
    }

    // Match cross messages first (most specific): Alice-xBob or Alice--xBob
    const crossMatch = /([\w]+)\s*--?x\s*([\w]+)(?:\s*:\s*(.+))?/.exec(trimmed);
    if (crossMatch) {
      const isAsync = trimmed.includes('--x');
      messages.push({
        from: crossMatch[1],
        to: crossMatch[2],
        type: isAsync ? 'async' : 'sync',
        label: crossMatch[3]?.trim() || '',
      });
      continue;
    }

    // Match return/dotted arrows with two arrowheads: Alice-->>Bob
    const returnDoubleMatch = /([\w]+)\s*-->>\s*([\w]+)(?:\s*:\s*(.+))?/.exec(trimmed);
    if (returnDoubleMatch) {
      messages.push({
        from: returnDoubleMatch[1],
        to: returnDoubleMatch[2],
        type: 'return',
        label: returnDoubleMatch[3]?.trim() || '',
      });
      continue;
    }

    // Match sync message with arrowhead: Alice->>Bob
    const syncDoubleMatch = /([\w]+)\s*->>\s*([\w]+)(?:\s*:\s*(.+))?/.exec(trimmed);
    if (syncDoubleMatch) {
      messages.push({
        from: syncDoubleMatch[1],
        to: syncDoubleMatch[2],
        type: 'sync',
        label: syncDoubleMatch[3]?.trim() || '',
      });
      continue;
    }

    // Match async message: Alice-)Bob
    const asyncMatch = /([\w]+)\s*-\)\s*([\w]+)(?:\s*:\s*(.+))?/.exec(trimmed);
    if (asyncMatch) {
      messages.push({
        from: asyncMatch[1],
        to: asyncMatch[2],
        type: 'async',
        label: asyncMatch[3]?.trim() || '',
      });
      continue;
    }

    // Match dotted line without arrowhead: Alice-->Bob
    const dottedMatch = /([\w]+)\s*-->\s*([\w]+)(?:\s*:\s*(.+))?/.exec(trimmed);
    if (dottedMatch) {
      messages.push({
        from: dottedMatch[1],
        to: dottedMatch[2],
        type: 'dotted',
        label: dottedMatch[3]?.trim() || '',
      });
      continue;
    }

    // Match solid line without arrowhead: Alice->Bob
    const solidMatch = /([\w]+)\s*->\s*([\w]+)(?:\s*:\s*(.+))?/.exec(trimmed);
    if (solidMatch) {
      messages.push({
        from: solidMatch[1],
        to: solidMatch[2],
        type: 'solid',
        label: solidMatch[3]?.trim() || '',
      });
      continue;
    }
  }

  return messages;
}

/**
 * Analyzes control structure nesting depth
 *
 * Detects:
 * - loop blocks
 * - alt/else blocks
 * - par (parallel) blocks
 * - opt (optional) blocks
 * - critical blocks
 */
function analyzeNesting(content: string): {
  maxDepth: number;
  hasLoops: boolean;
  hasAlts: boolean;
  hasPar: boolean;
} {
  const lines = content.split('\n');
  let currentDepth = 0;
  let maxDepth = 0;
  let hasLoops = false;
  let hasAlts = false;
  let hasPar = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('%%')) {
      continue;
    }

    // Check for block starts
    if (/^loop\s+/.test(trimmed)) {
      hasLoops = true;
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (/^alt\s+/.test(trimmed)) {
      hasAlts = true;
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (/^par\s+/.test(trimmed)) {
      hasPar = true;
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (/^(opt|critical|break)\s+/.test(trimmed)) {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (trimmed === 'end') {
      currentDepth = Math.max(0, currentDepth - 1);
    } else if (/^(else|and)\s*/.test(trimmed)) {
      // else and and don't change depth, they're within the same level
      continue;
    }
  }

  return { maxDepth, hasLoops, hasAlts, hasPar };
}

/**
 * Builds graph representation from messages
 */
function buildGraphFromMessages(
  participants: Map<string, Participant>,
  messages: Message[]
): GraphRepresentation {
  const nodes = Array.from(participants.keys());
  const edges: Edge[] = messages.map((msg) => ({
    from: msg.from,
    to: msg.to,
    label: msg.label,
  }));

  const adjacencyList = new Map<string, string[]>();
  const reverseAdjacencyList = new Map<string, string[]>();

  for (const edge of edges) {
    if (!adjacencyList.has(edge.from)) {
      adjacencyList.set(edge.from, []);
    }
    adjacencyList.get(edge.from)!.push(edge.to);

    if (!reverseAdjacencyList.has(edge.to)) {
      reverseAdjacencyList.set(edge.to, []);
    }
    reverseAdjacencyList.get(edge.to)!.push(edge.from);
  }

  return {
    nodes,
    edges,
    adjacencyList,
    reverseAdjacencyList,
  };
}

/**
 * Parses a sequence diagram into structured representation
 *
 * @param content - Raw Mermaid sequence diagram code
 * @returns Parsed sequence diagram with participants, messages, and analysis
 */
export function parseSequenceDiagram(content: string): SequenceAnalysis {
  const participants = extractParticipants(content);
  const messages = extractMessages(content);
  const nesting = analyzeNesting(content);
  const graph = buildGraphFromMessages(participants, messages);

  return {
    participants,
    messages,
    messageCount: messages.length,
    nestingDepth: nesting.maxDepth,
    hasLoops: nesting.hasLoops,
    hasAlts: nesting.hasAlts,
    hasPar: nesting.hasPar,
    graph,
  };
}
