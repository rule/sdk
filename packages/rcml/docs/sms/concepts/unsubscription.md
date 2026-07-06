# Unsubscription

Regulatory requirements in most jurisdictions mandate that every commercial SMS
message includes an unsubscribe mechanism. Include the footer in every marketing
message. Transactional messages — order confirmations, delivery notifications,
one-time passwords — do not require it.

## XML

In an SMS RFM string or inside `<rc-sms>` XML, write the footer as the
`::unsubscribe` leaf directive:

```xml
<rc-sms>Your order has shipped!
::unsubscribe</rc-sms>
```

## JSON

The footer is two adjacent nodes at the end of the `content` array. The first
renders the localised opt-out phrase — the platform resolves
`[Subscriber:unsubscribe_text]` to the language-appropriate text at send time.
The second is the personalised unsubscribe link. Together they produce something
like: `Unsubscribe? i.rule.io/RzpmFP`

```json
[
  {
    "type": "message",
    "text": "[Subscriber:unsubscribe_text]",
    "attrs": { "is-unsubscribe": true }
  },
  {
    "type": "placeholder",
    "attrs": {
      "type": "Link",
      "name": "Unsubscribe",
      "original": "[Link:Unsubscribe]",
      "value": null,
      "is-unsubscribe": true
    }
  }
]
```

## Programmatic

Use `sms.createUnsubscribeNodes()` and spread it at the end of the `nodes`
array passed to `sms.createContent`:

```typescript
import { sms, createSmsDocument } from '@rule/rcml';

const doc = createSmsDocument({
  content: sms.createContent({
    nodes: [
      sms.createMessageNode({ text: 'Your order has shipped.' }),
      ...sms.createUnsubscribeNodes(),
    ],
  }),
});
```

## Related

- [`placeholder`](../content/nodes/placeholder) — `Link` placeholder type reference
- [Building programmatically](../building-programmatically) — full builder API, including `sms.createUnsubscribeNodes`
