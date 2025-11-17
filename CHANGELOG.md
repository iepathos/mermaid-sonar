# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-11-16

### Added
- **Syntax Validation** - Mermaid parser integration for detecting syntax errors before rendering
  - Line-accurate error reporting with context
  - Integration with official Mermaid parser
  - Non-zero exit codes for CI/CD integration
- **Complete Mermaid diagram analysis framework**
  - Six research-backed complexity rules:
    - max-nodes (50/100 thresholds based on cognitive load research)
    - max-edges (100 connection O(n²) limit)
    - graph-density (0.3 threshold)
    - cyclomatic-complexity (15 limit)
    - max-branch-width (8 parallel branches)
    - layout-hint (TD vs LR suggestions)
  - Pattern detection for common diagram anti-patterns
  - Layout intelligence for optimal diagram orientation
- **Output & Formatting**
  - Five output formats: console, JSON, markdown, GitHub, JUnit
  - Line numbers displayed for all diagrams (including valid ones)
  - Colorized terminal output with detailed metrics
- **Configuration & API**
  - Configuration system with cosmiconfig support
  - CLI with comprehensive options (--format, --strict, --max-warnings, etc.)
  - Programmatic API for Node.js integration
- **Documentation**
  - Complete README with examples
  - API reference documentation
  - Rule catalog with research citations
  - Configuration guide
  - Output formats guide
- **Integration Examples**
  - GitHub Actions workflow
  - GitLab CI pipeline
  - Pre-commit hooks
  - VS Code tasks
  - Jenkins pipeline
- **Community Infrastructure**
  - Contributing guidelines
  - Code of Conduct (Contributor Covenant 2.1)
  - Security policy
  - Issue templates (bug report, feature request)
  - Pull request template
  - Dependabot configuration
- **CI/CD Workflows**
  - Cross-platform testing (Linux, macOS, Windows)
  - Multi-version Node.js testing (18, 20, 22)
  - Automated release pipeline
  - Coverage reporting with GitHub Actions
- **Testing**
  - 91%+ test coverage across all modules
  - Integration tests for DOMPurify initialization
  - Unit tests for all core functionality

### Fixed
- DOMPurify initialization for Node.js environment compatibility
- False positives for flowchart terminator nodes
- False positives in reserved-words rule with actionable suggestions
- Coverage workflow by tracking package-lock.json

### Changed
- Upgraded readability rules from info to warning severity
- Migrated to ESLint flat config (eslint.config.js)
- Enhanced error messages with better context and suggestions
