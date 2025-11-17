/**
 * Syntax Validation Rule
 *
 * Validates Mermaid diagram syntax using the official Mermaid parser.
 * Detects parse errors, invalid syntax, and unsupported features.
 */

import { Window } from 'happy-dom';
import createDOMPurify from 'isomorphic-dompurify';
import type { Rule, Issue, RuleConfig } from './types';
import type { Diagram } from '../extractors/types';
import type { Metrics } from '../analyzers/types';

// Dynamically imported mermaid instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mermaid: any = null;

// Initialize Mermaid parser once
let parserInitialized = false;

/**
 * Injects DOM polyfill into global context for Mermaid to work in Node.js
 * Based on https://github.com/mermaid-js/mermaid/issues/5204
 */
function injectDOMPolyfill(context: typeof globalThis): void {
  const window = new Window();

  // Copy all window properties to global context
  for (const key of Object.getOwnPropertyNames(window)) {
    if (key in context) continue;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (context as any)[key] = (window as any)[key];
    } catch {
      // Some properties are read-only and will throw
    }
  }

  // Set up DOMPurify for the global context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (context as any).DOMPurify = createDOMPurify(window as any);
}

async function initializeMermaidParser(): Promise<void> {
  if (parserInitialized) {
    return;
  }

  // Setup DOM polyfill BEFORE importing mermaid
  injectDOMPolyfill(globalThis);

  // Dynamically import mermaid after setting up globals
  const mermaidModule = await import('mermaid');
  mermaid = mermaidModule.default;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose', // Required for Node.js
    logLevel: 'error',
  });

  parserInitialized = true;
}

/**
 * Generate actionable suggestions based on error message
 */
function generateSuggestion(error: Error): string {
  const message = error.message || '';

  // Arrow syntax errors
  if (message.includes('-->') || message.toLowerCase().includes('arrow')) {
    return 'Use "-->" for edges in Mermaid diagrams, not "->" or "=>"';
  }

  // Diagram type errors
  if (message.includes('diagram type') || message.includes('Unrecognized')) {
    return 'Supported types: graph, flowchart, sequenceDiagram, classDiagram, stateDiagram, etc. See: https://mermaid.js.org/intro/';
  }

  // Parse errors
  if (message.toLowerCase().includes('parse error')) {
    return 'Check diagram syntax at indicated line. See: https://mermaid.js.org/intro/';
  }

  // Bracket/brace errors
  if (
    message.includes('[') ||
    message.includes(']') ||
    message.includes('{') ||
    message.includes('}')
  ) {
    return 'Ensure all brackets and braces are properly closed';
  }

  // Generic fallback
  return 'Fix syntax error according to Mermaid documentation: https://mermaid.js.org/intro/';
}

/**
 * Async Syntax Validation Rule Implementation
 */
export const syntaxValidationRule: Rule = {
  name: 'syntax-validation',
  defaultSeverity: 'error',

  async check(diagram: Diagram, _metrics: Metrics, config: RuleConfig): Promise<Issue | null> {
    const severity = config.severity ?? this.defaultSeverity;

    // Initialize parser on first use (await because it's async now)
    await initializeMermaidParser();

    try {
      // Parse diagram using Mermaid parser
      await mermaid.parse(diagram.content);
      return null; // No syntax errors
    } catch (error) {
      // Extract error details
      const errorObj = error as Error;
      const message = errorObj.message || 'Syntax error in diagram';

      return {
        rule: this.name,
        severity,
        message: `Syntax error: ${message}`,
        filePath: diagram.filePath,
        line: diagram.startLine,
        suggestion: generateSuggestion(errorObj),
      };
    }
  },
};
