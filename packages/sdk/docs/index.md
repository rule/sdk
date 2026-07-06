# @rule/sdk

`@rule/sdk` is the meta-package umbrella for the Rule.io SDK. Install this one package to get the full API client and all RCML template builders.

```bash
npm install @rule/sdk
```

## What's included

| Export | Source | Purpose |
|---|---|---|
| `RuleClient`, `RuleApiError`, `RuleClientError` | `@rule/client` | HTTP API client and error types |
| `createRCMLDocument`, `createBrandTemplate`, … | `@rule/rcml` | RCML element and brand-style builders |
## Where to go next

- **[@rule/client →](/packages/client/)** — HTTP API client: subscribers, campaigns, automations, brand styles, and all other endpoints
- **[@rule/rcml →](/packages/rcml/)** — RCML template builders: compose email templates at any level of abstraction
