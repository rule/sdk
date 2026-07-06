## 0.4.0-beta.8 (2026-06-19)

### 🚀 Features

- rename npm scope from @rulecom to @rule ([4575ff6](https://github.com/rulecom/rule-io-sdk/commit/4575ff6))
- rename npm scope from @rulecom to @rule ([#155](https://github.com/rulecom/rule-io-sdk/pull/155))

### 🩹 Fixes

- **template-engine:** correct stale @rule/core reference in README ([fd21d70](https://github.com/rulecom/rule-io-sdk/commit/fd21d70))

### ❤️ Thank You

- Claude
- Oleksandr Ryzhyk @webmarket7

## 0.4.0-beta.7 (2026-06-17)

### 🚀 Features

- SMS RCML module, SMS client docs, bulk-create subscribers, webhook events ([#152](https://github.com/rulecom/rule-io-sdk/pull/152))
- createDefaultEmailCampaign and createDefaultSmsCampaign with docs ([#154](https://github.com/rulecom/rule-io-sdk/pull/154))
- **client:** bulk-create subscribers via Rule.io v2 endpoint ([5159191](https://github.com/rulecom/rule-io-sdk/commit/5159191))
- **client:** typed webhook events + parser + tag-direction helper ([bfc9b86](https://github.com/rulecom/rule-io-sdk/commit/bfc9b86))
- **client:** add createDefaultEmailCampaign and createDefaultSmsCampaign orchestration methods ([95b9d2a](https://github.com/rulecom/rule-io-sdk/commit/95b9d2a))
- **client:** add message/template override params to createDefault campaign methods ([72c3276](https://github.com/rulecom/rule-io-sdk/commit/72c3276))
- **rcml:** apply font-style rc-class defaults to body elements in applyTheme ([8e0dae6](https://github.com/rulecom/rule-io-sdk/commit/8e0dae6))
- **rcml:** add column-width validator for rc-column elements ([5ffb4d2](https://github.com/rulecom/rule-io-sdk/commit/5ffb4d2))
- **rcml:** add SMS RCML module with full architecture parity to email ([4dc9930](https://github.com/rulecom/rule-io-sdk/commit/4dc9930))
- **rcml:** add sms namespace builders for SmsContentJson + email namespace mirror ([d380ca2](https://github.com/rulecom/rule-io-sdk/commit/d380ca2))

### 🩹 Fixes

- use npm run instead of pnpm in republish:local script ([0c20581](https://github.com/rulecom/rule-io-sdk/commit/0c20581))
- **client:** resolve CI Docs Quality failures from cross-file @link refs ([#152](https://github.com/rulecom/rule-io-sdk/issues/152))
- **client:** export AccountSenderDetails and CreateDefault* types ([6f399d9](https://github.com/rulecom/rule-io-sdk/commit/6f399d9))
- **client:** address Copilot review on createDefault campaign methods ([7d701f8](https://github.com/rulecom/rule-io-sdk/commit/7d701f8))
- **client:** add missing blank lines to satisfy padding-line-between-statements lint rule ([e47632d](https://github.com/rulecom/rule-io-sdk/commit/e47632d))
- **client:** address second-round Copilot review comments ([57d196f](https://github.com/rulecom/rule-io-sdk/commit/57d196f))
- **rcml:** fix lint errors — blank lines and wire validateColumnWidths into safeValidateEmailTemplate ([72fb5c0](https://github.com/rulecom/rule-io-sdk/commit/72fb5c0))
- **rcml:** address Copilot review findings ([29403a2](https://github.com/rulecom/rule-io-sdk/commit/29403a2))
- **rcml:** replace Array.findLast with compatible last-element lookup ([909a75c](https://github.com/rulecom/rule-io-sdk/commit/909a75c))
- **rcml:** address second round of Copilot review findings ([625f378](https://github.com/rulecom/rule-io-sdk/commit/625f378))
- **rcml:** fix lint errors introduced in 625f378 ([fa5d03e](https://github.com/rulecom/rule-io-sdk/commit/fa5d03e))
- **rcml:** apply theme font-style classes to body elements + local dev improvements ([#151](https://github.com/rulecom/rule-io-sdk/pull/151))
- **rcml:** tighten CreateSmsContentOptions.paragraphs to a non-empty tuple ([5ba029a](https://github.com/rulecom/rule-io-sdk/commit/5ba029a))
- **rcml:** reject element children in rc-sms during XML parse ([1c64f63](https://github.com/rulecom/rule-io-sdk/commit/1c64f63))

### ❤️ Thank You

- Claude
- Claude Sonnet 4.6
- Oleksandr Ryzhyk @webmarket7

## 0.4.0-beta.6 (2026-06-05)

### 🚀 Features

- **client:** refactor subscriber tag API and add @rule/client docs ([b302c59](https://github.com/rulecom/rule-io-sdk/commit/b302c59))
- **client:** add getByCustomIdentifier() subscriber lookup method ([e1c6d41](https://github.com/rulecom/rule-io-sdk/commit/e1c6d41))
- **client:** add tag automation methods, syncSegments option, and docs ([851a97d](https://github.com/rulecom/rule-io-sdk/commit/851a97d))
- **client:** refactor messages namespace with dispatcher-specific types and OpenAPI wire fixes ([4c160f1](https://github.com/rulecom/rule-io-sdk/commit/4c160f1))
- **client:** refactor templates namespace with email-specific methods and paginated list family ([7013b01](https://github.com/rulecom/rule-io-sdk/commit/7013b01))
- **client:** refactor dynamic-sets namespace with camelCase types and wire corrections ([a3ed01b](https://github.com/rulecom/rule-io-sdk/commit/a3ed01b))
- **client:** refactor campaigns namespace with email-specific methods and string literals ([161370a](https://github.com/rulecom/rule-io-sdk/commit/161370a))
- **client:** refactor automations namespace with email-specific methods and paginated list family ([1956152](https://github.com/rulecom/rule-io-sdk/commit/1956152))
- **client:** refactor tags namespace with camelCase types and paginated list family ([5f1c619](https://github.com/rulecom/rule-io-sdk/commit/5f1c619))
- **client:** move suppressions into subscribers namespace with focused methods ([c88fba3](https://github.com/rulecom/rule-io-sdk/commit/c88fba3))
- **client:** refactor brand-styles namespace with camelCase types and wire mappers ([f066591](https://github.com/rulecom/rule-io-sdk/commit/f066591))
- **client:** refactor custom-field namespace with full paginated list family ([2c6e0db](https://github.com/rulecom/rule-io-sdk/commit/2c6e0db))
- **client:** expose AnalyticsMetrics, AnalyticsObjectTypes, AnalyticsMessageTypes constants ([189c6a2](https://github.com/rulecom/rule-io-sdk/commit/189c6a2))
- **client:** accept SubscriberIdentifier in getSubscriberTags ([796f33a](https://github.com/rulecom/rule-io-sdk/commit/796f33a))
- **client:** refactor subscriber tag API and add @rule/client docs ([#149](https://github.com/rulecom/rule-io-sdk/pull/149))

### 🩹 Fixes

- **client:** resolve CI failures in ESLint and TypeDoc checks ([3d967f5](https://github.com/rulecom/rule-io-sdk/commit/3d967f5))
- **client:** fix CI dead links, Vue interpolation, and vendor-bookzen API migration ([d426f7f](https://github.com/rulecom/rule-io-sdk/commit/d426f7f))
- **client:** map custom_identifier from v2 subscriber wire responses ([15567bb](https://github.com/rulecom/rule-io-sdk/commit/15567bb))
- **client:** extend _ensureSubscriber fallback to phone and customIdentifier ([448e99e](https://github.com/rulecom/rule-io-sdk/commit/448e99e))
- **client:** coerce non-string custom field values in buildCustomFieldDataPayload ([0fae538](https://github.com/rulecom/rule-io-sdk/commit/0fae538))
- **client:** issues 8/9/10 — bookzen comment, delete tests, list result type ([83b72e6](https://github.com/rulecom/rule-io-sdk/commit/83b72e6))
- **client:** add missing blank line for ESLint padding rule ([33f550b](https://github.com/rulecom/rule-io-sdk/commit/33f550b))
- **client:** fix three TS errors breaking CI build ([659d812](https://github.com/rulecom/rule-io-sdk/commit/659d812))
- **client:** update getSubscriberTags test for SubscriberIdentifier argument ([16eb34e](https://github.com/rulecom/rule-io-sdk/commit/16eb34e))

### ❤️ Thank You

- Claude Sonnet 4.6
- Oleksandr Ryzhyk @webmarket7

## 0.4.0-beta.5 (2026-05-29)

### 🚀 Features

- **docs:** add VitePress docs app skeleton (Phase 1) ([b7d4405](https://github.com/rulecom/rule-io-sdk/commit/b7d4405))
- **docs:** add VitePress documentation site (Phases 1–8) ([#147](https://github.com/rulecom/rule-io-sdk/pull/147))
- **rcml:** export machine-readable rcmlSpec as public API ([101797d](https://github.com/rulecom/rule-io-sdk/commit/101797d))
- **rcml:** expose machine-readable rfmSpec public API ([c82c917](https://github.com/rulecom/rule-io-sdk/commit/c82c917))
- **rcml:** expose machine-readable placeholderSpec public API ([73b0ac6](https://github.com/rulecom/rule-io-sdk/commit/73b0ac6))
- **rcml:** machine-readable rcmlSpec, rfmSpec, and placeholderSpec public APIs ([#146](https://github.com/rulecom/rule-io-sdk/pull/146))

### 🩹 Fixes

- **docs:** address Copilot review findings ([b02f989](https://github.com/rulecom/rule-io-sdk/commit/b02f989))
- **docs:** fix 9 dead links breaking VitePress build ([3939cf9](https://github.com/rulecom/rule-io-sdk/commit/3939cf9))
- **docs:** address Copilot review comments on PR #148 ([#148](https://github.com/rulecom/rule-io-sdk/issues/148))
- **rcml:** address Copilot review comments on public specs ([5641c11](https://github.com/rulecom/rule-io-sdk/commit/5641c11))

### ❤️ Thank You

- Claude Sonnet 4.6
- Oleksandr Ryzhyk @webmarket7

## 0.4.0-beta.4 (2026-05-20)

### 🩹 Fixes

- **rcml:** add missing T.Font/T.Class to specs and fix buildBgNode override nodes ([e602e90](https://github.com/rulecom/rule-io-sdk/commit/e602e90))
- **rcml:** accept attribute-override nodes in rc-attributes without children/content ([e4896f2](https://github.com/rulecom/rule-io-sdk/commit/e4896f2))
- **rcml:** add content schemas for rc-preview, rc-plain-text, and rc-raw ([fcb0e7f](https://github.com/rulecom/rule-io-sdk/commit/fcb0e7f))
- **rcml:** drop spurious children/content from attribute-default bg nodes ([8607393](https://github.com/rulecom/rule-io-sdk/commit/8607393))
- **rcml:** allow sparse font marks in ProseMirror content JSON schema ([c417af9](https://github.com/rulecom/rule-io-sdk/commit/c417af9))
- **rcml:** propagate logo src to rc-logo body nodes in applyTheme ([68f1d99](https://github.com/rulecom/rule-io-sdk/commit/68f1d99))
- **rcml:** fix lint errors in json-schema.ts ([c3530c3](https://github.com/rulecom/rule-io-sdk/commit/c3530c3))
- **rcml:** enforce minProperties:1 on font-mark attrs in JSON schema ([3367d58](https://github.com/rulecom/rule-io-sdk/commit/3367d58))
- **rcml:** scope attr-override relaxation and align RcmlAttributesChild types ([d0727d1](https://github.com/rulecom/rule-io-sdk/commit/d0727d1))
- **rcml:** add missing T.Font/T.Class to specs and fix buildBgNode override nodes ([#143](https://github.com/rulecom/rule-io-sdk/pull/143))
- **rcml:** fix validation for editor-emitted documents and logo src propagation ([#144](https://github.com/rulecom/rule-io-sdk/pull/144))

### ❤️ Thank You

- Claude Sonnet 4.6
- Oleksandr Ryzhyk @webmarket7

## 0.4.0-beta.3 (2026-05-18)

### 🚀 Features

- **client:** opt-in rate limiting in HttpTransport ([954aca8](https://github.com/rulecom/rule-io-sdk/commit/954aca8))
- **client:** opt-in rate limiting in HttpTransport ([#141](https://github.com/rulecom/rule-io-sdk/pull/141))
- **client:** opt-in rate limiting, campaign partial-update fixes, and utility refactors ([#142](https://github.com/rulecom/rule-io-sdk/pull/142))

### 🩹 Fixes

- **client:** log parsed retry-after seconds and fix tz doc ([49cbb12](https://github.com/rulecom/rule-io-sdk/commit/49cbb12))
- **client:** updateCampaign partial updates via read-modify-write ([#129](https://github.com/rulecom/rule-io-sdk/issues/129), [#116](https://github.com/rulecom/rule-io-sdk/issues/116))
- **client:** type campaigns toNumericSendout as RuleSendoutType ([#140](https://github.com/rulecom/rule-io-sdk/issues/140))
- **client:** repair campaigns update fast-path body completeness ([#140](https://github.com/rulecom/rule-io-sdk/issues/140))
- **client:** require all 5 fields for campaigns update fast path ([ab48d02](https://github.com/rulecom/rule-io-sdk/commit/ab48d02))
- **client:** reject NaN/Infinity in toNumericSendout; clarify UpdateRequest JSDoc ([72f4725](https://github.com/rulecom/rule-io-sdk/commit/72f4725))
- **client:** updateCampaign partial updates via read-modify-write ([#140](https://github.com/rulecom/rule-io-sdk/pull/140))
- **client:** clamp Retry-After delay to maxRetryAfterMs after jitter ([3591e34](https://github.com/rulecom/rule-io-sdk/commit/3591e34))

### ❤️ Thank You

- Claude
- Claude Opus 4.7
- Claude Sonnet 4.6
- Oleksandr Ryzhyk @webmarket7
- Sam
- swesam

## 0.4.0-beta.2 (2026-05-14)

### 🚀 Features

- **client:** expose v3 rate-limit headers on RuleApiError ([#136](https://github.com/rulecom/rule-io-sdk/pull/136))
- **client:** expose v3 rate-limit headers on RuleApiError ([#136](https://github.com/rulecom/rule-io-sdk/pull/136), [#137](https://github.com/rulecom/rule-io-sdk/pull/137))

### 🩹 Fixes

- **ci:** use commit SHA instead of tag ref for publish job checkout ([61b2a57](https://github.com/rulecom/rule-io-sdk/commit/61b2a57))
- **ci:** push release tag explicitly instead of --follow-tags ([b61a759](https://github.com/rulecom/rule-io-sdk/commit/b61a759))
- **ci:** fix tag push and publish job checkout ([#135](https://github.com/rulecom/rule-io-sdk/pull/135))
- **ci,deps:** atomic tag+branch push and mark vendor packages private ([28044ee](https://github.com/rulecom/rule-io-sdk/commit/28044ee))
- **client:** parse Rule.io v3's actual Retry-After format on 429s ([#136](https://github.com/rulecom/rule-io-sdk/issues/136))
- **client:** parse Rule.io v3's actual Retry-After format on 429s (#136 follow-up) ([#138](https://github.com/rulecom/rule-io-sdk/pull/138), [#136](https://github.com/rulecom/rule-io-sdk/issues/136))
- **deps:** sync package versions with release and fix lock file consistency ([bb0d50f](https://github.com/rulecom/rule-io-sdk/commit/bb0d50f))

### ❤️ Thank You

- Claude
- Claude Opus 4.7
- Claude Sonnet 4.6
- Oleksandr Ryzhyk @webmarket7
- swesam

## 0.4.0-beta.1 (2026-05-14)

### 🩹 Fixes

- **ci:** replace workflow_run with push trigger for release workflow ([eb441f1](https://github.com/rulecom/rule-io-sdk/commit/eb441f1))
- **ci:** replace workflow_run with push trigger for release workflow ([#133](https://github.com/rulecom/rule-io-sdk/pull/133))
- **ci:** fix release workflow and clean up nx release config ([7e3b399](https://github.com/rulecom/rule-io-sdk/commit/7e3b399))
- **ci:** pin publish job checkout to release tag ([10ae1bf](https://github.com/rulecom/rule-io-sdk/commit/10ae1bf))
- **ci:** fix release workflow for first npm publish ([#134](https://github.com/rulecom/rule-io-sdk/pull/134))
- **ci,docs:** add concurrency guard to release workflow and tighten README sync command ([ec85a47](https://github.com/rulecom/rule-io-sdk/commit/ec85a47))
- **deps:** resolve npm audit vulnerabilities ([d2b9d41](https://github.com/rulecom/rule-io-sdk/commit/d2b9d41))

### ❤️ Thank You

- Claude Sonnet 4.6
- Oleksandr Ryzhyk @webmarket7

# Changelog

## 0.4.0-beta.0 (2026-05-14)

### Initial Beta Release

First public beta of the Rule.io TypeScript SDK.

Published packages: `@rule/client`, `@rule/rcml`, `@rule/sdk`.
