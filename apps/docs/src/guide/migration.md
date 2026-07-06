# Migrating to @rule

All Rule.io SDK packages have been renamed from the `@rulecom` scope to `@rule`. The API is unchanged — only the package names and import paths need to be updated.

## Install the new packages

Replace your existing `@rulecom` packages with the `@rule` equivalents.

If you use the meta-package:

```bash
npm uninstall @rulecom/sdk
npm install @rule/sdk
```

If you use individual packages:

```bash
npm uninstall @rulecom/client @rulecom/rcml
npm install @rule/client @rule/rcml
```

## Update your imports

Find and replace all `@rulecom/` occurrences in your source files with `@rule/`.

```typescript
// Before
import { RuleClient } from '@rulecom/sdk';
import { RuleApiError } from '@rulecom/client';
import { xmlToRcml } from '@rulecom/rcml';

// After
import { RuleClient } from '@rule/sdk';
import { RuleApiError } from '@rule/client';
import { xmlToRcml } from '@rule/rcml';
```

## Compatibility

The `@rulecom/*` packages on npm are deprecated and will no longer receive updates. All new releases are published exclusively under `@rule/*`.

If you are setting up a new project, see [Getting Started](/guide/getting-started).
