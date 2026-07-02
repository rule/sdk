# Content

The `content` field of an `SmsDocument` is an `SmsContentJson` — a flat
sequence of three node types.

## Structure

```typescript
interface SmsContentJson {
  type: 'sms';
  content: SmsTopLevelNode[];
}

type SmsTopLevelNode = SmsMessageNode | SmsLinkNode | SmsPlaceholderNode;
```

The sequence is flat — there are no block wrappers, paragraphs, or nesting
levels. Line breaks are `\n` characters embedded in the `text` of a
[`message`](../content/nodes/message) node.

## Node types

### `message`

Static text. The `text` field is a plain string; `\n` produces a line break in
the sent message.

See [`message`](../content/nodes/message) for the full attribute reference.

### `link`

A clickable URL in the message body. The `attrs` object carries the destination
`text` (URL or system-link token), a `track` flag, and a `shorten` flag.

See [`link`](../content/nodes/link) for the full attribute reference.

### `placeholder`

A dynamic value the Rule platform substitutes at send time — a subscriber field,
a custom field, a formatted date, fetched remote content, or a system-managed
URL. The `attrs.type` discriminator identifies the substitution category.

See [`placeholder`](../content/nodes/placeholder) for the full attribute
reference and all supported substitution types.

## Example

```json
{
  "type": "sms",
  "content": [
    { "type": "message", "text": "Order " },
    {
      "type": "placeholder",
      "attrs": {
        "type": "CustomField",
        "original": "[CustomField:Order.Id]",
        "name": "Order.Id",
        "value": "Order.Id"
      }
    },
    { "type": "message", "text": " has shipped.\nTrack it: " },
    {
      "type": "link",
      "text": "https://example.com/orders/[CustomField:Order.Id]",
      "attrs": { "track": true, "shorten": true }
    }
  ]
}
```

## Building content

Use `sms.createContent({ nodes })` to wrap a list of top-level nodes into an
`SmsContentJson`:

```typescript
import { sms, createSmsDocument } from '@rule/rcml';

const doc = createSmsDocument({
  content: sms.createContent({
    nodes: [
      sms.createMessageNode({ text: 'Order ' }),
      sms.createCustomFieldPlaceholder({ group: 'Order', name: 'Id' }),
      sms.createMessageNode({ text: ' has shipped.' }),
    ],
  }),
});
```

For the full builder reference, see [Building programmatically](../building-programmatically).

## Related

- [`sms`](../content/nodes/sms) — `sms` root node and `SmsContentJson` type reference
- [`message`](../content/nodes/message) — message node reference
- [`link`](../content/nodes/link) — link node reference
- [`placeholder`](../content/nodes/placeholder) — placeholder node reference
- [Unsubscription](./unsubscription) — required unsubscribe footer nodes
- [Building programmatically](../building-programmatically) — full builder API
