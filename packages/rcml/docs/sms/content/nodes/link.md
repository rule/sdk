# `link`

A top-level node that inserts a hyperlink into the message. The `text` field
holds the destination URL; the `attrs` object controls click-tracking and
URL-shortening behaviour.

## Attributes

| Attribute | Required | Type | Description |
|-----------|----------|------|-------------|
| `track` | Yes | boolean | `true` to enable click-through tracking. |
| `shorten` | Yes | boolean | `true` to shorten the URL before sending. |

**Constraint:** `track: true` requires `shorten: true`. A tracked link must also be shortened — this mirrors the editor's behaviour, where enabling tracking automatically enables shortening. To send a link without either, set both to `false`.

## Fields

| Field | Required | Description |
|-------|----------|-------------|
| `text` | Yes | Destination URL. The Rule platform renders this as a clickable link. |

## Children

None (leaf node).

## Parent nodes

- [`sms`](./sms)

## Available in

- SMS RFM (`rc-sms`) — via the `:link[…]{…}` directive

## JSON

A link to an external URL:

```json
{
  "type": "link",
  "text": "https://example.com/orders/123",
  "attrs": {
    "track": true,
    "shorten": true
  }
}
```

A link with tracking and shortening disabled:

```json
{
  "type": "link",
  "text": "https://example.com",
  "attrs": {
    "track": false,
    "shorten": false
  }
}
```

## Programmatic

```typescript
sms.createLinkNode({ url: 'https://example.com/orders/123', track: true, shorten: true })
// → { type: 'link', text: 'https://example.com/orders/123', attrs: { track: true, shorten: true } }

sms.createLinkNode({ url: 'https://example.com', track: false, shorten: false })
// → { type: 'link', text: 'https://example.com', attrs: { track: false, shorten: false } }
```

## SMS RFM syntax

Use the `:link[…]{…}` span directive. The URL goes in the brackets; `track`
and `shorten` control click tracking and URL shortening:

```
Click :link[https://example.com/track]{track="true" shorten="true"} to track your order.
```

Compiles to:

```json
{
  "type": "sms",
  "content": [
    { "type": "message", "text": "Click " },
    { "type": "link", "text": "https://example.com/track", "attrs": { "track": true, "shorten": true } },
    { "type": "message", "text": " to track your order." }
  ]
}
```

All attribute values in the directive are written as strings (`"true"` /
`"false"`); the parser converts them to the booleans the JSON model uses.

## Related

- [`placeholder`](./placeholder) — the `Link` token type for system-managed link URLs
- [Building programmatically](../../building-programmatically)
- [`smsRfmSpec`](/api/rcml/src/variables/smsRfmSpec) — node attribute schema
