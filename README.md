# rule-io-sdk

Nx monorepo for the Rule.io TypeScript SDK. Detailed usage docs live in [`packages/sdk`](packages/sdk/README.md) and the per-package READMEs; this README covers package selection, contributor workflow, and the release process.

## Packages

| Package | Purpose | Status |
|---|---|---|
| [`@rule/rcml`](packages/rcml) | RCML email-template builders, types, and validators | **Released** |
| [`@rule/client`](packages/client) | HTTP wrapper around the Rule.io v2/v3 API | **Released** |
| [`@rule/sdk`](packages/sdk) | Meta-package re-exporting `@rule/rcml` + `@rule/client` | **Released** |
| [`@rule/template-engine`](packages/template-engine) | XML template engine powering vendor email templates | Under development |
| [`@rule/vendor`](packages/vendor) | Shared vendor-preset infrastructure | Under development |
| [`@rule/vendor-shopify`](packages/vendor-shopify) | Shopify preset — e-commerce automation flows | Under development |
| [`@rule/vendor-bookzen`](packages/vendor-bookzen) | Bookzen preset — hospitality automation flows | Under development |
| [`@rule/vendor-samfora`](packages/vendor-samfora) | Samfora preset — Swedish donation flows | Under development |

---

## Which package should I install?

Most consumers install **one** package — npm pulls in everything else as transitive dependencies.

| If you want to… | Install | Notes |
|---|---|---|
| Call the Rule.io HTTP API | `@rule/client` | The 90% case. Brings in `@rule/rcml` automatically. |
| Compose custom RCML templates from primitives | `@rule/rcml` | Low-level builders only — pair with `@rule/client` to send. |
| Try everything in one install (prototypes, demos) | `@rule/sdk` | Meta-package re-exporting the libraries above. |

### Examples

Just calling the API:

```bash
npm install @rule/client
```

```ts
import { RuleClient } from '@rule/client';

const client = new RuleClient({ apiKey: process.env.RULE_API_KEY! });
await client.addSubscriberTagsV3('user@example.com', { tags: ['welcome'] });
```

Kitchen sink for prototyping:

```bash
npm install @rule/sdk
```

```ts
import { RuleClient, createBrandTemplate } from '@rule/sdk';
```

> `@rule/template-engine` is an infrastructure package — it almost never appears in a consumer's `package.json`. It arrives as a transitive dependency of the vendor preset packages (not yet released).

---

## Dependency graph

Clean DAG, no cycles — `←` reads as "depends on"; workspace edges only, external runtime deps live in each package's `package.json`:

```
template-engine

rcml            ← template-engine
client          ← rcml

vendor          ← rcml
vendor-bookzen  ← client, rcml, template-engine, vendor
vendor-samfora  ← rcml, template-engine, vendor
vendor-shopify  ← rcml, template-engine, vendor

sdk (meta)      ← rcml, client       [v0.3.0 release scope]
```

---

## Dev workflow

Node `>=20` required (the Nx plugins used by this workspace rely on `node:util.styleText`, added in Node 20.12 / 22). If you use nvm: `nvm use 22`.

```bash
npm install                         # install + link workspace packages
npx nx show projects                # sanity-check: list all packages in the workspace
npm run build                       # build all publishable packages → dist/packages/<pkg>/
npm run test                        # run every package's tests
npm run lint                        # lint every package
npm run graph                       # visualise the project graph in a browser
```

Building a single package (and its deps, in topological order):

```bash
npx nx build client    # builds rcml, then client
```

---

## Release process

Releases are orchestrated by [`nx release`](https://nx.dev/features/manage-releases) with version calculation driven by [Conventional Commits](https://www.conventionalcommits.org/).

> **Fixed/locked versioning** — all published packages share one version number. A release always versions the entire public SDK together.

### Branch strategy

| Branch | Purpose |
|---|---|
| `develop` | Primary active development branch. All feature work targets here. Never published directly. |
| `main` | Stable, releasable state. Merging to `main` triggers the automated release workflow. |
| `0.4.x`, `1.0.x`, … | Maintenance branches — critical fixes for older release lines. |

### Release flow

```
feature branches → develop → release PR → main → automated release workflow → (approval) → npm publish
```

Merging to `main` triggers CI. npm publishing is **gated by GitHub Environment approval** (`npm-production`) — the workflow auto-prepares the release but a human must approve before anything lands on the registry.

### Merge strategy

Always use **merge commit** when landing `develop` → `main`.

`nx release version` calculates the version bump by reading Conventional Commits directly from the git log. The merge strategy determines what Nx sees:

| Strategy | What Nx Release sees | Risk |
|---|---|---|
| **Merge commit** ✓ | Every `feat:`, `fix:`, `BREAKING CHANGE:` intact (Nx traverses through merge commits) | None — correct bump every time |
| Rebase merge | Every commit intact, but new SHAs on `main` mean `develop` requires a `reset --hard` to re-sync | Extra friction keeping `develop` in sync |
| Squash merge | One commit with the squash message | Minor bump if message is `feat:` — **no release** if message is `chore:` or generic. Also leaves `develop` with ghost commits that conflict on the next PR. |

After each merge to `main`, sync `develop`:

```bash
git fetch origin main
git checkout develop
git merge --ff-only origin/main
```

`--ff-only` fails loudly if `develop` has diverged unexpectedly, preventing an accidental extra merge commit.

### Versioning rules

**Beta stage (`0.x`):**

| Commit type | Result |
|---|---|
| `fix:`, `perf:` | beta patch increment — e.g. `0.3.0-beta.1` → `0.3.0-beta.2` |
| `feat:` | next beta minor line — e.g. `0.3.0-beta.2` → `0.4.0-beta.0` |
| `feat!:` / `BREAKING CHANGE:` footer | next beta minor line (same as `feat` during `0.x`) |
| `chore:`, `docs:`, `test:`, `style:`, `ci:`, `refactor:` | no bump |

**Stable (`1.0.0+`):**

| Commit type | Result |
|---|---|
| `fix:`, `perf:` | patch |
| `feat:` | minor |
| `feat!:` / `BREAKING CHANGE:` footer | major |
| `chore:`, `docs:`, `test:`, `style:`, `ci:`, `refactor:` | no bump |

Scope your commits when a change is package-specific: `fix(client): …`, `feat(rcml): …`.

### npm dist-tags

- Beta releases publish under the **`beta`** dist-tag → `npm install @rule/client@beta`
- Stable releases publish under **`latest`**

### What gets published

Not all packages in this monorepo are published — see the Packages table above. For each published package, Nx runs `npm publish` from `dist/packages/<pkg>/`. Contents of each tarball:

- `.js` + `.d.ts` output under `dist/packages/<pkg>/src/`
- the package-specific `README.md`
- the package-specific `CHANGELOG.md` (auto-generated by Nx Release)
- a `package.json` with the bumped version, rewritten paths, and no `devDependencies`

### Changelogs

Nx Release generates both a root `CHANGELOG.md` (SDK-level) and a per-package `CHANGELOG.md` for each published package.

### Rolling back a bad release

Published versions are **never unpublished or rewritten**. Roll back by publishing a new fix or revert version.

---

## Documentation

The SDK documentation site lives in `apps/docs/` and is built with [VitePress](https://vitepress.dev/). It is deployed to GitHub Pages from the `gh-pages` branch on every push to `main`.

### Content locations

| Content | Location |
|---|---|
| Cross-package guides (Getting Started, etc.) | `apps/docs/src/guide/` |
| Package-specific conceptual docs | `packages/{name}/docs/` |
| API reference (JSDoc) | `packages/{name}/src/` — generated by TypeDoc |
| Homepage | `apps/docs/src/index.md` |

### Local development

```bash
npm run docs:generate   # generate API reference + sync package docs
npm run docs:dev        # start dev server → http://localhost:5173/rule-io-sdk/
```

To preview the production build:

```bash
npm run docs:build      # build static site
npm run docs:preview    # serve the build locally
```

### Quality checks

```bash
npm run docs:check      # verify all public symbols are documented (TypeDoc)
npm run docs:build      # also runs VitePress's built-in dead-link checker
```

Both checks run automatically in CI on every PR.

### Adding or editing docs

- **Guide content**: edit Markdown files in `apps/docs/src/guide/` or `packages/{name}/docs/`. See `apps/docs/src/guide/contributing.md` for authoring guidelines.
- **API reference**: edit JSDoc in `packages/{name}/src/` and re-run `docs:generate`.
- **Generated files** (`apps/docs/src/api/`, `apps/docs/src/packages/`) are gitignored — never commit them.

---

## Repository layout

```
packages/
├── rcml/
├── client/
├── template-engine/
├── vendor/
├── vendor-shopify/
├── vendor-bookzen/
├── vendor-samfora/
└── sdk/                    # meta-package
apps/
└── docs/                   # VitePress documentation site
.github/workflows/          # CI + docs deployment
nx.json                     # Nx config incl. `release`
tsconfig.json               # path mappings for IDE autocompletion
```

---

## Contributing

> **Before creating a feature branch**, make sure your local `develop` is up to date with `main`. Release commits land on `main` first and are fast-forwarded into `develop` afterwards — branching from a stale `develop` will pull those already-merged commits into your PR diff.
>
> ```bash
> git fetch origin main
> git checkout develop
> git merge --ff-only origin/main
> ```
>
> Then create your branch from the updated `develop`.

- Start a branch from `develop`.
- Use conventional commits (`feat(client): …`, `fix(rcml): …`, etc.) — they drive the version bumps.
- Open a PR targeting `develop`; CI runs `nx affected -t eslint:lint test-ci build --parallel=3` on your changes.
- After merging into `develop`, open a release PR to `main`. Merging to `main` triggers the automated release workflow; a maintainer approves the npm publish step in the GitHub `npm-production` environment.
