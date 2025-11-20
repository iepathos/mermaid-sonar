/**
 * Class diagram parsing utilities
 *
 * Parses Mermaid class diagrams to extract classes, members, and relationships
 * for width and height analysis.
 */

import type { GraphRepresentation, Edge } from './types';

/**
 * Represents a class node with its members
 *
 * Supports generic/template syntax (e.g., List~String~, Map~Key,Value~)
 */
export interface ClassNode {
  /** Class name (may include generic parameters like List~String~) */
  name: string;
  /**
   * Class attributes/properties
   * Visibility modifiers are preserved in the string (e.g., "+name: string", "-id: number")
   */
  attributes: string[];
  /**
   * Class methods
   * Visibility modifiers are preserved in the string (e.g., "+getName()", "#validate()")
   */
  methods: string[];
}

/**
 * Types of relationships in class diagrams
 */
export type RelationshipType =
  | 'inheritance'
  | 'composition'
  | 'aggregation'
  | 'association'
  | 'dependency';

/**
 * Represents a relationship between classes
 */
export interface ClassRelationship {
  /** Source class name */
  from: string;
  /** Target class name */
  to: string;
  /** Type of relationship */
  type: RelationshipType;
  /** Optional relationship label */
  label?: string;
  /** Optional multiplicity (e.g., "1", "*", "0..1") */
  multiplicity?: { from?: string; to?: string };
}

/**
 * Result of parsing a class diagram
 */
export interface ClassDiagramParse {
  /** Map of class name to class node */
  classes: Map<string, ClassNode>;
  /** All relationships */
  relationships: ClassRelationship[];
  /** Graph representation for traversal algorithms */
  graph: GraphRepresentation;
}

/**
 * Extracts class definitions from diagram content
 *
 * Matches patterns:
 * - class ClassName
 * - class ClassName {
 *     +attribute: type
 *     +method()
 *   }
 * - class Generic~Type~ (generic/template classes)
 * - namespace Name { class ClassName } (namespace blocks)
 *
 * Visibility modifiers are preserved in member strings:
 * - + : public
 * - - : private
 * - # : protected
 * - ~ : package/internal
 */
function extractClasses(content: string): Map<string, ClassNode> {
  const classes = new Map<string, ClassNode>();
  const lines = content.split('\n');

  let currentClass: string | null = null;
  let inClassBlock = false;
  let namespaceDepth = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('%%')) {
      continue;
    }

    // Track namespace blocks (allow classes inside namespaces)
    if (/^namespace\s+\w+\s*\{?/.test(trimmed)) {
      if (trimmed.includes('{')) {
        namespaceDepth++;
      }
      continue;
    }

    // Track closing braces for namespaces
    if (trimmed === '}' && namespaceDepth > 0 && !inClassBlock) {
      namespaceDepth--;
      continue;
    }

    // Match class definition: "class ClassName" or "class ClassName {" or "class Generic~Type~"
    const classMatch = /^class\s+([\w~<>,]+)\s*(\{?)/.exec(trimmed);
    if (classMatch) {
      const className = classMatch[1];
      const hasOpenBrace = classMatch[2] === '{';

      if (!classes.has(className)) {
        classes.set(className, {
          name: className,
          attributes: [],
          methods: [],
        });
      }

      if (hasOpenBrace) {
        currentClass = className;
        inClassBlock = true;
      }
      continue;
    }

    // Match class member: "ClassName : +member" or "ClassName : +method()" or "Generic~Type~ : +member"
    // Must start with a word character (not just ~) to avoid matching visibility modifiers
    const memberMatch = /^(\w[\w~<>,]*)\s*:\s*(.+)/.exec(trimmed);
    if (memberMatch) {
      const className = memberMatch[1];
      const member = memberMatch[2].trim();

      if (!classes.has(className)) {
        classes.set(className, {
          name: className,
          attributes: [],
          methods: [],
        });
      }

      const classNode = classes.get(className)!;
      if (member.includes('(')) {
        classNode.methods.push(member);
      } else {
        classNode.attributes.push(member);
      }
      continue;
    }

    // Inside class block, parse members
    if (inClassBlock && currentClass) {
      // End of class block
      if (trimmed === '}') {
        currentClass = null;
        inClassBlock = false;
        continue;
      }

      // Parse member inside block (skip empty lines)
      if (!trimmed) {
        continue;
      }

      const blockMemberMatch = /^([+\-#~])?\s*(.+)/.exec(trimmed);
      if (blockMemberMatch) {
        const visibility = blockMemberMatch[1] || '';
        const memberContent = blockMemberMatch[2].trim();
        const member = visibility ? `${visibility}${memberContent}` : memberContent;
        const classNode = classes.get(currentClass)!;

        if (memberContent.includes('(')) {
          classNode.methods.push(member);
        } else {
          classNode.attributes.push(member);
        }
      }
    }
  }

  return classes;
}

/**
 * Extracts relationships from diagram content
 *
 * Relationship patterns:
 * - ClassA <|-- ClassB (inheritance)
 * - ClassA *-- ClassB (composition)
 * - ClassA o-- ClassB (aggregation)
 * - ClassA --> ClassB (association)
 * - ClassA ..> ClassB (dependency)
 * - ClassA "1" --> "many" ClassB (multiplicity)
 */
function extractRelationships(content: string): ClassRelationship[] {
  const relationships: ClassRelationship[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments, class definitions, namespace declarations, and closing braces
    if (
      trimmed.startsWith('%%') ||
      trimmed.startsWith('class ') ||
      /^namespace\s+\w+/.test(trimmed) ||
      trimmed === '}'
    ) {
      continue;
    }

    // Match inheritance: ClassA <|-- ClassB or Generic~Type~ <|-- ClassB
    const inheritanceMatch = /([\w~<>,]+)\s*<\|--\s*([\w~<>,]+)(?:\s*:\s*(.+))?/.exec(trimmed);
    if (inheritanceMatch) {
      relationships.push({
        from: inheritanceMatch[2], // Child
        to: inheritanceMatch[1], // Parent
        type: 'inheritance',
        label: inheritanceMatch[3]?.trim(),
      });
      continue;
    }

    // Match composition: ClassA *-- ClassB or Generic~Type~ *-- ClassB
    const compositionMatch = /([\w~<>,]+)\s*\*--\s*([\w~<>,]+)(?:\s*:\s*(.+))?/.exec(trimmed);
    if (compositionMatch) {
      relationships.push({
        from: compositionMatch[1],
        to: compositionMatch[2],
        type: 'composition',
        label: compositionMatch[3]?.trim(),
      });
      continue;
    }

    // Match aggregation: ClassA o-- ClassB or Generic~Type~ o-- ClassB
    const aggregationMatch = /([\w~<>,]+)\s*o--\s*([\w~<>,]+)(?:\s*:\s*(.+))?/.exec(trimmed);
    if (aggregationMatch) {
      relationships.push({
        from: aggregationMatch[1],
        to: aggregationMatch[2],
        type: 'aggregation',
        label: aggregationMatch[3]?.trim(),
      });
      continue;
    }

    // Match dependency: ClassA ..> ClassB or Generic~Type~ ..> ClassB
    const dependencyMatch = /([\w~<>,]+)\s*\.\.>\s*([\w~<>,]+)(?:\s*:\s*(.+))?/.exec(trimmed);
    if (dependencyMatch) {
      relationships.push({
        from: dependencyMatch[1],
        to: dependencyMatch[2],
        type: 'dependency',
        label: dependencyMatch[3]?.trim(),
      });
      continue;
    }

    // Match association with optional multiplicity: ClassA "1" --> "many" ClassB or Generic~Type~ --> ClassB
    const associationMatch =
      /([\w~<>,]+)\s*(?:"([^"]+)")?\s*-->\s*(?:"([^"]+)")?\s*([\w~<>,]+)(?:\s*:\s*(.+))?/.exec(
        trimmed
      );
    if (associationMatch) {
      relationships.push({
        from: associationMatch[1],
        to: associationMatch[4],
        type: 'association',
        label: associationMatch[5]?.trim(),
        multiplicity: {
          from: associationMatch[2],
          to: associationMatch[3],
        },
      });
      continue;
    }
  }

  return relationships;
}

/**
 * Builds graph representation from relationships
 */
function buildGraphFromRelationships(
  classes: Map<string, ClassNode>,
  relationships: ClassRelationship[]
): GraphRepresentation {
  const nodes = Array.from(classes.keys());
  const edges: Edge[] = relationships.map((rel) => ({
    from: rel.from,
    to: rel.to,
    label: rel.label,
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
 * Parses a class diagram into structured representation
 *
 * @param content - Raw Mermaid class diagram code
 * @returns Parsed class diagram with classes, relationships, and graph
 */
export function parseClassDiagram(content: string): ClassDiagramParse {
  const classes = extractClasses(content);
  const relationships = extractRelationships(content);
  const graph = buildGraphFromRelationships(classes, relationships);

  return {
    classes,
    relationships,
    graph,
  };
}
