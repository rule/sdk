## 0.4.0-beta.8 (2026-06-19)

### 🚀 Features

- rename npm scope from @rulecom to @rule ([4575ff6](https://github.com/rulecom/rule-io-sdk/commit/4575ff6))

### ❤️ Thank You

- Claude
- Oleksandr Ryzhyk

## 0.4.0-beta.7 (2026-06-17)

### 🚀 Features

- **rcml:** add sms namespace builders for SmsContentJson + email namespace mirror ([d380ca2](https://github.com/rulecom/rule-io-sdk/commit/d380ca2))
- **rcml:** add SMS RCML module with full architecture parity to email ([4dc9930](https://github.com/rulecom/rule-io-sdk/commit/4dc9930))
- **rcml:** add column-width validator for rc-column elements ([5ffb4d2](https://github.com/rulecom/rule-io-sdk/commit/5ffb4d2))
- **rcml:** apply font-style rc-class defaults to body elements in applyTheme ([8e0dae6](https://github.com/rulecom/rule-io-sdk/commit/8e0dae6))

### 🩹 Fixes

- **rcml:** reject element children in rc-sms during XML parse ([1c64f63](https://github.com/rulecom/rule-io-sdk/commit/1c64f63))
- **rcml:** tighten CreateSmsContentOptions.paragraphs to a non-empty tuple ([5ba029a](https://github.com/rulecom/rule-io-sdk/commit/5ba029a))
- **rcml:** fix lint errors introduced in 625f378 ([fa5d03e](https://github.com/rulecom/rule-io-sdk/commit/fa5d03e))
- **rcml:** address second round of Copilot review findings ([625f378](https://github.com/rulecom/rule-io-sdk/commit/625f378))
- **rcml:** replace Array.findLast with compatible last-element lookup ([909a75c](https://github.com/rulecom/rule-io-sdk/commit/909a75c))
- **rcml:** address Copilot review findings ([29403a2](https://github.com/rulecom/rule-io-sdk/commit/29403a2))
- **rcml:** fix lint errors — blank lines and wire validateColumnWidths into safeValidateEmailTemplate ([72fb5c0](https://github.com/rulecom/rule-io-sdk/commit/72fb5c0))

### ❤️ Thank You

- Claude
- Claude Sonnet 4.6
- Oleksandr Ryzhyk

## 0.4.0-beta.6 (2026-06-05)

This was a version bump only for rcml to align it with other projects, there were no code changes.

## 0.4.0-beta.5 (2026-05-29)

### 🚀 Features

- **rcml:** expose machine-readable placeholderSpec public API ([73b0ac6](https://github.com/rulecom/rule-io-sdk/commit/73b0ac6))
- **rcml:** expose machine-readable rfmSpec public API ([c82c917](https://github.com/rulecom/rule-io-sdk/commit/c82c917))
- **rcml:** export machine-readable rcmlSpec as public API ([101797d](https://github.com/rulecom/rule-io-sdk/commit/101797d))

### 🩹 Fixes

- **docs:** address Copilot review comments on PR #148 ([#148](https://github.com/rulecom/rule-io-sdk/issues/148))
- **docs:** fix 9 dead links breaking VitePress build ([3939cf9](https://github.com/rulecom/rule-io-sdk/commit/3939cf9))
- **rcml:** address Copilot review comments on public specs ([5641c11](https://github.com/rulecom/rule-io-sdk/commit/5641c11))

### ❤️ Thank You

- Claude Sonnet 4.6
- Oleksandr Ryzhyk

## 0.4.0-beta.4 (2026-05-20)

### 🩹 Fixes

- **rcml:** scope attr-override relaxation and align RcmlAttributesChild types ([d0727d1](https://github.com/rulecom/rule-io-sdk/commit/d0727d1))
- **rcml:** enforce minProperties:1 on font-mark attrs in JSON schema ([3367d58](https://github.com/rulecom/rule-io-sdk/commit/3367d58))
- **rcml:** fix lint errors in json-schema.ts ([c3530c3](https://github.com/rulecom/rule-io-sdk/commit/c3530c3))
- **rcml:** propagate logo src to rc-logo body nodes in applyTheme ([68f1d99](https://github.com/rulecom/rule-io-sdk/commit/68f1d99))
- **rcml:** allow sparse font marks in ProseMirror content JSON schema ([c417af9](https://github.com/rulecom/rule-io-sdk/commit/c417af9))
- **rcml:** drop spurious children/content from attribute-default bg nodes ([8607393](https://github.com/rulecom/rule-io-sdk/commit/8607393))
- **rcml:** add content schemas for rc-preview, rc-plain-text, and rc-raw ([fcb0e7f](https://github.com/rulecom/rule-io-sdk/commit/fcb0e7f))
- **rcml:** accept attribute-override nodes in rc-attributes without children/content ([e4896f2](https://github.com/rulecom/rule-io-sdk/commit/e4896f2))
- **rcml:** add missing T.Font/T.Class to specs and fix buildBgNode override nodes ([e602e90](https://github.com/rulecom/rule-io-sdk/commit/e602e90))

### ❤️ Thank You

- Claude Sonnet 4.6
- Oleksandr Ryzhyk

## 0.4.0-beta.3 (2026-05-18)

This was a version bump only for rcml to align it with other projects, there were no code changes.

## 0.4.0-beta.2 (2026-05-14)

### 🩹 Fixes

- **deps:** sync package versions with release and fix lock file consistency ([bb0d50f](https://github.com/rulecom/rule-io-sdk/commit/bb0d50f))

### ❤️ Thank You

- Claude Sonnet 4.6
- Oleksandr Ryzhyk

## 0.4.0-beta.1 (2026-05-14)

### 🩹 Fixes

- **deps:** resolve npm audit vulnerabilities ([d2b9d41](https://github.com/rulecom/rule-io-sdk/commit/d2b9d41))

### ❤️ Thank You

- Claude Sonnet 4.6
- Oleksandr Ryzhyk

# Changelog

## 0.4.0-beta.0 (2026-05-14)

### Initial Beta Release

First public beta of `@rule/rcml` — RCML (Rule Campaign Markup Language) builders, validators, and converters.

#### Features

- **Element factories** — typed factory functions for all RCML email elements:
  text, heading, button, image, logo, video, spacer, divider, section, column,
  social, loop, switch, and structural elements (body, head, wrapper, group)
- **Content helpers** — `createTextNode`, `createPlaceholderNode`,
  `createInlineContent`, and other ProseMirror-compatible content constructors
- **RFM builders** — `createCustomField`, `createLoopValue`, `createLink`,
  `createFont` for dynamic merge fields and directives
- **Validation** — `validateEmailTemplate` and `safeValidateEmailTemplate`
  with structured `EmailTemplateValidationError` reporting
- **Format converters** — `rfmToJson`/`jsonToRfm` and `rcmlToXml`/`xmlToRcml`
  for round-trip transforms between RCML, RFM, JSON, and XML
- **Theme API** — `createTheme`, `applyTheme`, `getTheme` for brand-aware
  template styling (colors, fonts, spacing)
- **Full TypeScript types** for all RCML node shapes and attribute maps
