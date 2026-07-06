# Error Handling

The client uses two error classes and a consistent `null`-for-404 pattern. Understanding these three things covers nearly every error scenario you'll encounter.

## The two error classes

```typescript
import { RuleApiError, RuleClientError } from '@rule/client';
```

### `RuleApiError`

Thrown when the Rule.io API returns a non-2xx HTTP response. This is the most common error in production code.

```typescript
try {
  await client.campaigns.schedule(campaignId, { type: 'now' });
} catch (err) {
  if (err instanceof RuleApiError) {
    console.error('API error', err.statusCode, err.message);
  }
}
```

Useful properties and methods:

| Property / method | Description |
|---|---|
| `err.statusCode` | HTTP status code (e.g. `401`, `422`) |
| `err.isAuthError()` | `true` when `statusCode === 401` |
| `err.isValidationError()` | `true` when `statusCode === 400` or `422` |
| `err.validationErrors` | Array of field-level validation errors (when `isValidationError()` is `true`) |

*→ [`RuleApiError`](/api/client/src/classes/RuleApiError)*

### `RuleClientError`

Thrown before a request is made, when the SDK detects a configuration problem — for example, an empty `fieldGroupPrefix` or missing required arguments. These indicate a bug in your code, not an API failure.

```typescript
try {
  await client.subscribers.sync({ email: 'jane@example.com', fields: { Name: 'Jane' } }, '');
} catch (err) {
  if (err instanceof RuleClientError) {
    console.error('Configuration error:', err.message);
  }
}
```

*→ [`RuleClientError`](/api/client/src/classes/RuleClientError)*

## 404 → `null`

All `get` and `find` methods return `null` when the resource doesn't exist. You don't need to catch a 404 error:

```typescript
const subscriber = await client.subscribers.getByEmail('unknown@example.com');
if (subscriber === null) {
  // subscriber not found
}
```

This applies consistently to `getById()`, `getByName()`, `get()`, and similar lookup methods across all namespaces. Any non-404 error (including auth failures) is still thrown as `RuleApiError`.

## Handling authentication errors

An invalid or missing API key causes an authentication error:

```typescript
try {
  await client.tags.list();
} catch (err) {
  if (err instanceof RuleApiError && err.isAuthError()) {
    console.error('Check your RULE_API_KEY environment variable');
  }
}
```

## Handling validation errors

When Rule.io rejects your input due to a validation error, the `validationErrors` array contains field-level details:

```typescript
try {
  await client.apiKeys.create({ name: '' });
} catch (err) {
  if (err instanceof RuleApiError && err.isValidationError()) {
    for (const ve of err.validationErrors ?? []) {
      console.error(`${ve.field}: ${ve.message}`);
    }
  }
}
```

*→ [`RuleValidationErrors`](/api/client/src/type-aliases/RuleValidationErrors)*

## Handling errors from async operations

Bulk operations (suppressions, block/unblock, bulk tag changes) return immediately and process in the background. API errors from these calls indicate a problem with the request itself (e.g. malformed input), not a processing failure. Processing failures are reported via the `callbackUrl` webhook if you provided one.
