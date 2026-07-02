# Unsubscription

Regulatory requirements in most jurisdictions mandate that every commercial SMS
message includes an unsubscribe mechanism. The Rule platform enforces this: if a
template does not contain the unsubscribe footer, the platform appends one
automatically.

## Footer structure

The footer consists of exactly **two adjacent nodes** at the end of the message:

1. An `SmsMessageNode` containing the localised opt-out phrase —
   `[Subscriber:unsubscribe_text]` — which the platform resolves to the
   language-appropriate stop word at send time (e.g. "STOP" or "Unsubscribe").
2. An `SmsPlaceholderNode` for `[Link:Unsubscribe]` — the personalised
   unsubscribe URL.

Both nodes carry `attrs: { 'is-unsubscribe': true }`. This marker tells the Rule
platform that the footer is already present, so it does not append a duplicate.

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

## XML / RFM form

In an SMS RFM string or inside `<rc-sms>` XML, write the footer as the
`::unsubscribe` leaf directive:

```xml
<rc-sms>Your order has shipped!
::unsubscribe</rc-sms>
```

The parser expands `::unsubscribe` into the two JSON nodes shown above.
The serialiser (`jsonToSmsRfm`) collapses them back to `::unsubscribe` on
the way out, so the round-trip is lossless.

## Adding the footer

Use `sms.createUnsubscribeNodes()`. It returns a two-element tuple — spread it
at the end of the `nodes` array passed to `sms.createContent`:

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

`createUnsubscribeNodes()` is the only SDK path that produces the
`is-unsubscribe` marker. Do not construct these nodes by hand — the exact shape
is an implementation detail and may change.

## Related

- [`placeholder`](../content/nodes/placeholder) — `Link` placeholder type reference
- [Building programmatically](../building-programmatically) — full builder API, including `sms.createUnsubscribeNodes`
