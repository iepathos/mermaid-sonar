# Contributing to Mermaid-Sonar

Thank you for your interest in contributing to Mermaid-Sonar! This guide will help you get started.

## Code of Conduct

This project adheres to the Contributor Covenant [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Mermaid-Sonar version** (`mermaid-sonar --version`)
- **Node.js version** (`node --version`)
- **Operating system**
- **Configuration file** (if applicable)
- **Sample diagram** that triggers the issue
- **Expected vs actual behavior**
- **Steps to reproduce**

Use the bug report template when creating an issue.

### Suggesting Features

Feature suggestions are welcome! Please:

- **Check existing feature requests** to avoid duplicates
- **Describe the use case** - why you need this feature
- **Propose a solution** - how you envision it working
- **Consider alternatives** - other ways to solve the problem

Use the feature request template when creating an issue.

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Follow the development setup** below
3. **Make your changes** following our coding standards
4. **Add tests** for new functionality
5. **Ensure all tests pass** (`npm test`)
6. **Run linting** (`npm run lint`)
7. **Format code** (`npm run format`)
8. **Update documentation** if needed
9. **Submit a pull request**

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/mermaid-sonar.git
cd mermaid-sonar

# Install dependencies
npm install

# Run tests to verify setup
npm test
```

### Development Workflow

```bash
# Watch mode for development
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Check test coverage
npm run test:coverage

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

### Project Structure

```
mermaid-sonar/
├── src/
│   ├── analyzer/          # Core analysis logic
│   ├── parser/            # Mermaid diagram parsing
│   ├── rules/             # Rule implementations
│   ├── formatters/        # Output formatters
│   ├── cli.ts             # CLI entry point
│   └── index.ts           # Programmatic API
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── fixtures/          # Test fixtures
├── docs/                  # Documentation
└── examples/              # Usage examples
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Provide types for all public APIs
- Avoid `any` type - use `unknown` with type guards
- Use interfaces for object shapes
- Prefer `const` over `let`, never use `var`

### Code Style

We use ESLint and Prettier for consistent code style:

```bash
# Check formatting
npm run format:check

# Auto-format code
npm run format

# Run linter
npm run lint
```

### Naming Conventions

- **Files**: kebab-case (e.g., `graph-analyzer.ts`)
- **Classes**: PascalCase (e.g., `DiagramAnalyzer`)
- **Functions**: camelCase (e.g., `analyzeGraph`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_NODES`)
- **Interfaces**: PascalCase (e.g., `AnalysisResult`)

### Function Design

- Keep functions small (< 20 lines preferred)
- Single responsibility per function
- Pure functions when possible
- Avoid deep nesting (max 2-3 levels)
- Document complex logic

### Testing

- Write tests for all new functionality
- Aim for 80%+ code coverage
- Use descriptive test names: `test('should detect high node count in complex diagrams')`
- Follow Arrange-Act-Assert pattern
- Test edge cases and error conditions

Example test structure:

```typescript
describe('GraphAnalyzer', () => {
  describe('analyzeComplexity', () => {
    test('should flag diagrams exceeding node threshold', () => {
      // Arrange
      const diagram = createTestDiagram(60);
      const analyzer = new GraphAnalyzer();

      // Act
      const result = analyzer.analyzeComplexity(diagram);

      // Assert
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].rule).toBe('max-nodes');
    });
  });
});
```

## Adding New Rules

To add a new complexity rule:

1. **Create rule file** in `src/rules/your-rule.ts`
2. **Implement rule interface**:

```typescript
import { Rule, DiagramContext, Issue } from '../types';

export const yourRule: Rule = {
  name: 'your-rule',
  description: 'Brief description of what this rule checks',
  severity: 'warning',

  check(context: DiagramContext): Issue[] {
    const issues: Issue[] = [];
    // Rule logic here
    return issues;
  }
};
```

3. **Add tests** in `tests/rules/your-rule.test.ts`
4. **Register rule** in `src/rules/index.ts`
5. **Document rule** in `docs/rules.md`:
   - What it checks
   - Why it matters (with research citation)
   - Example that triggers it
   - How to fix
   - Configuration options

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Update docs/ for new features or rules
- Include code examples that actually work
- Keep CHANGELOG.md updated (see below)

## Commit Messages

Follow conventional commits format:

```
type(scope): brief description

Longer explanation if needed

Fixes #123
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions/changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Build/tooling changes

**Examples**:
```
feat(rules): add max-branch-width rule for tree diagrams

Implements detection of overly wide tree structures based on
visual hierarchy research. Suggests using LR layout for wide trees.

Closes #42
```

```
fix(parser): handle mermaid code blocks without language tag

Some markdown files use ``` instead of ```mermaid. Parser now
handles both cases correctly.

Fixes #67
```

## Changelog

We follow [Keep a Changelog](https://keepachangelog.com/) format. When making changes:

1. Add entry under `[Unreleased]` section
2. Use appropriate category:
   - **Added** for new features
   - **Changed** for changes in existing functionality
   - **Deprecated** for soon-to-be removed features
   - **Removed** for removed features
   - **Fixed** for bug fixes
   - **Security** for security fixes

Example:

```markdown
## [Unreleased]

### Added
- New `max-branch-width` rule for detecting wide tree diagrams (#42)

### Fixed
- Parser now handles mermaid blocks without language tag (#67)
```

## Release Process

Maintainers handle releases:

1. Update version in `package.json`
2. Move unreleased changes to new version section in CHANGELOG.md
3. Create git tag: `git tag -a v1.2.0 -m "Version 1.2.0"`
4. Push tag: `git push origin v1.2.0`
5. GitHub Actions automatically publishes to npm

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Security**: Email glen@example.com
- **Chat**: Join our community (link TBD)

## Recognition

Contributors are recognized in:
- CHANGELOG.md for their contributions
- Release notes
- GitHub contributors page

Thank you for contributing to making diagram analysis better for everyone!
