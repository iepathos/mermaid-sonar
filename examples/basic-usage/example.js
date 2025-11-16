// Basic usage example for Mermaid-Sonar API

const { analyzeDiagrams, analyzeFile, analyzeContent } = require('mermaid-sonar');

async function basicExample() {
  console.log('=== Basic Mermaid-Sonar Usage Examples ===\n');

  // Example 1: Analyze files using glob pattern
  console.log('1. Analyzing files with glob pattern:');
  const results = await analyzeDiagrams('*.md');
  console.log(`   Found ${results.summary.diagramsAnalyzed} diagrams`);
  console.log(`   Issues: ${results.summary.totalIssues}\n`);

  // Example 2: Analyze a single file
  console.log('2. Analyzing a single file:');
  const fileResults = await analyzeFile('example-diagram.md');
  console.log(`   Diagrams in file: ${fileResults.diagrams.length}\n`);

  // Example 3: Analyze diagram content directly
  console.log('3. Analyzing diagram content:');
  const diagram = `
graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Process 1]
  B -->|No| D[Process 2]
  C --> E[End]
  D --> E
`;
  const diagramResult = analyzeContent(diagram);
  console.log(`   Metrics:`, diagramResult.metrics);
  console.log(`   Issues: ${diagramResult.issues.length}\n`);

  // Example 4: Custom configuration
  console.log('4. Using custom configuration:');
  const customResults = await analyzeDiagrams('*.md', {
    rules: {
      'max-nodes': {
        enabled: true,
        'high-density': 40,
        severity: 'warning'
      }
    }
  });
  console.log(`   Analyzed with custom rules`);
  console.log(`   Warnings: ${customResults.summary.warningCount}\n`);

  // Example 5: Filter results
  console.log('5. Filtering results:');
  const errors = results.results.filter(r =>
    r.issues.some(issue => issue.severity === 'error')
  );
  console.log(`   Diagrams with errors: ${errors.length}\n`);
}

// Run the examples
basicExample().catch(console.error);
