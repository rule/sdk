## 0.4.0-beta.8 (2026-06-19)

### 🚀 Features

- rename npm scope from @rulecom to @rule ([4575ff6](https://github.com/rulecom/rule-io-sdk/commit/4575ff6))

### ❤️ Thank You

- Claude
- Oleksandr Ryzhyk

## 0.4.0-beta.7 (2026-06-17)

### 🚀 Features

- **client:** add message/template override params to createDefault campaign methods ([72c3276](https://github.com/rulecom/rule-io-sdk/commit/72c3276))
- **client:** add createDefaultEmailCampaign and createDefaultSmsCampaign orchestration methods ([95b9d2a](https://github.com/rulecom/rule-io-sdk/commit/95b9d2a))
- **client:** typed webhook events + parser + tag-direction helper ([bfc9b86](https://github.com/rulecom/rule-io-sdk/commit/bfc9b86))
- **client:** bulk-create subscribers via Rule.io v2 endpoint ([5159191](https://github.com/rulecom/rule-io-sdk/commit/5159191))
- **rcml:** add SMS RCML module with full architecture parity to email ([4dc9930](https://github.com/rulecom/rule-io-sdk/commit/4dc9930))

### 🩹 Fixes

- **client:** address second-round Copilot review comments ([57d196f](https://github.com/rulecom/rule-io-sdk/commit/57d196f))
- **client:** add missing blank lines to satisfy padding-line-between-statements lint rule ([e47632d](https://github.com/rulecom/rule-io-sdk/commit/e47632d))
- **client:** address Copilot review on createDefault campaign methods ([7d701f8](https://github.com/rulecom/rule-io-sdk/commit/7d701f8))
- **client:** export AccountSenderDetails and CreateDefault* types ([6f399d9](https://github.com/rulecom/rule-io-sdk/commit/6f399d9))
- **client:** resolve CI Docs Quality failures from cross-file @link refs ([#152](https://github.com/rulecom/rule-io-sdk/issues/152))

### ❤️ Thank You

- Claude
- Claude Sonnet 4.6
- Oleksandr Ryzhyk

## 0.4.0-beta.6 (2026-06-05)

### 🚀 Features

- **client:** accept SubscriberIdentifier in getSubscriberTags ([796f33a](https://github.com/rulecom/rule-io-sdk/commit/796f33a))
- **client:** expose AnalyticsMetrics, AnalyticsObjectTypes, AnalyticsMessageTypes constants ([189c6a2](https://github.com/rulecom/rule-io-sdk/commit/189c6a2))
- **client:** refactor custom-field namespace with full paginated list family ([2c6e0db](https://github.com/rulecom/rule-io-sdk/commit/2c6e0db))
- **client:** refactor brand-styles namespace with camelCase types and wire mappers ([f066591](https://github.com/rulecom/rule-io-sdk/commit/f066591))
- **client:** move suppressions into subscribers namespace with focused methods ([c88fba3](https://github.com/rulecom/rule-io-sdk/commit/c88fba3))
- **client:** refactor tags namespace with camelCase types and paginated list family ([5f1c619](https://github.com/rulecom/rule-io-sdk/commit/5f1c619))
- **client:** refactor automations namespace with email-specific methods and paginated list family ([1956152](https://github.com/rulecom/rule-io-sdk/commit/1956152))
- **client:** refactor campaigns namespace with email-specific methods and string literals ([161370a](https://github.com/rulecom/rule-io-sdk/commit/161370a))
- **client:** refactor dynamic-sets namespace with camelCase types and wire corrections ([a3ed01b](https://github.com/rulecom/rule-io-sdk/commit/a3ed01b))
- **client:** refactor templates namespace with email-specific methods and paginated list family ([7013b01](https://github.com/rulecom/rule-io-sdk/commit/7013b01))
- **client:** refactor messages namespace with dispatcher-specific types and OpenAPI wire fixes ([4c160f1](https://github.com/rulecom/rule-io-sdk/commit/4c160f1))
- **client:** add tag automation methods, syncSegments option, and docs ([851a97d](https://github.com/rulecom/rule-io-sdk/commit/851a97d))
- **client:** add getByCustomIdentifier() subscriber lookup method ([e1c6d41](https://github.com/rulecom/rule-io-sdk/commit/e1c6d41))
- **client:** refactor subscriber tag API and add @rule/client docs ([b302c59](https://github.com/rulecom/rule-io-sdk/commit/b302c59))

### 🩹 Fixes

- **client:** update getSubscriberTags test for SubscriberIdentifier argument ([16eb34e](https://github.com/rulecom/rule-io-sdk/commit/16eb34e))
- **client:** fix three TS errors breaking CI build ([659d812](https://github.com/rulecom/rule-io-sdk/commit/659d812))
- **client:** add missing blank line for ESLint padding rule ([33f550b](https://github.com/rulecom/rule-io-sdk/commit/33f550b))
- **client:** issues 8/9/10 — bookzen comment, delete tests, list result type ([83b72e6](https://github.com/rulecom/rule-io-sdk/commit/83b72e6))
- **client:** coerce non-string custom field values in buildCustomFieldDataPayload ([0fae538](https://github.com/rulecom/rule-io-sdk/commit/0fae538))
- **client:** extend _ensureSubscriber fallback to phone and customIdentifier ([448e99e](https://github.com/rulecom/rule-io-sdk/commit/448e99e))
- **client:** map custom_identifier from v2 subscriber wire responses ([15567bb](https://github.com/rulecom/rule-io-sdk/commit/15567bb))
- **client:** fix CI dead links, Vue interpolation, and vendor-bookzen API migration ([d426f7f](https://github.com/rulecom/rule-io-sdk/commit/d426f7f))
- **client:** resolve CI failures in ESLint and TypeDoc checks ([3d967f5](https://github.com/rulecom/rule-io-sdk/commit/3d967f5))

### ❤️ Thank You

- Claude Sonnet 4.6
- Oleksandr Ryzhyk

## 0.4.0-beta.5 (2026-05-29)

### 🩹 Fixes

- **docs:** address Copilot review findings ([b02f989](https://github.com/rulecom/rule-io-sdk/commit/b02f989))

### ❤️ Thank You

- Claude Sonnet 4.6
- Oleksandr Ryzhyk

## 0.4.0-beta.4 (2026-05-20)

This was a version bump only for client to align it with other projects, there were no code changes.

## 0.4.0-beta.3 (2026-05-18)

### 🚀 Features

- **client:** opt-in rate limiting in HttpTransport ([954aca8](https://github.com/rulecom/rule-io-sdk/commit/954aca8))

### 🩹 Fixes

- **client:** clamp Retry-After delay to maxRetryAfterMs after jitter ([3591e34](https://github.com/rulecom/rule-io-sdk/commit/3591e34))
- **client:** reject NaN/Infinity in toNumericSendout; clarify UpdateRequest JSDoc ([72f4725](https://github.com/rulecom/rule-io-sdk/commit/72f4725))
- **client:** require all 5 fields for campaigns update fast path ([ab48d02](https://github.com/rulecom/rule-io-sdk/commit/ab48d02))
- **client:** repair campaigns update fast-path body completeness ([#140](https://github.com/rulecom/rule-io-sdk/issues/140))
- **client:** type campaigns toNumericSendout as RuleSendoutType ([#140](https://github.com/rulecom/rule-io-sdk/issues/140))
- **client:** updateCampaign partial updates via read-modify-write ([#129](https://github.com/rulecom/rule-io-sdk/issues/129), [#116](https://github.com/rulecom/rule-io-sdk/issues/116))
- **client:** log parsed retry-after seconds and fix tz doc ([49cbb12](https://github.com/rulecom/rule-io-sdk/commit/49cbb12))

### ❤️ Thank You

- Claude
- Claude Opus 4.7
- Claude Sonnet 4.6
- Oleksandr Ryzhyk
- swesam

## 0.4.0-beta.2 (2026-05-14)

### 🚀 Features

- **client:** expose v3 rate-limit headers on RuleApiError ([#136](https://github.com/rulecom/rule-io-sdk/pull/136))

### 🩹 Fixes

- **client:** parse Rule.io v3's actual Retry-After format on 429s ([#136](https://github.com/rulecom/rule-io-sdk/issues/136))
- **deps:** sync package versions with release and fix lock file consistency ([bb0d50f](https://github.com/rulecom/rule-io-sdk/commit/bb0d50f))

### ❤️ Thank You

- Claude
- Claude Opus 4.7
- Claude Sonnet 4.6
- Oleksandr Ryzhyk
- swesam

## 0.4.0-beta.1 (2026-05-14)

This was a version bump only for client to align it with other projects, there were no code changes.

# Changelog

## 0.4.0-beta.0 (2026-05-14)

### Initial Beta Release

First public beta of `@rule/client` — a TypeScript HTTP client for the Rule.io email marketing API.

#### Features

- **`RuleClient`** — typed HTTP client covering the Rule.io v2/v3 API:
  - Subscriber management (create, update, delete, tag, block/unblock, bulk import)
  - Campaign and automation management
  - Template and message management
  - Brand style discovery and creation
  - Custom fields management
  - Analytics queries
  - Enterprise exports (dispatchers, statistics)
- **Error types** — `RuleApiError` and `RuleClientError` for typed error handling
- **Helpers** — `findTemplateOwner`, `brandStyleToTheme`, `formatDateForRule`
- **Full TypeScript types** for all API request/response shapes
