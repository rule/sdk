# `rc-sms`

The root and only element of an SMS document. Its text content is the message
body, written in SMS RFM. There is exactly one `<rc-sms>` element per template;
no wrapping root element, no head, no body.

## Attributes

| Attribute | Required | Type | Description |
|-----------|----------|------|-------------|
| `id` | No | string | Optional node identifier (typically a UUID). Set on `SmsDocument.id` and round-tripped through `smsToXml` / `xmlToSms` as the `id="…"` XML attribute. The Rule editor uses this when persisting drafts. |

The element's JSON shape uses `attributes: {}` — `id` lives at the top
level of `SmsDocument`, not inside `attributes`. Other than `id`, `rc-sms`
takes no attributes.

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

## XML

```xml
<rc-sms>Hi ::placeholder{type="Subscriber" original="[Subscriber:FirstName]" name="First name"}, your order has shipped!</rc-sms>
```

## JSON

```json
{
  "tagName": "rc-sms",
  "attributes": {},
  "content": {
    "type": "sms",
    "content": [
      { "type": "message", "text": "Hi " },
      {
        "type": "placeholder",
        "attrs": {
          "type": "Subscriber",
          "name": "First name",
          "original": "[Subscriber:FirstName]",
          "value": null
        }
      },
      { "type": "message", "text": ", your order has shipped!" }
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

- [SMS document](../concepts/sms-document) — `SmsDocument` and `SmsContentJson` types
- [SMS RFM](../concepts/sms-rfm) — SMS RFM syntax reference
- [`message`](../content/nodes/message) — message node reference
- [`link`](../content/nodes/link) — link node reference
- [`placeholder`](../content/nodes/placeholder) — placeholder node and all token types
- [Building programmatically](../building-programmatically) — full document construction walkthrough
