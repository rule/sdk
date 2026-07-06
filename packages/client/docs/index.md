# @rule/client

`@rule/client` is the HTTP API client for the [Rule.io](https://rule.io) marketing platform. It covers the full Rule.io API surface: subscriber management, audience segmentation, email and SMS campaigns and automations, templates, analytics, and more.

> **Most users should install `@rule/sdk` instead.** It re-exports everything from this package and adds the RCML template builders and high-level helpers on top.

## Installation

```bash
npm install @rule/client
```

## Connecting to Rule.io

```typescript
import { RuleClient } from '@rule/client';

const client = new RuleClient({ apiKey: process.env['RULE_API_KEY']! });
```

You can also pass the API key as a plain string: `new RuleClient(apiKey)`.

*→ [`RuleClient`](/api/client/src/classes/RuleClient)*

## What you can do

| Namespace | What it covers | Guide |
|---|---|---|
| `client.subscribers` | Add, update, find, remove, block, and suppress subscribers | [Managing Subscribers](./managing-subscribers) · [Bulk Create](./bulk-create-subscribers) |
| `client.tags` | Create and manage audience tags | [Tags](./tags) |
| `client.campaigns` | Create, target, and schedule campaigns | [Email Campaigns](./email-campaigns) · [SMS Campaigns](./sms-campaigns) |
| `client.automations` | Trigger-based email and SMS workflows | [Email Automations](./email-automations) · [SMS Automations](./sms-automations) |
| `client.messages` | Per-dispatcher message objects | [Email Messages](./email-messages) · [SMS Messages](./sms-messages) |
| `client.templates` | Email and SMS templates | [Email Templates](./email-templates) · [SMS Templates](./sms-templates) |
| `client.dynamicSets` | Connect messages to templates | [Dynamic Sets](./dynamic-sets) |
| `client.brandStyles` | Brand colors, fonts, and logos | [Brand Styles](./brand-styles) |
| `client.customField` | Custom field group schema | [Custom Field Schema](./custom-fields-schema) |
| `client.apiKeys` | Create and rotate API keys | [API Keys](./api-keys) |
| `client.analytics` | Campaign and automation statistics | [Analytics](./analytics) |
| `client.exports` | Bulk data exports (Enterprise) | [Exports](./exports) |
| `client.recipients` | Recipient lists for targeting | [Recipients](./recipients) |
| `parseWebhookEvent` · `markTagDirection` | Typed event shapes for inbound Rule.io webhooks | [Webhooks](./webhooks) |

## Error handling

Two error classes are exported from this package:

```typescript
import { RuleApiError, RuleClientError } from '@rule/client';
```

- **`RuleApiError`** — the Rule.io API returned a non-2xx response. Provides `.statusCode`, `.isAuthError()`, `.isValidationError()`, and `.validationErrors`.
- **`RuleClientError`** — misconfiguration in your code (missing API key, invalid arguments).

Most `get` and `find` methods return `null` when the resource does not exist, so you rarely need to catch 404 errors explicitly. See [Error Handling](./error-handling) for the full picture.

*→ [`RuleApiError`](/api/client/src/classes/RuleApiError) · [`RuleClientError`](/api/client/src/classes/RuleClientError)*
