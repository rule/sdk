# Bulk Create Subscribers

Create up to 1000 subscribers in a single request via Rule.io's v2
`POST /subscribers` "create multiple" endpoint. Use this when initially
loading subscribers from another system, importing a CSV, or otherwise
adding many addresses at once. For one-off creates, use the single
[`create()`](./managing-subscribers#creating-a-subscriber) method instead.

The endpoint processes large batches **asynchronously** server-side. The
synchronous response is an acknowledgement plus optional counters; it does
not return the created subscriber entities.

## Quick start

```typescript
const result = await client.subscribers.bulkCreateSubscribers({
  subscribers: [
    { email: 'jane@example.com' },
    { email: 'john@example.com', phoneNumber: '+46701234567' },
  ],
});

console.log(result.success);             // true
console.log(result.subscribersCreated);  // when reported by the API
```

Each entry needs at minimum `email` or `phoneNumber`. Both may be supplied
on the same entry — Rule.io matches against either when
`updateOnDuplicate` is set.

*→ [`BulkCreateSubscribersPayload`](/api/client/src/interfaces/BulkCreateSubscribersPayload) ·
[`BulkCreateSubscribersResult`](/api/client/src/interfaces/BulkCreateSubscribersResult)*

## Tagging the whole batch

The `tags` field applies to every subscriber in the batch. Numeric IDs and
string names may be mixed:

```typescript
await client.subscribers.bulkCreateSubscribers({
  subscribers: [
    { email: 'a@example.com' },
    { email: 'b@example.com' },
  ],
  tags: ['newsletter', 'launch-2026', 42],
});
```

Tags consisting only of digits are interpreted as IDs. Use string names
for new tags you want auto-created. To find existing tag IDs, see
[Tags](./tags).

## Updating existing subscribers

By default the endpoint returns `409 Conflict` if any entry already
exists. Set `updateOnDuplicate: true` to upsert instead — existing
subscribers are matched by email or phone and their fields are updated:

```typescript
await client.subscribers.bulkCreateSubscribers({
  subscribers: [
    { email: 'jane@example.com', fields: [{ key: 'Profile.Status', value: 'returning' }] },
  ],
  updateOnDuplicate: true,
});
```

## Per-subscriber custom fields

Each entry can carry an array of `{ key, value, type }` objects. The
`key` follows `Group.Field` notation; the `value` shape depends on
`type`:

| `type` | `value` shape | Example |
|--------|---------------|---------|
| `'text'` (default) | string | `'Jane'` |
| `'date'` | `'YYYY-MM-DD'` string | `'2026-03-20'` |
| `'datetime'` | `'YYYY-MM-DD HH:MM:SS'` string | `'2026-03-20 12:00:00'` |
| `'time'` | `'HH:MM:SS'` string | `'09:30:00'` |
| `'multiple'` | string array | `['Item1', 'Item2']` |
| `'json'` | JSON-encoded string | `'{"k":"v"}'` |

```typescript
await client.subscribers.bulkCreateSubscribers({
  subscribers: [
    {
      email: 'jane@example.com',
      phoneNumber: '+46123456789',
      fields: [
        { key: 'Group.FirstName', value: 'Jane',                       type: 'text' },
        { key: 'Group.Items',     value: ['Item1', 'Item2'],            type: 'multiple' },
        { key: 'Group.Created',   value: '2026-03-20 12:00:00',         type: 'datetime' },
      ],
    },
  ],
});
```

A custom-field group's combined value data must be under 65 KiB. For the
broader custom-field model — group definitions, allowed types, schema
validation — see [Custom Field Schema](./custom-fields-schema).

## Per-subscriber language

Top-level `language` sets the default for the batch. An entry can override
it with its own `language`:

```typescript
await client.subscribers.bulkCreateSubscribers({
  language: 'en',  // batch default
  subscribers: [
    { email: 'a@example.com' },              // language: 'en'
    { email: 'b@example.com', language: 'sv' }, // overrides to 'sv'
  ],
});
```

## Automations and async behaviour

Rule.io applies two safeguards to large batches:

- If the batch has **fewer than 20 entries**, automations attached to the
  applied tags fire normally.
- If the batch has 20 or more entries, automations are skipped by default.
  Pass `syncSubscribers: true` to force them (capped at 100 entries
  server-side); pass `false` to disable them entirely.

```typescript
// Force automations for every entry — capped at 100 by the API
await client.subscribers.bulkCreateSubscribers({
  subscribers: largeList,
  tags: ['welcome'],
  syncSubscribers: true,
});

// Suppress automations entirely
await client.subscribers.bulkCreateSubscribers({
  subscribers: largeList,
  tags: ['imported'],
  syncSubscribers: false,
});
```

The `automation` flag is a separate control, applied to subscribers
matched by `updateOnDuplicate`. See the Rule.io API documentation for
exact `'reset'` vs `'force'` semantics:

```typescript
await client.subscribers.bulkCreateSubscribers({
  subscribers: returningList,
  updateOnDuplicate: true,
  automation: 'reset',
});
```

## Errors

| Status | Meaning |
|--------|---------|
| `400 Bad Request` | A field has an invalid shape (reserved characters in `key`, mismatched `value`/`type`, etc.). The error envelope's `fields` map points at the offending entry. |
| `409 Conflict` | An entry's email or phone matches an existing subscriber and `updateOnDuplicate` is not set. |
| `404 Not Found` | A numeric tag ID in `tags` does not exist. |
| `413 Payload Too Large` | More than 1000 subscribers were submitted. Split the batch and retry. |

Errors throw `RuleApiError`. See [Error Handling](./error-handling) for
the full pattern.

## Limits

- **1000 subscribers per call.** Larger batches return 413.
- **65 KiB per custom-field group** for combined field-value data.
- **Automation cap of 100** when `syncSubscribers: true`.
- **Phone numbers** should include country code (e.g. `+46…`). Numbers
  without a country code are parsed as Swedish.

## Next steps

- Single-subscriber writes: [Managing Subscribers](./managing-subscribers)
- One-shot upsert with field/tag side effects: [Syncing Subscribers](./syncing-subscribers)
- Tag management: [Tags](./tags)
- Receiving completion callbacks for async work: [Asynchronous Operations](./async-operations)
