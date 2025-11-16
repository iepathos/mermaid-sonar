# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within Mermaid-Sonar, please send an email to glen@example.com. All security vulnerabilities will be promptly addressed.

**Please do not report security vulnerabilities through public GitHub issues.**

### What to Include

When reporting a vulnerability, please include:

- Type of vulnerability (e.g., command injection, path traversal)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours of receiving your report
- **Status Update**: Within 7 days with an expected timeline for a fix
- **Fix Release**: Security patches will be released as soon as possible, typically within 30 days

### Disclosure Policy

- We request that you give us reasonable time to address the vulnerability before public disclosure
- We will acknowledge your contribution in the security advisory (unless you prefer to remain anonymous)
- Once a fix is released, we will publish a security advisory on GitHub

## Security Best Practices

When using Mermaid-Sonar:

1. **Keep Updated**: Always use the latest version to benefit from security patches
2. **Review Input**: If using programmatically, validate and sanitize file paths
3. **Limit Permissions**: Run with minimal required file system permissions
4. **Check Dependencies**: Regularly audit dependencies with `npm audit`

## Known Security Considerations

### File System Access

Mermaid-Sonar reads files from the file system based on user-provided paths. Users should:

- Only analyze files from trusted sources
- Be cautious with glob patterns that might match sensitive files
- Avoid running with elevated privileges unless necessary

### Configuration Files

Configuration files are loaded using cosmiconfig. Ensure:

- Configuration files come from trusted sources
- Review `.sonarrc.js` files for malicious code (if using JS config)
- Use JSON/YAML config formats when possible for better security

## Security Updates

Security updates and advisories will be published:

- In the project's [GitHub Security Advisories](https://github.com/yourusername/mermaid-sonar/security/advisories)
- In the CHANGELOG.md with a `[SECURITY]` tag
- As GitHub releases with detailed information

## Bug Bounty Program

We currently do not offer a paid bug bounty program, but we deeply appreciate security researchers who responsibly disclose vulnerabilities. We will publicly acknowledge your contribution (with your permission) in:

- Security advisories
- Release notes
- Project documentation

Thank you for helping keep Mermaid-Sonar and its users safe!
