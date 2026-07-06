# Webhooks

Rule.io can POST a JSON body to a URL of your choosing whenever certain
events happen in your account — a transaction is sent, a campaign is
opened, a subscriber bounces, an import finishes. The
`@rule/client` package provides typed event shapes plus a parser
(`parseWebhookEvent`) that turns the raw body into a discriminated
union you can `switch` on.

## Webhooks vs the `callbackUrl` option on async methods

Two unrelated mechanisms in the SDK both deliver "Rule.io tells you
something happened":

- **Account-level webhooks** (this page). Configured in the Rule UI
  under Settings → Developer → Webhooks. Fire on platform events like
  campaign-opened or subscriber-suppressed.
- **Per-call `callbackUrl`** on async methods such as
  `bulkAddSubscriberTags` and `block`. Fires when the specific
  background job triggered by that one method call finishes. See
  [Asynchronous Operations](./async-operations).

This page covers the first kind. The two share no payload shape;
nothing here applies to the per-call `callbackUrl` notifications.

## Receiving webhooks

Mount a route that reads the request body and hands it to
`parseWebhookEvent`. The returned `WebhookEvent` is a discriminated
union — narrow with `switch (event.type)`:

```typescript
import { parseWebhookEvent } from '@rule/client';

app.post('/webhooks/rule', (req, res) => {
  const event = parseWebhookEvent(req.body);

  switch (event.type) {
    case 'subscriber.opted-in':
      console.log('New opt-in', event.subscriber.email);
      break;

    case 'subscriber.bounced':
      console.warn('Bounce', event.bounce.type, event.subscriber.email);
      break;

    case 'subscriber.suppressed':
      console.warn('Suppressed', event.suppressedSourceType, event.subscriber.email);
      break;

    case 'import.finished':
      console.log('Import done', event.import.id);
      break;

    // ...handle the events you care about
  }

  res.status(200).end();
});
```

`parseWebhookEvent` accepts either a JSON string or an already-parsed
object. It throws `RuleClientError` on invalid JSON, on a body that
matches none of the documented event shapes, and on preference-event
bodies (currently unsupported — see below).

## Event reference

The SDK derives the synthetic `type` literal on every event by
inspecting which top-level keys are present in the body. Rule.io's
own payloads have no `event_type` field.

### Transactions

#### `transaction.sent`

Fires when a transactional message is sent.

```json
{
  "message": {
    "id": 111111,
    "transaction_id": 111111,
    "subject": "dummy-subject",
    "type": "email",
    "created_at": "1970-01-01 00:00:00"
  },
  "subscriber": {
    "id": 111111,
    "email": "jane@example.com",
    "phone_number": "+46705555555"
  }
}
```

#### `transaction.link-clicked`

Fires when a recipient clicks a tracked link in a transactional message.

```json
{
  "transaction": { "id": 111111, "name": "transaction-name", "message_type": "email" },
  "subscriber": { "id": 111111, "email": "jane@example.com", "phone_number": "+46705555555" },
  "link": "https://www.example.com"
}
```

#### `transaction.opened`

Fires when a recipient opens a transactional message.

```json
{
  "transaction": { "id": 111111, "name": "transaction-name", "message_type": "email" },
  "subscriber": { "id": 111111, "email": "jane@example.com", "phone_number": "+46705555555" }
}
```

### Campaigns

#### `campaign.sent`

Fires when a campaign sendout completes. Includes total recipient counts.

```json
{
  "campaign": {
    "id": 111111,
    "name": "campaign-name",
    "message_type": "email",
    "number_of_recipients": 123,
    "total_sent": 123
  }
}
```

#### `campaign.link-clicked`

```json
{
  "campaign": { "id": 111111, "name": "campaign-name", "message_type": "email" },
  "subscriber": { "id": 111111, "email": "jane@example.com", "phone_number": "+46705555555" },
  "link": "https://www.example.com"
}
```

#### `campaign.opened`

```json
{
  "campaign": { "id": 111111, "name": "campaign-name", "message_type": "email" },
  "subscriber": { "id": 111111, "email": "jane@example.com", "phone_number": "+46705555555" }
}
```

### Subscribers

#### `subscriber.opted-in`

Fires when a subscriber completes the opt-in flow.

```json
{
  "subscriber": { "id": 111111, "email": "jane@example.com", "phone_number": "+46705555555" }
}
```

#### `subscriber.suppressed`

Fires when a subscriber is suppressed for one or more message types.

```json
{
  "dispatcher_type": "campaign",
  "message_type": "email",
  "suppressed_source_type": "user",
  "subscriber": { "id": 111111, "email": "jane@example.com", "phone_number": "+46705555555" },
  "account": { "name": "account-name" }
}
```

`suppressed_source_type` is one of `'user'`, `'admin'`, `'spam'`,
`'api'`. `dispatcher_type` is `'campaign'` or `'transactional'`.
`message_type` is `'email'` or `'text_message'`.

#### `subscriber.added-to-segment`

Fires when a subscriber enters a segment.

```json
{
  "segment": { "id": 111111, "name": "segment-name" },
  "subscriber": {
    "id": 111111,
    "email": "jane@example.com",
    "phone_number": "+46705555555",
    "account": { "id": "account-id", "name": "account-name" }
  }
}
```

Note: this is the only event where `account` is nested inside
`subscriber`.

#### `subscriber.bounced`

Fires when a delivery to the subscriber bounces.

```json
{
  "bounce": {
    "dispatcher_id": 111111,
    "type": "soft",
    "message_type": "email",
    "dispatcher_type": "campaign",
    "bounce_message": "bounce message"
  },
  "subscriber": { "id": 111111, "email": "jane@example.com", "phone_number": "+46705555555" },
  "account": { "name": "account-name" }
}
```

`bounce.type` is `'soft'` or `'hard'`.

#### `subscriber.resubscribed`

Fires when a previously opted-out subscriber re-subscribes.

```json
{
  "subscriber": { "id": 111111, "email": "jane@example.com", "phone_number": "+46705555555" },
  "account": { "name": "account-name" }
}
```

### Imports

#### `import.finished`

Fires when a bulk import completes. The counter values are *strings*
in the wire format (e.g. `"import-total"`) — cast to a number at the
receiver if you need arithmetic.

```json
{
  "import": {
    "id": "import-id",
    "total": "import-total",
    "new": "import-new",
    "updated": "import-updated",
    "failed": "import-failed",
    "partial_failed": "import-partial-failed"
  }
}
```

## Tag-changed events

Rule.io fires a webhook when a subscriber gains a tag and another
when they lose one — but the two webhook bodies are **identical**.
The body alone tells you a tag changed; it does not tell you in which
direction.

`parseWebhookEvent` therefore returns the ambiguous
`subscriber.tag-changed` shape:

```json
{
  "tag": { "id": 111111, "name": "tag-name" },
  "subscriber": { "id": 111111, "email": "jane@example.com", "phone_number": "+46705555555" }
}
```

The recommended pattern is to configure two distinct webhook URLs in
Rule.io — one for "added to tag" and one for "removed from tag" —
and call `markTagDirection` on each route to commit the type:

```typescript
import { parseWebhookEvent, markTagDirection } from '@rule/client';

app.post('/webhooks/rule/tag-added', (req, res) => {
  const parsed = parseWebhookEvent(req.body);

  if (parsed.type !== 'subscriber.tag-changed') {
    return res.status(400).end();
  }

  const event = markTagDirection(parsed, 'added');
  // event.type === 'subscriber.added-to-tag'
  // ...handle add

  res.status(200).end();
});

app.post('/webhooks/rule/tag-removed', (req, res) => {
  const parsed = parseWebhookEvent(req.body);

  if (parsed.type !== 'subscriber.tag-changed') {
    return res.status(400).end();
  }

  const event = markTagDirection(parsed, 'removed');
  // event.type === 'subscriber.removed-from-tag'
  // ...handle remove

  res.status(200).end();
});
```

## Next steps

- [Asynchronous Operations](./async-operations) — the per-call
  `callbackUrl` mechanism, distinct from the account-level webhooks
  on this page.
- [Error Handling](./error-handling) — how `RuleClientError` works.
