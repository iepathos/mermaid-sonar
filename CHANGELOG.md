# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-11-16

### Added
- Complete Mermaid diagram analysis framework
- Six research-backed complexity rules:
  - max-nodes (50/100 thresholds based on cognitive load research)
  - max-edges (100 connection O(n²) limit)
  - graph-density (0.3 threshold)
  - cyclomatic-complexity (15 limit)
  - max-branch-width (8 parallel branches)
  - layout-hint (TD vs LR suggestions)
- Five output formats: console, JSON, markdown, GitHub, JUnit
- Configuration system with cosmiconfig support
- CLI with comprehensive options (--format, --strict, --max-warnings, etc.)
- Programmatic API for Node.js integration
- Pattern detection for common diagram anti-patterns
- Layout intelligence for optimal diagram orientation
- Comprehensive documentation:
  - Complete README with examples
  - API reference documentation
  - Rule catalog with research citations
  - Configuration guide
  - Output formats guide
- Integration examples:
  - GitHub Actions workflow
  - GitLab CI pipeline
  - Pre-commit hooks
  - VS Code tasks
  - Basic API usage
- Community infrastructure:
  - Contributing guidelines
  - Code of Conduct (Contributor Covenant 2.1)
  - Security policy
  - Issue templates (bug report, feature request)
  - Pull request template
  - Dependabot configuration
- CI/CD workflows:
  - Cross-platform testing (Linux, macOS, Windows)
  - Multi-version Node.js testing (18, 20, 22)
  - Automated release pipeline
  - Coverage reporting
- 91%+ test coverage across all modules
- MIT license

### Changed
- Version bumped to 1.0.0 for stable release

## [0.1.0] - 2025-11-16

### Added
- Project initialization
- Basic package structure
- TypeScript configuration
- Development tooling (ESLint, Prettier, Jest)
- Implementation plan

[Unreleased]: https://github.com/yourusername/mermaid-sonar/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/mermaid-sonar/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/yourusername/mermaid-sonar/releases/tag/v0.1.0
