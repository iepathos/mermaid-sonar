---
number: 002
title: Migrate ESLint to Flat Config Format
category: foundation
priority: medium
status: draft
dependencies: []
created: 2025-11-16
---

# Specification 002: Migrate ESLint to Flat Config Format

**Category**: foundation
**Priority**: medium
**Status**: draft
**Dependencies**: None

## Context

The project currently uses ESLint v9.39.1 with the legacy `.eslintrc.js` configuration format. As of ESLint v9.0.0 (released in April 2024), the default configuration format changed to "flat config" (`eslint.config.js` or `eslint.config.mjs`). The legacy `.eslintrc.*` format is no longer supported by default in ESLint v9+.

This creates a blocking issue where the linter cannot run:
```bash
$ just lint
ESLint: 9.39.1

ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
```

**Current State**:
- ✅ Tests passing
- ✅ TypeScript compilation working
- ✅ Code formatting working
- ❌ Linting completely blocked

**Impact**:
- Development workflow lacks automated linting
- Code quality checks cannot run in CI/CD
- No enforcement of code style rules
- Risk of shipping code with linting violations

The legacy configuration format works but is deprecated and will be removed in future ESLint versions. Migration to flat config is required to unblock linting and ensure long-term compatibility.

## Objective

Migrate ESLint configuration from the legacy `.eslintrc.js` format to the modern flat config format (`eslint.config.mjs`), enabling linting to work with ESLint v9+ while maintaining all existing rules and functionality.

## Requirements

### Functional Requirements

1. **Flat Config Creation**
   - Create `eslint.config.mjs` with ES module syntax
   - Migrate all rules from `.eslintrc.js` to new format
   - Preserve existing TypeScript parser configuration
   - Maintain Prettier integration for style rules

2. **Package Dependencies**
   - Install `typescript-eslint` package (unified TypeScript-ESLint package)
   - Keep existing `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` (compatibility)
   - Verify `eslint-config-prettier` compatibility with flat config

3. **Configuration Parity**
   - All existing rules must be preserved:
     - `@typescript-eslint/no-explicit-any`: warn
     - `@typescript-eslint/explicit-function-return-type`: off
     - `@typescript-eslint/no-unused-vars`: error (with `argsIgnorePattern: '^_'`)
     - `no-console`: off (CLI tool needs console)
   - Language options must match:
     - ECMAScript version: 2022
     - Source type: module
     - Environment: Node.js

4. **Build System Integration**
   - Update `package.json` lint script if needed
   - Ensure `just lint` works with new config
   - Verify linting works with existing CI/CD setup

5. **Cleanup**
   - Remove old `.eslintrc.js` after successful migration
   - Document migration in commit message

### Non-Functional Requirements

1. **Compatibility**
   - Support all TypeScript files in `src/` and `tests/`
   - Work with existing ESLint v9.39.1
   - Integrate with existing Prettier configuration
   - Compatible with current IDE/editor integrations

2. **Performance**
   - No performance regression from config migration
   - Linting speed should match or exceed legacy config

3. **Maintainability**
   - Use modern flat config best practices
   - Clear, readable configuration structure
   - Well-documented configuration choices

4. **Developer Experience**
   - Linting errors should be clear and actionable
   - IDE integration should work seamlessly
   - No disruption to existing development workflow

## Acceptance Criteria

- [ ] `typescript-eslint` package installed in devDependencies
- [ ] `eslint.config.mjs` created with all existing rules migrated
- [ ] TypeScript parser and plugin configured correctly in flat config
- [ ] Prettier integration working (no style conflicts)
- [ ] `npm run lint` executes successfully without errors
- [ ] `just lint` executes successfully without errors
- [ ] All existing linting rules preserved and functional
- [ ] Linting runs on all `.ts` files in `src/` and `tests/`
- [ ] No false positives or new linting errors introduced
- [ ] Old `.eslintrc.js` removed
- [ ] Package.json lint script updated if needed
- [ ] Migration tested on actual codebase
- [ ] All tests continue to pass after migration
- [ ] Changes committed with clear migration message

## Technical Details

### Implementation Approach

**Phase 1: Install Dependencies**

```bash
npm install --save-dev typescript-eslint
```

**Phase 2: Create Flat Config**

Create `eslint.config.mjs`:

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // Apply recommended configs
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Prettier integration (disable style rules)
  eslintConfigPrettier,

  // Project-specific configuration
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // Custom rules matching .eslintrc.js
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' }
      ],
      'no-console': 'off', // CLI tool needs console
    },
  },
];
```

**Phase 3: Update Package.json**

Update lint script to use new flat config (if needed):

```json
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

ESLint v9+ automatically looks for `eslint.config.*` files, so the script simplifies to just `eslint .`.

**Phase 4: Verification**

1. Run linting: `npm run lint`
2. Verify no new errors introduced
3. Check that existing rules still apply
4. Test with intentional violations

**Phase 5: Cleanup**

1. Remove `.eslintrc.js`
2. Verify linting still works
3. Commit changes

### Architecture Changes

- **New File**: `eslint.config.mjs` - Flat config in ES module format
- **Removed File**: `.eslintrc.js` - Legacy configuration
- **Modified**: `package.json` - Add `typescript-eslint` dependency, update lint script
- **No Changes**: All source files remain unchanged

### Data Structures

**Config Structure Change**:

Legacy format (`.eslintrc.js`):
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended', ...],
  plugins: ['@typescript-eslint'],
  env: { node: true },
  rules: { ... }
}
```

Flat config (`eslint.config.mjs`):
```javascript
export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { ... },
    rules: { ... }
  }
]
```

Key differences:
- Array of config objects instead of single object
- Import plugins directly instead of string references
- `languageOptions` replaces `env`, `parserOptions`, `parser`
- Spread configs instead of `extends` array

### APIs and Interfaces

**TypeScript-ESLint v8 Flat Config API**:

```javascript
import tseslint from 'typescript-eslint';

// Recommended configs (array)
tseslint.configs.recommended

// Strict configs (array)
tseslint.configs.strict

// Stylistic configs (array)
tseslint.configs.stylistic
```

**ESLint v9 Flat Config API**:

```javascript
import eslint from '@eslint/js';

// Recommended base config
eslint.configs.recommended

// All rules config
eslint.configs.all
```

**Prettier Integration**:

```javascript
import eslintConfigPrettier from 'eslint-config-prettier';

// Add at end to override style rules
export default [
  // ... other configs
  eslintConfigPrettier,
];
```

## Dependencies

### Prerequisites
- None (foundation specification)

### Affected Components
- **Development Workflow**: Unblocks linting in local development
- **CI/CD Pipeline**: Enables linting in automated checks
- **IDE Integration**: May require restart/reload for editors to pick up new config
- **Justfile**: No changes needed (uses `npm run lint`)

### External Dependencies

**New Package**:
- `typescript-eslint` (v8.x): Unified TypeScript-ESLint package
  - Replaces scattered `@typescript-eslint/*` packages in flat config
  - Size: ~4MB (dev dependency, acceptable)
  - Peer dependency of ESLint v9

**Existing Packages** (compatibility):
- `@typescript-eslint/parser` (v8.46.4): Keep for backward compatibility
- `@typescript-eslint/eslint-plugin` (v8.46.4): Keep for backward compatibility
- `eslint-config-prettier` (v10.1.8): Compatible with flat config
- `eslint` (v9.39.1): Already installed, no change needed

### Package Compatibility Matrix

| Package | Version | Flat Config Support |
|---------|---------|-------------------|
| `eslint` | 9.39.1 | ✅ Native (required v9+) |
| `typescript-eslint` | 8.x | ✅ Full support |
| `eslint-config-prettier` | 10.1.8 | ✅ Compatible |
| `@typescript-eslint/parser` | 8.46.4 | ✅ Compatible (legacy) |
| `@typescript-eslint/eslint-plugin` | 8.46.4 | ✅ Compatible (legacy) |

## Testing Strategy

### Unit Tests

No new unit tests needed - this is a configuration change. However:

1. **Existing Tests Must Pass**
   - Run `npm test` after migration
   - Verify all 125 tests still pass
   - No new test failures

2. **Linting Tests**
   - Create test file with intentional violations
   - Verify ESLint catches them correctly
   - Test each configured rule

### Integration Tests

1. **Lint Command Tests**
   ```bash
   # Should succeed (no violations in codebase)
   npm run lint

   # Should succeed through justfile
   just lint

   # Should work with file patterns
   npx eslint src/**/*.ts
   npx eslint tests/**/*.ts
   ```

2. **Rule Verification**
   ```bash
   # Create test file with violations
   echo "const x: any = 1; const unused = 2;" > test-lint.ts

   # Should report:
   # - Warning for 'any' type
   # - Error for unused variable
   npx eslint test-lint.ts

   # Cleanup
   rm test-lint.ts
   ```

3. **Prettier Integration**
   ```bash
   # Should not conflict with Prettier
   npm run format
   npm run lint

   # No style-related errors
   ```

### Performance Tests

1. **Baseline Measurement**
   ```bash
   # Before migration (should fail)
   time npm run lint 2>/dev/null || true

   # After migration
   time npm run lint
   ```

2. **Expected Performance**
   - Cold run: <3 seconds for entire codebase
   - Warm run: <1 second (with caching)
   - No significant difference from legacy config

### User Acceptance

1. **Developer Experience**
   - Linting works in IDE (VSCode, IntelliJ, etc.)
   - Errors are clear and actionable
   - No workflow disruption

2. **CI/CD Integration**
   - Linting runs in CI pipeline
   - Exits with correct code (0 for success, 1 for violations)
   - Reports formatted correctly

## Documentation Requirements

### Code Documentation

**Inline Comments in `eslint.config.mjs`**:

```javascript
export default [
  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript-specific recommended rules
  ...tseslint.configs.recommended,

  // Disable style rules that conflict with Prettier
  eslintConfigPrettier,

  // Project-specific customizations
  {
    languageOptions: {
      ecmaVersion: 2022,      // ES2022 features
      sourceType: 'module',   // ES modules
    },
    rules: {
      // Allow 'any' with warning (transitional)
      '@typescript-eslint/no-explicit-any': 'warn',

      // CLI tool needs console.log
      'no-console': 'off',

      // Unused vars error, except underscore-prefixed
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' }
      ],
    },
  },
];
```

### User Documentation

**Update README.md**:

No user-facing documentation changes needed - linting is a development tool.

**Update CONTRIBUTING.md** (if exists):

```markdown
## Code Quality

### Linting

We use ESLint with TypeScript support:

\`\`\`bash
# Run linter
npm run lint

# Or via justfile
just lint
\`\`\`

### Configuration

ESLint is configured via `eslint.config.mjs` (flat config format).

Custom rules:
- TypeScript `any` type generates warnings (use specific types)
- Unused variables are errors (prefix with `_` to ignore)
- Console statements are allowed (CLI tool)
```

### Commit Message

```
fix: migrate ESLint to flat config format

Migrates from legacy .eslintrc.js to modern eslint.config.mjs
format required by ESLint v9+. This unblocks linting which was
completely broken with the previous configuration.

Changes:
- Add typescript-eslint package for flat config support
- Create eslint.config.mjs with all existing rules
- Remove deprecated .eslintrc.js
- Update lint script to use flat config

All existing linting rules are preserved and functional.
Linting now works correctly with ESLint v9.39.1.
```

## Implementation Notes

### Config Migration Mapping

**Environment → Language Options**:
```javascript
// Old (.eslintrc.js)
env: {
  node: true,
  es2022: true,
}

// New (eslint.config.mjs)
languageOptions: {
  ecmaVersion: 2022,
  sourceType: 'module',
  // Node globals included by default in Node.js environment
}
```

**Parser → Language Options**:
```javascript
// Old
parser: '@typescript-eslint/parser',
parserOptions: {
  ecmaVersion: 2022,
  sourceType: 'module',
}

// New
import tseslint from 'typescript-eslint';
// Parser included in tseslint.configs.recommended
languageOptions: {
  ecmaVersion: 2022,
  sourceType: 'module',
}
```

**Extends → Config Array**:
```javascript
// Old
extends: [
  'eslint:recommended',
  'plugin:@typescript-eslint/recommended',
  'prettier',
]

// New
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
]
```

**Plugins → Direct Imports**:
```javascript
// Old
plugins: ['@typescript-eslint']

// New
import tseslint from 'typescript-eslint';
// Plugin automatically included in configs
```

### Common Pitfalls to Avoid

1. **File Extension**
   - Use `.mjs` extension for ES modules
   - Or use `.js` with `"type": "module"` in package.json
   - Don't mix CommonJS and ESM syntax

2. **Config Spreading**
   - Use spread operator for config arrays: `...tseslint.configs.recommended`
   - Don't spread single config objects: `eslint.configs.recommended` (no spread)

3. **Import Order**
   - Import plugins before using in config
   - Prettier config must be last (to override style rules)

4. **Rule Names**
   - Rule names remain the same in flat config
   - No changes needed: `@typescript-eslint/no-explicit-any`

5. **Parser Options**
   - Parser is included in TypeScript-ESLint configs
   - Don't manually specify parser unless customizing

### IDE Configuration

**VSCode** (`settings.json`):
```json
{
  "eslint.experimental.useFlatConfig": true
}
```

Note: VSCode ESLint extension v3.0.5+ auto-detects flat config, so this may not be needed.

**IntelliJ/WebStorm**:
- Flat config support since 2023.2
- Auto-detects `eslint.config.mjs`
- May need IDE restart after config change

### Troubleshooting

**Issue**: "Cannot find module 'typescript-eslint'"

**Solution**: Run `npm install`

---

**Issue**: "Parsing error: ESLint was configured to run on..."

**Solution**: Ensure `tsconfig.json` exists and is valid

---

**Issue**: Style conflicts with Prettier

**Solution**: Ensure `eslint-config-prettier` is last in config array

---

**Issue**: IDE not picking up new config

**Solution**: Restart IDE or reload ESLint extension

## Migration and Compatibility

### Breaking Changes
- None for end users (CLI interface unchanged)
- Developers must use flat config format for modifications
- IDE extensions may need update/restart

### Configuration Changes
- Config file changes from `.eslintrc.js` to `eslint.config.mjs`
- All rules remain the same
- Lint script may simplify to `eslint .`

### Backward Compatibility
- All existing rules preserved
- No changes to TypeScript code
- No changes to test suite
- No changes to build output

### Migration Path

**For Developers**:

1. **Pull latest changes**
   ```bash
   git pull
   npm install
   ```

2. **Verify linting works**
   ```bash
   npm run lint
   ```

3. **Update IDE if needed**
   - Restart VSCode/IntelliJ
   - Verify ESLint extension is active
   - Check that errors appear inline

4. **Continue development**
   - No workflow changes
   - Linting runs as before

**For CI/CD**:
- No changes needed
- `just lint` continues to work
- Exit codes remain the same

### Rollback Plan

If migration causes issues:

1. **Revert commit**
   ```bash
   git revert HEAD
   ```

2. **Temporary workaround**
   ```bash
   # Downgrade ESLint to v8 (supports .eslintrc.js)
   npm install --save-dev eslint@^8.57.0
   ```

3. **Investigate and retry**
   - Review error messages
   - Check package versions
   - Verify tsconfig.json
   - Retry migration with fixes

## Success Metrics

- **Primary Goal**: Linting unblocked and working
  - ✅ `npm run lint` executes successfully
  - ✅ `just lint` executes successfully
  - ✅ No linting errors in current codebase

- **Code Quality**: All existing rules enforced
  - ✅ TypeScript rules active
  - ✅ Unused variable detection working
  - ✅ No false positives

- **Developer Experience**: Smooth migration
  - ✅ No workflow disruption
  - ✅ IDE integration working
  - ✅ Clear error messages

- **Performance**: No regression
  - ✅ Linting completes in <3 seconds
  - ✅ No significant overhead vs legacy config

- **Maintainability**: Modern, future-proof config
  - ✅ Using ESLint v9 recommended format
  - ✅ Compatible with latest tools
  - ✅ Ready for future ESLint updates

## Future Enhancements

1. **Stricter Rules**: Enable `tseslint.configs.strict` for better type safety
2. **Stylistic Rules**: Add `tseslint.configs.stylistic` for consistent code style
3. **Custom Rules**: Add project-specific linting rules as needed
4. **Performance**: Enable ESLint caching for faster subsequent runs
5. **Auto-fix**: Configure safe auto-fixes for common violations
6. **Pre-commit Hook**: Add Husky + lint-staged for automatic linting
