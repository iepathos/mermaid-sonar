/**
 * Mock implementation of mermaid for testing
 */

interface MermaidConfig {
  startOnLoad?: boolean;
  securityLevel?: string;
  logLevel?: string;
}

const mermaid = {
  initialize(_config: MermaidConfig): void {
    // Mock initialization - no-op
  },

  async parse(diagram: string): Promise<void> {
    // Mock parser - validates basic diagram structure
    if (!diagram || diagram.trim() === '') {
      throw new Error('Empty diagram');
    }

    // Check for valid diagram type
    const validTypes = [
      'flowchart',
      'graph',
      'sequenceDiagram',
      'classDiagram',
      'stateDiagram',
      'erDiagram',
      'journey',
      'gantt',
      'pie',
      'gitGraph',
    ];

    const firstLine = diagram.trim().split('\n')[0].trim();
    const hasValidType = validTypes.some((type) => firstLine.startsWith(type));

    if (!hasValidType) {
      throw new Error('No diagram type found');
    }

    // Check for unclosed brackets
    const openBrackets = (diagram.match(/\[/g) || []).length;
    const closeBrackets = (diagram.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      throw new Error('Parse error: Unclosed bracket');
    }

    // Check for invalid arrow syntax (single arrow instead of double)
    if (diagram.includes(' -> ') && !diagram.includes(' --> ')) {
      throw new Error('Parse error: Invalid arrow syntax, expecting "-->"');
    }

    // Valid diagram
    return Promise.resolve();
  },
};

export default mermaid;
