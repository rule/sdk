# SMS

The SMS module provides the types, format converters, and validation functions
needed to build SMS templates that the Rule platform can render and send.

An SMS template is a single `<rc-sms>` element. The whole message is the text
content of that element, written in **SMS RFM** (SMS Rule Flavor Markdown).

## Template formats

A template exists in two equivalent representations. Both carry the same content
and convert between each other.

- **JSON (`SmsDocument`)** — the canonical format. The Rule API accepts and
  returns this. Every other format converts to or from it.
- **XML** — a compact, readable representation of the same template. The text
  body of `<rc-sms>` is an SMS RFM string.

A minimal example in both formats:

```xml
<rc-sms>Your order has shipped!
Account: ::placeholder{type="Subscriber" original="[Subscriber:email]" name="Email"}</rc-sms>
```

```typescript
import type { SmsDocument } from '@rule/rcml';

const doc: SmsDocument = {
  tagName: 'rc-sms',
  attributes: {},
  content: {
    type: 'sms',
    content: [
      { type: 'message', text: 'Your order has shipped!\nAccount: ' },
      {
        type: 'placeholder',
        attrs: {
          type: 'Subscriber',
          name: 'Email',
          original: '[Subscriber:email]',
          value: null,
        },
      },
    ],
  },
};
```

The document structure is explained in [Template](./concepts/template); the
content model is explained in [Content](./concepts/content).

## In this section

| Page | What it covers |
|------|---------------|
| [Template](./concepts/template) | `SmsDocument` structure and `createSmsDocument()` usage |
| [Content](./concepts/content) | `SmsContentJson` flat sequence model and node types |
| [Unsubscription](./concepts/unsubscription) | Required unsubscribe footer and `createUnsubscribeNodes()` |
| [SMS RCML](./rcml/) | The `rc-sms` element reference |
| [Node reference](./content/nodes/sms) | Every node with full attribute tables |
| [Building programmatically](./building-programmatically) | `createSmsDocument`, the `sms` builder namespace, SMS RFM ↔ JSON, XML round-trip |
| [Validation](./validation) | Validating documents and content before submission |
| [Building with LLM](./building-with-llm) | Using spec objects to drive LLM-assisted template generation |
