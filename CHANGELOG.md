# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2025-11-19

### Added
- **Configurable Viewport Constraints** - Allow users to configure diagram width and height constraints for different rendering contexts
  - ViewportProfile and ViewportConfig types for flexible configuration
  - Five built-in viewport profiles:
    - `default` - Standard web browser viewport (1200x800px)
    - `mkdocs` - MkDocs Material theme constraints (1000x1000px)
    - `docusaurus` - Docusaurus documentation constraints (1000x1200px)
    - `github` - GitHub README rendering constraints (800x1000px)
    - `mobile` - Mobile device viewport (375x667px)
  - CLI flags for viewport configuration:
    - `--viewport-profile` - Select built-in profile
    - `--max-width` - Override maximum width (hard limit)
    - `--max-height` - Override maximum height (hard limit)
  - Viewport configuration validation with clear error messages
  - Comprehensive documentation in README and configuration guide

### Fixed
- Viewport error thresholds now correctly inherit from maxWidth/maxHeight regardless of profile or override source
- Integration test exit code handling for viewport violations
- Config validation checks for invalid values (negative dimensions, non-numeric values, out-of-order thresholds)

### Changed
- Replaced `any` types with proper `ExecError` interface in integration tests for improved type safety

## [1.1.0] - 2025-11-17

### Added
- **Horizontal Width Readability Rule** - Detects diagrams exceeding viewport width limits
  - Layout-specific width estimation (LR: sequential chains, TD: branching width)
  - Configurable thresholds (info: 1500px, warning: 2000px, error: 2500px)
  - Layout-specific suggestions (LR suggests TD conversion when appropriate)
  - Multi-shape label extraction support
- **Horizontal Chain Length Validation** - Warns about excessively long linear chains
  - Layout-specific thresholds (LR/RL: 8 nodes, TD/TB: 12 nodes)
  - Linear chain detection algorithm with cycle handling
  - Bidirectional validation prevents contradictory layout suggestions
  - Integration with layout-hint rule to suppress inappropriate TD→LR recommendations
- **Vertical Height Readability Rule** - Detects diagrams exceeding viewport height
  - Layout-direction aware (TD/TB: depth-based, LR/RL: width-based height calculation)
  - Configurable thresholds (info: 800px, warning: 1200px, error: 2000px)
  - Layout-specific fix suggestions
  - Coordinates with horizontal-width-readability to detect multi-dimensional issues
- **Enhanced Documentation**
  - Comprehensive rule documentation in docs/rules.md for all new rules
  - Real-world examples and fix suggestions
  - Width/height calculation formulas explained
  - Configuration options documented

### Fixed
- Label text no longer counted as separate nodes in structure analyzer
- Mixed-case node IDs now correctly recognized (e.g., Start, Filter, Skip)
- Build now runs before tests to ensure CLI availability in integration tests
- Node extraction patterns improved to prevent false positives from shape delimiters

### Changed
- Stricter thresholds for horizontal-width-readability rule
  - info threshold lowered to 1200px (viewport exceedance)
  - warning threshold lowered to 1500px (was 2000px)
  - error threshold set to 2500px for severely unreadable diagrams
- Updated release workflow to publish to npm with OIDC authentication
- Improved width calculation for LR/RL layouts using longest linear chain instead of total node count (20-30% reduction in false positives)

### CI/CD
- Bumped actions/upload-artifact from v4 to v5
- Enhanced npm publishing workflow with OIDC support

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
