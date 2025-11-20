/**
 * Class Diagram Width Rule
 *
 * Detects class diagrams that will be too wide for standard viewports due to
 * horizontal class distribution at inheritance levels.
 *
 * Class diagrams use automatic layout that positions classes horizontally at
 * each inheritance level, causing width issues when many classes exist at the
 * same level.
 */

import type { Rule, Issue, RuleConfig } from './types';
import type { Diagram } from '../extractors/types';
import type { Metrics } from '../analyzers/types';
import { analyzeClassDiagram, estimateClassDiagramWidth } from '../analyzers/class-analyzer';

/**
 * Generates suggestions for reducing class diagram width
 */
function generateSuggestions(
  width: number,
  targetWidth: number,
  maxClassesPerLevel: number,
  classCount: number,
  inheritanceDepth: number
): string {
  const exceedsBy = width - targetWidth;
  const suggestions: string[] = [];

  suggestions.push(
    'Split into multiple diagrams by domain or functional area (e.g., separate diagrams for different modules)'
  );

  if (maxClassesPerLevel > 6) {
    suggestions.push('Group related classes into separate inheritance hierarchies');
  }

  if (inheritanceDepth > 1) {
    suggestions.push(
      'Focus each diagram on a single inheritance branch rather than showing the entire hierarchy'
    );
  }

  suggestions.push('Use composition over inheritance to reduce hierarchy width');
  suggestions.push('Show only key classes and relationships, omit utility classes');

  const header =
    `Class diagram width (${width}px) exceeds viewport limit (${targetWidth}px) by ${exceedsBy}px.\n` +
    `${classCount} classes with ${maxClassesPerLevel} classes at widest inheritance level.\n` +
    `Inheritance depth: ${inheritanceDepth} levels.\n\n` +
    'Suggestions:\n';

  return header + suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
}

/**
 * Class diagram width rule
 *
 * Checks if class diagrams exceed reasonable viewport widths based on the
 * number of classes at each inheritance level.
 */
export const classDiagramWidthRule: Rule = {
  name: 'class-diagram-width',
  defaultSeverity: 'warning',

  check(diagram: Diagram, _metrics: Metrics, config: RuleConfig): Issue | null {
    // Only check class diagrams
    if (diagram.type !== 'class') {
      return null;
    }

    const severity = config.severity ?? this.defaultSeverity;

    // Analyze class diagram
    const analysis = analyzeClassDiagram(diagram);
    const width = estimateClassDiagramWidth(analysis);

    // Configuration with defaults
    const targetWidth = (config.targetWidth as number) ?? 1200;
    const thresholds =
      (config.thresholds as { info?: number; warning?: number; error?: number }) ?? {};
    const infoThreshold = thresholds.info ?? 1500;
    const warningThreshold = thresholds.warning ?? 2000;
    const errorThreshold = thresholds.error ?? 2500;

    // Determine severity based on width
    let issueSeverity: 'info' | 'warning' | 'error' | null = null;
    if (width >= errorThreshold) {
      issueSeverity = 'error';
    } else if (width >= warningThreshold) {
      issueSeverity = 'warning';
    } else if (width >= infoThreshold) {
      issueSeverity = 'info';
    }

    // No issue if within limits
    if (!issueSeverity) {
      return null;
    }

    const maxClassesPerLevel = Math.max(...analysis.levelWidths, 0);
    const classCount = analysis.parse.classes.size;

    const message = `Class diagram width (${width}px) exceeds viewport limit due to ${maxClassesPerLevel} classes at widest inheritance level`;

    const suggestion = generateSuggestions(
      width,
      targetWidth,
      maxClassesPerLevel,
      classCount,
      analysis.maxInheritanceDepth
    );

    return {
      rule: this.name,
      severity: issueSeverity === 'info' ? 'info' : issueSeverity === 'error' ? 'error' : severity,
      message,
      filePath: diagram.filePath,
      line: diagram.startLine,
      suggestion,
    };
  },
};
