# `rc-sms`

The root and only element of an SMS document. Its text content is the message
body, written in SMS RFM. There is exactly one `<rc-sms>` element per template;
no wrapping root element, no head, no body.

## Attributes

| Attribute | Required | Type | Description |
|-----------|----------|------|-------------|
| `id` | No | UUID string | Document identifier. Optional in both XML and JSON. When present it is preserved as-is; when absent, `id` is not set on the resulting `SmsDocument`. |

`id` lives at the top level of `SmsDocument`.

## Content

The element body is an SMS RFM string. During XML parsing, the body is converted
to an `SmsContentJson` document. In the JSON representation, the `content` field
holds the parsed `SmsContentJson` directly.

Content type: `sms-rfm-content` — see
[`smsRfmSpec.flavors['sms-rfm-content']`](/api/rcml/src/variables/smsRfmSpec).

Valid top-level nodes: [`message`](../content/nodes/message),
[`link`](../content/nodes/link),
[`placeholder`](../content/nodes/placeholder)

## Children

None — `rc-sms` has no child elements. Its content is text, not nested elements.

## Parents

None — `rc-sms` is the document root.

## TypeScript type

```typescript
interface SmsDocument {
  /** Document identifier — a UUID. Optional; preserved when present, omitted when absent. */
  id?: string;
  /** Always `'rc-sms'`. */
  tagName: 'rc-sms';
  /** The parsed message content. */
  content: SmsContentJson;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Document identifier. Optional. When present, preserved as-is. When absent, not set on the resulting `SmsDocument`. |
| `tagName` | `'rc-sms'` | Element discriminator. Always `'rc-sms'`. |
| `content` | `SmsContentJson` | The parsed message content. See [Content](../concepts/content) for the content model. |

## XML

```xml
<rc-sms>Your order has shipped!
Account: ::placeholder{type="Subscriber" original="[Subscriber:email]" name="Email"}</rc-sms>
```

## JSON

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tagName": "rc-sms",
  "content": {
    "type": "sms",
    "content": [
      { "type": "message", "text": "Your order has shipped!\nAccount: " },
      {
        "type": "placeholder",
        "attrs": {
          "type": "Subscriber",
          "name": "Email",
          "original": "[Subscriber:email]",
          "value": "email"
        }
      }
    ]
  }
}
```

## Building

To construct an `<rc-sms>` document in code, use `createSmsDocument()`. To
convert between the JSON and XML representations, use `smsToXml()` and
`xmlToSms()`. See [Building programmatically](../building-programmatically) for
the full walkthrough.

## Related

- [Template](../concepts/template) — `SmsDocument` structure and `createSmsDocument()` usage
- [Content](../concepts/content) — `SmsContentJson` flat sequence model
- [`message`](../content/nodes/message) — message node reference
- [`link`](../content/nodes/link) — link node reference
- [`placeholder`](../content/nodes/placeholder) — placeholder node and all token types
- [Building programmatically](../building-programmatically) — full document construction walkthrough
