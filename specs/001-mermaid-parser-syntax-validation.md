---
number: 001
title: Mermaid Parser Integration for Syntax Validation
category: foundation
priority: high
status: draft
dependencies: []
created: 2025-11-16
---

# Specification 001: Mermaid Parser Integration for Syntax Validation

**Category**: foundation
**Priority**: high
**Status**: draft
**Dependencies**: None

## Context

Currently, mermaid-sonar performs structural and complexity analysis on Mermaid diagrams (node count, edge count, cognitive load, etc.) but does not validate syntax. Users depend on separate tooling (e.g., `validate-mermaid.js` using `@mermaid-js/mermaid-cli`) to catch syntax errors like:
- Invalid arrow syntax
- Malformed node definitions
- Reserved word conflicts in problematic contexts
- Unsupported diagram features
- Parse errors that would prevent rendering

This creates a gap where users must run two separate tools:
1. `mermaid-sonar` for complexity/readability analysis
2. `validate-mermaid.js` for syntax validation

By integrating the Mermaid parser directly into mermaid-sonar, we can provide comprehensive diagram validation in a single tool with better performance than the CLI-based approach.

## Objective

Integrate the official Mermaid.js parser library into mermaid-sonar to detect and report syntax errors in diagrams, enabling users to catch both structural issues and syntax errors in a single analysis pass.

## Requirements

### Functional Requirements

1. **Parser Integration**
   - Add `mermaid` npm package as a dependency
   - Import and configure the Mermaid parser for validation-only use
   - Parse each extracted diagram through the Mermaid parser
   - Capture parse errors with line number accuracy

2. **Syntax Validation Rule**
   - Create new `syntax-validation` rule that runs the parser
   - Report syntax errors as `error` severity (blocking issues)
   - Include detailed error messages from parser
   - Maintain existing line number tracking from diagram extraction

3. **Error Reporting**
   - Format parse errors into standard Issue format
   - Include specific error message from Mermaid parser
   - Provide actionable suggestions for common syntax errors
   - Map parser errors to source line numbers in markdown files

4. **Performance Optimization**
   - Parser should run in-process (no browser spawning)
   - Validation should add minimal overhead to analysis time
   - Cache parser initialization to avoid repeated setup
   - Handle parser failures gracefully without crashing

### Non-Functional Requirements

1. **Performance**
   - Syntax validation should add <100ms per diagram on average
   - Total analysis time should remain under 2 seconds for typical markdown files
   - Memory usage should not increase by more than 50MB

2. **Compatibility**
   - Support all Mermaid diagram types that the parser supports
   - Match Mermaid.js version used in documentation rendering
   - Maintain backward compatibility with existing rules

3. **Reliability**
   - Parser errors should not crash the analysis tool
   - Invalid diagrams should be reported, not silently skipped
   - Other rules should continue to run even if syntax validation fails

4. **User Experience**
   - Error messages should be clear and actionable
   - Exit codes should reflect syntax errors appropriately
   - Quiet mode should suppress parser warnings but not errors

## Acceptance Criteria

- [ ] `mermaid` package added to dependencies with version pinning
- [ ] New `syntax-validation` rule created with `error` severity
- [ ] Parser successfully validates valid Mermaid diagrams without errors
- [ ] Parser detects and reports syntax errors with accurate line numbers
- [ ] Error messages include specific details from Mermaid parser
- [ ] Common syntax errors include helpful suggestions (e.g., "Did you mean '-->' instead of '->'?")
- [ ] Syntax validation runs as part of default rule set
- [ ] Tests cover valid diagrams, invalid syntax, and edge cases
- [ ] Performance overhead is <100ms per diagram on average
- [ ] Exit codes properly reflect syntax errors (non-zero on syntax errors)
- [ ] Documentation updated with syntax validation examples
- [ ] All existing tests continue to pass

## Technical Details

### Implementation Approach

1. **Add Dependency**
   ```bash
   npm install mermaid
   ```

2. **Create Syntax Validation Rule** (`src/rules/syntax-validation.ts`)
   ```typescript
   import mermaid from 'mermaid';

   export const syntaxValidationRule: Rule = {
     name: 'syntax-validation',
     defaultSeverity: 'error',

     async check(diagram: Diagram, _metrics: Metrics, config: RuleConfig): Promise<Issue | null> {
       try {
         // Parse diagram using Mermaid parser
         await mermaid.parse(diagram.content);
         return null; // No syntax errors
       } catch (error) {
         // Extract error details
         const message = error.message || 'Syntax error in diagram';
         return {
           rule: this.name,
           severity: 'error',
           message: `Syntax error: ${message}`,
           filePath: diagram.filePath,
           line: diagram.startLine,
           suggestion: generateSuggestion(error),
         };
       }
     }
   };
   ```

3. **Error Message Enhancement**
   - Parse Mermaid error messages to extract specific issues
   - Map common errors to helpful suggestions:
     - `Parse error on line X` → Show problematic line
     - `Expecting -->` → "Use '-->' for edges, not '->' or '=>'"
     - `Unexpected token` → Suggest valid syntax for diagram type

4. **Integration Points**
   - Add rule to default configuration in `src/config/defaults.ts`
   - Register rule in `src/rules/index.ts`
   - Ensure rule runs before structural analysis (fail fast on syntax errors)

### Architecture Changes

- **New File**: `src/rules/syntax-validation.ts` - Syntax validation rule
- **Modified**: `package.json` - Add mermaid dependency
- **Modified**: `src/rules/index.ts` - Register new rule
- **Modified**: `src/config/defaults.ts` - Include in default config
- **Modified**: `README.md` - Document syntax validation feature

### Data Structures

No new data structures needed - uses existing `Issue` interface:
```typescript
interface Issue {
  rule: string;          // 'syntax-validation'
  severity: Severity;    // 'error'
  message: string;       // Parser error message
  filePath: string;      // Source file path
  line: number;          // Line number in source file
  suggestion?: string;   // Actionable fix suggestion
  citation?: string;     // Link to Mermaid docs if applicable
}
```

### APIs and Interfaces

**Parser Configuration**:
```typescript
// Initialize Mermaid parser (one-time setup)
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  logLevel: 'error',
});
```

**Async Rule Support**:
- Syntax validation rule returns `Promise<Issue | null>`
- Update rule runner to support async rules
- Ensure proper error handling for async operations

## Dependencies

### Prerequisites
- None (foundation specification)

### Affected Components
- **Rule System**: Add async rule support
- **CLI**: Update exit codes to handle syntax errors
- **Reporters**: Ensure error-level issues are highlighted

### External Dependencies
- **mermaid** (npm): Official Mermaid.js library for parsing
  - Version: ^10.6.0 (or latest stable)
  - Size: ~2MB (acceptable for validation tool)
  - No browser dependencies in parse-only mode

## Testing Strategy

### Unit Tests

1. **Valid Diagram Tests** (`tests/unit/syntax-validation.test.ts`)
   - Valid flowchart with various arrow types
   - Valid sequence diagram
   - Valid graph with subgraphs
   - Complex but valid diagram with all features

2. **Invalid Syntax Tests**
   - Malformed arrows (e.g., `->` instead of `-->`)
   - Invalid node syntax
   - Unclosed brackets/braces
   - Reserved words in wrong context
   - Invalid diagram type
   - Empty diagrams

3. **Error Message Tests**
   - Verify error messages are captured correctly
   - Check line numbers map to source correctly
   - Validate suggestions are generated

4. **Edge Cases**
   - Very large diagrams
   - Diagrams with special characters
   - Multi-line labels
   - Comments in diagrams

### Integration Tests

1. **End-to-End Validation**
   - Run mermaid-sonar on markdown files with syntax errors
   - Verify exit codes are non-zero
   - Check error output format

2. **Compatibility Tests**
   - Test with same diagrams used by validate-mermaid.js
   - Verify parity in error detection
   - Confirm no false positives

### Performance Tests

- Measure parsing overhead on 100 diagrams
- Verify <100ms average per diagram
- Check memory usage stays reasonable
- Profile async operation performance

### User Acceptance

- **Before**: Users run separate validator script
- **After**: Single `mermaid-sonar` command catches all issues
- **Validation**: No syntax errors slip through to rendering

## Documentation Requirements

### Code Documentation

- JSDoc comments for syntax validation rule
- Document parser initialization and configuration
- Explain error mapping and suggestion logic
- Comment async rule handling

### User Documentation

Update `README.md` with:
```markdown
## Features

- ✅ **Syntax Validation**: Detects parse errors and invalid Mermaid syntax
- ✅ **Structural Analysis**: Analyzes complexity and readability
- ✅ **Pattern Detection**: Suggests layout improvements
...

## Examples

### Syntax Error Detection

\`\`\`bash
$ npx mermaid-sonar docs/diagram.md

docs/diagram.md
  15:1  error  Syntax error: Expecting '-->', got '->'  syntax-validation
\`\`\`
```

### Architecture Updates

Add to `ARCHITECTURE.md` (if exists):
- Syntax validation rule design
- Async rule execution flow
- Parser integration approach
- Error handling strategy

## Implementation Notes

### Parser Initialization

- Initialize Mermaid parser once at startup, not per-diagram
- Use strict security level to prevent XSS in parser
- Disable rendering features (parse-only mode)
- Set log level to 'error' to suppress warnings

### Error Message Parsing

Mermaid parser errors typically include:
- `Parse error on line X: ...`
- `Expecting TOKEN, got ACTUAL`
- `Unrecognized diagram type: ...`

Extract and format these for user-friendly output.

### Async Rule Considerations

- Most rules are synchronous, syntax validation is async
- Update `Rule.check()` signature to support `Promise<Issue | null>`
- Ensure backward compatibility with sync rules
- Handle Promise rejections gracefully

### Common Syntax Errors to Detect

1. **Wrong arrow syntax**: `->` vs `-->`
2. **Missing brackets**: `A[Label` (unclosed)
3. **Invalid shapes**: `A<Label>` (not supported)
4. **Typos in keywords**: `grapf TD` instead of `graph TD`
5. **Reserved words**: Using Mermaid keywords as node IDs

### Suggestion Templates

```typescript
function generateSuggestion(error: Error): string {
  const message = error.message;

  if (message.includes('Expecting -->')) {
    return 'Use "-->" for edges in Mermaid diagrams, not "->" or "=>"';
  }

  if (message.includes('Unrecognized diagram type')) {
    return 'Supported types: graph, flowchart, sequenceDiagram, classDiagram, etc.';
  }

  if (message.includes('Parse error')) {
    return 'Check diagram syntax at indicated line. See: https://mermaid.js.org/intro/';
  }

  return 'Fix syntax error according to Mermaid documentation';
}
```

## Migration and Compatibility

### Breaking Changes
- None (new feature, purely additive)

### Configuration Changes
- New rule `syntax-validation` added to default config
- Users can disable with `{ "syntax-validation": { "enabled": false } }`

### Backward Compatibility
- All existing rules continue to work
- Existing configs are compatible
- No changes to CLI interface
- Exit code behavior remains consistent (errors cause non-zero exit)

### Migration Path

Users currently using `validate-mermaid.js`:
1. Install/update mermaid-sonar
2. Run `mermaid-sonar` instead of `validate-mermaid.js`
3. Remove `@mermaid-js/mermaid-cli` dependency (if only used for validation)
4. Update CI/CD scripts to use mermaid-sonar

### Deprecation Notice

After syntax validation is released:
- Document that `validate-mermaid.js` is no longer needed
- Add note in ripgrep .prodigy/scripts/README.md
- Keep script for reference but mark as deprecated
- Update CI to use mermaid-sonar exclusively

## Success Metrics

- **Adoption**: Users stop using separate validator scripts
- **Performance**: <100ms parsing overhead per diagram
- **Accuracy**: 99%+ parity with CLI validator in error detection
- **User Satisfaction**: Reduced tool complexity (one tool instead of two)
- **Coverage**: Catches syntax errors before they reach documentation

## Future Enhancements

1. **Diagram Type Detection**: Auto-detect and suggest correct diagram type
2. **Fix Suggestions**: Provide automated fix suggestions for common errors
3. **Incremental Parsing**: Only re-parse changed diagrams
4. **Custom Parser Rules**: Allow users to add custom syntax checks
5. **IDE Integration**: Provide language server for real-time validation
