# Content

The `content` field of an `SmsDocument` is a flat sequence of three node
types. See [`SmsContentJson`](../content/nodes/sms) for the type reference.

## Message

Static text. Line breaks are `\n` characters embedded directly in the `text`
field. See [`message`](../content/nodes/message) for the full reference.

**XML**

Plain text between other directives compiles to `message` nodes:

```
Your order has shipped!
Account: 
```

**JSON**

```json
{ "type": "message", "text": "Your order has shipped!\nAccount: " }
```

**Programmatic**

```typescript
sms.createMessageNode({ text: 'Your order has shipped!\nAccount: ' })
```

## Link

A clickable URL. The URL is used as both the destination and the visible text
in the sent message. The `track` and `shorten` flags control click tracking and
URL shortening — with one constraint: **`track: true` requires `shorten: true`**.
A tracked link must be shortened. To disable both, set both to `false`.
See [`link`](../content/nodes/link) for the full reference.

**XML**

Use the `:link[…]{…}` span directive. The URL goes in the brackets; `track`
and `shorten` are `"true"` or `"false"`:

```
:link[https://example.com/orders/123]{track="true" shorten="true"}
```

Tracked and shortened disabled:

```
:link[https://example.com/orders/123]{track="false" shorten="false"}
```

**JSON**

```json
{
  "type": "link",
  "text": "https://example.com/orders/123",
  "attrs": { "track": true, "shorten": true }
}
```

**Programmatic**

```typescript
sms.createLinkNode({ url: 'https://example.com/orders/123', track: true, shorten: true })
```

## Placeholder

A dynamic value the Rule platform substitutes at send time — a subscriber
field, custom field, date, remote content, or system-managed link URL.

The full list of supported placeholder types and their token syntax lives on
the [**`placeholder` node reference**](../content/nodes/placeholder). The
examples below show the most common type (`Subscriber`); consult that page for
`CustomField`, `User`, `Date`, `RemoteContent`, and `Link` tokens.

**XML**

Use the `::placeholder{…}` directive with `type`, `original`, and `name`:

```
::placeholder{type="Subscriber" original="[Subscriber:email]" name="Email"}
```

**JSON**

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "Subscriber",
    "original": "[Subscriber:email]",
    "name": "Email",
    "value": "email"
  }
}
```

**Programmatic**

Each placeholder category has a typed convenience builder:

```typescript
sms.createSubscriberPlaceholder({ field: 'email' })
sms.createCustomFieldPlaceholder({ group: 'Order', name: 'Total' })
sms.createDatePlaceholder({ source: 'tomorrow', format: 'Y-m-d' })
```

For the `Link` type (unsubscribe footer), use `sms.createUnsubscribeNodes()` — see
[Unsubscription](./unsubscription). For types not covered by a convenience builder, use
the generic builder:

```typescript
sms.createPlaceholderNode({ type: 'Date', original: '[Date:tomorrow::d.m.Y]', name: 'tomorrow' })
```

## Related

- [`message`](../content/nodes/message) — message node reference
- [`link`](../content/nodes/link) — link node reference
- [`placeholder`](../content/nodes/placeholder) — placeholder node reference and all token types
- [Unsubscription](./unsubscription) — required unsubscribe footer
- [Building programmatically](../building-programmatically) — full builder API
