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
in the sent message. See [`link`](../content/nodes/link) for the full reference.

**XML**

Use the `:link[…]{…}` span directive. The URL goes in the brackets; `track`
and `shorten` are `"true"` or `"false"`:

```
:link[https://example.com/orders/123]{track="true" shorten="true"}
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
field, custom field, date, remote content, or system-managed link URL. See
[`placeholder`](../content/nodes/placeholder) for all token types and their
attributes.

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
sms.createLinkPlaceholder({ link: 'Unsubscribe' })
```

For types not covered by a convenience builder, use the generic builder:

```typescript
sms.createPlaceholderNode({ type: 'Date', original: '[Date:tomorrow::d.m.Y]', name: 'tomorrow' })
```

## Related

- [`message`](../content/nodes/message) — message node reference
- [`link`](../content/nodes/link) — link node reference
- [`placeholder`](../content/nodes/placeholder) — placeholder node reference and all token types
- [Unsubscription](./unsubscription) — required unsubscribe footer
- [Building programmatically](../building-programmatically) — full builder API
