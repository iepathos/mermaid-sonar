/**
 * Class diagram analysis utilities
 *
 * Analyzes class diagram structure for width and height estimation
 */

import type { Diagram } from '../extractors/types';
import type { ClassNode, ClassDiagramParse } from '../graph/class-parser';
import { parseClassDiagram } from '../graph/class-parser';

/**
 * Analysis result for a class diagram
 */
export interface ClassAnalysis {
  /** Parsed class diagram structure */
  parse: ClassDiagramParse;
  /** Width of each inheritance level (classes per level) */
  levelWidths: number[];
  /** Maximum inheritance depth */
  maxInheritanceDepth: number;
  /** Relationship density (relationships per class) */
  relationshipDensity: number;
  /** Average class box width in characters */
  avgClassWidth: number;
  /** Maximum class box width in characters */
  maxClassWidth: number;
  /** Average class box height in members */
  avgClassHeight: number;
  /** Maximum class box height in members */
  maxClassHeight: number;
}

/**
 * Calculates the width of a class box based on its name and members
 */
function calculateClassWidth(classNode: ClassNode): number {
  const nameLengths = [classNode.name.length];
  const attributeLengths = classNode.attributes.map((attr) => attr.length);
  const methodLengths = classNode.methods.map((method) => method.length);

  const allLengths = [...nameLengths, ...attributeLengths, ...methodLengths];
  return Math.max(...allLengths, 0);
}

/**
 * Calculates the height of a class box based on member count
 */
function calculateClassHeight(classNode: ClassNode): number {
  return 1 + classNode.attributes.length + classNode.methods.length;
}

/**
 * Builds inheritance tree and calculates level widths
 *
 * Uses BFS to traverse from root classes (no parents) and count
 * classes at each inheritance level.
 */
function calculateInheritanceLevels(parse: ClassDiagramParse): {
  levelWidths: number[];
  maxDepth: number;
} {
  const { classes, relationships } = parse;

  // Find inheritance relationships only
  const inheritanceEdges = relationships.filter((rel) => rel.type === 'inheritance');

  if (inheritanceEdges.length === 0) {
    // No inheritance, all classes at level 0
    return {
      levelWidths: [classes.size],
      maxDepth: 1,
    };
  }

  // Build parent map (child -> parent)
  const parentMap = new Map<string, string>();
  for (const edge of inheritanceEdges) {
    parentMap.set(edge.from, edge.to);
  }

  // Find root classes (no parent in inheritance hierarchy)
  const rootClasses = new Set<string>();
  for (const className of classes.keys()) {
    if (!parentMap.has(className)) {
      rootClasses.add(className);
    }
  }

  // BFS to assign levels
  const classLevels = new Map<string, number>();
  const queue: Array<{ className: string; level: number }> = [];

  // Start with root classes at level 0
  for (const root of rootClasses) {
    queue.push({ className: root, level: 0 });
    classLevels.set(root, 0);
  }

  // BFS traversal
  while (queue.length > 0) {
    const { className, level } = queue.shift()!;

    // Find children (classes that inherit from this one)
    const children = inheritanceEdges
      .filter((edge) => edge.to === className)
      .map((edge) => edge.from);

    for (const child of children) {
      if (!classLevels.has(child)) {
        classLevels.set(child, level + 1);
        queue.push({ className: child, level: level + 1 });
      }
    }
  }

  // Count classes per level
  const maxLevel = Math.max(...Array.from(classLevels.values()), 0);
  const levelWidths = new Array(maxLevel + 1).fill(0);

  for (const level of classLevels.values()) {
    levelWidths[level]++;
  }

  return {
    levelWidths,
    maxDepth: maxLevel + 1,
  };
}

/**
 * Analyzes a class diagram for width and height estimation
 *
 * @param diagram - Class diagram to analyze
 * @returns Analysis with layout metrics
 */
export function analyzeClassDiagram(diagram: Diagram): ClassAnalysis {
  const parse = parseClassDiagram(diagram.content);
  const { classes, relationships } = parse;

  // Calculate class dimensions
  const classWidths = Array.from(classes.values()).map(calculateClassWidth);
  const classHeights = Array.from(classes.values()).map(calculateClassHeight);

  const avgClassWidth =
    classWidths.length > 0
      ? Math.round(classWidths.reduce((sum, w) => sum + w, 0) / classWidths.length)
      : 0;
  const maxClassWidth = classWidths.length > 0 ? Math.max(...classWidths) : 0;

  const avgClassHeight =
    classHeights.length > 0
      ? Math.round(classHeights.reduce((sum, h) => sum + h, 0) / classHeights.length)
      : 0;
  const maxClassHeight = classHeights.length > 0 ? Math.max(...classHeights) : 0;

  // Calculate inheritance levels
  const { levelWidths, maxDepth } = calculateInheritanceLevels(parse);

  // Calculate relationship density
  const relationshipDensity = classes.size > 0 ? relationships.length / classes.size : 0;

  return {
    parse,
    levelWidths,
    maxInheritanceDepth: maxDepth,
    relationshipDensity,
    avgClassWidth,
    maxClassWidth,
    avgClassHeight,
    maxClassHeight,
  };
}

/**
 * Estimates width of a class diagram in pixels
 *
 * Width is dominated by the widest inheritance level (most classes horizontally)
 */
export function estimateClassDiagramWidth(analysis: ClassAnalysis): number {
  const maxClassesPerLevel = Math.max(...analysis.levelWidths, 0);

  // Mermaid class diagram layout parameters
  const charWidth = 8; // pixels per character
  const classSpacing = 100; // horizontal spacing between classes
  const classBoxPadding = 40; // internal padding

  const avgBoxWidth = analysis.avgClassWidth * charWidth + classBoxPadding;

  return maxClassesPerLevel * (avgBoxWidth + classSpacing);
}

/**
 * Estimates height of a class diagram in pixels
 *
 * Height is based on inheritance depth and class box heights
 */
export function estimateClassDiagramHeight(analysis: ClassAnalysis): number {
  const depth = analysis.maxInheritanceDepth;

  // Mermaid class diagram layout parameters
  const memberHeight = 20; // pixels per member line
  const classSpacing = 80; // vertical spacing between levels

  const avgBoxHeight = analysis.avgClassHeight * memberHeight;

  return depth * (avgBoxHeight + classSpacing);
}
