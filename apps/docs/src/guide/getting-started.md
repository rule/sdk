# Getting Started

## Installation

```bash
npm install @rule/sdk
```

`@rule/sdk` is the recommended entry point. It re-exports everything from `@rule/client` and `@rule/rcml` so you only need one install.

## Authentication

Get your API key from [Rule.io Settings → API](https://app.rule.io/v5/#/app/settings/developer). Store it in an environment variable — never commit it to source control.

## Quick Start

```typescript
import { RuleClient } from '@rule/sdk';

const client = new RuleClient({ apiKey: process.env.RULE_API_KEY! });

// Create a subscriber
await client.createSubscriberV3({
  email: 'customer@example.com',
  status: 'ACTIVE',
});

// Add tags to trigger automations
await client.addSubscriberTagsV3('customer@example.com', {
  tags: ['order-confirmed', 'new-customer'],
  automation: 'force',
});
```

## Client Options

```typescript
// Simple — just the API key
const client = new RuleClient('your-api-key');
```

```typescript
// With options
const client = new RuleClient({
  apiKey: process.env.RULE_API_KEY!,
  baseUrlV2: 'https://app.rule.io/api/v2', // default
  baseUrlV3: 'https://app.rule.io/api/v3', // default
  debug: false, // set true to log requests
});
```

Throws `RuleClientError` if the API key is missing, or `RuleApiError` with status 401 if the key is invalid.

## Error Handling

```typescript
import { RuleApiError, RuleClientError } from '@rule/sdk';

try {
  await client.createSubscriberV3({ email: 'user@example.com' });
} catch (error) {
  if (error instanceof RuleApiError) {
    console.error(error.statusCode); // 401, 404, 429, etc.
  }
  if (error instanceof RuleClientError) {
    console.error('Invalid config:', error.message);
  }
}
```

- `RuleApiError` — the Rule.io API returned an HTTP error (4xx / 5xx). Includes `statusCode`, `isAuthError()`, and `isValidationError()`.
- `RuleClientError` — misconfiguration on the client side (e.g. missing API key).

