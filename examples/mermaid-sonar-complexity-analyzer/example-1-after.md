# Example 1 (After): Wide Tree with LR Layout

## Solution

Convert to LR layout - stacks branches vertically for natural scrolling.

**Fix**: Changed `graph TD` to `graph LR`

```mermaid
graph LR
    Root["ripgrep Documentation"] --> Intro["Introduction
    Get Started"]
    Root --> Guide["User Guide
    Basic Features"]
    Root --> Advanced["Advanced Topics
    Power Users"]
    Root --> Reference["Reference
    Complete API"]
    Root --> Troubleshooting["Troubleshooting
    Common Issues"]
```

## Expected Validation Result

When running `npx mermaid-sonar --viewport-profile mkdocs` on this file:

```
✅ No issues found
```

## What Changed

- **TD layout with parallel branches** = horizontal spread (width problem)
- **LR layout with parallel branches** = vertical stacking (natural scrolling)
- Same node count and complexity
- Pure layout orientation change

## Compare

- Before: `example-1-before.md` (⚠️ 712px width warning)
- After: `example-1-after.md` (✅ passes validation)
