# Building programmatically

The `@rule/rcml` package provides everything needed to construct, validate,
and convert SMS templates in code: a document factory, a typed `sms` builder
namespace, format converters between SMS RFM and JSON, and helpers for the XML
representation.

## A note on plain-text tokens

`[Type:Name]` tokens — `[Subscriber:email]`, `[CustomField:Order.Total]`,
`[Link:Unsubscribe]`, and so on — are valid in **exactly two places**:

1. As the value of the `original` attribute on a `placeholder` node, whether
   the node is written as `::placeholder{…}` in SMS RFM or as JSON.
2. Inside a URL value or part of a URL value — typically the `text` of a
   [`link`](./content/nodes/link) node or the URL given to `RemoteContent`.

The parser accepts a bare `[Type:Name]` token in body content as a
shorthand for a placeholder node. The serializer always emits the full
`::placeholder{…}` form — the shorthand is parse-only. To insert a dynamic
value, use the `::placeholder{…}` directive in SMS RFM, or one of the `sms`
builder functions described below.

## Quick start

`createSmsDocument()` is the primary entry point. Pass an SMS RFM string as
`content` and it returns a fully-formed `SmsDocument`:

```typescript
import { createSmsDocument } from '@rule/rcml';

const doc = createSmsDocument({
  content:
    'Your order ::placeholder{type="CustomField" original="[CustomField:Order.Id]" name="Order.Id"} has shipped.' +
    '\nAccount: ::placeholder{type="Subscriber" original="[Subscriber:email]" name="Email"}',
});
```

`createSmsDocument` throws `SmsDocumentBuildError` if the content fails
validation. To handle errors without a try/catch, use `validateSmsDocument` or
`safeValidateSmsDocument` directly — see [Validation](./validation).

## Three ways to compose

You can hand `createSmsDocument` content in three forms. They are equivalent
— pick whichever fits the situation.

| Approach | Best when | Section |
|----------|----------|---------|
| SMS RFM string | The message is mostly static text written by hand. | [SMS RFM strings](#sms-rfm-strings) |
| `sms` builders | The document is composed from variables held in code. | [Builders](#builders) |
| Hand-written JSON | You already hold an `SmsContentJson` value. | [JSON input](#json-input) |

The XML format (`<rc-sms>…</rc-sms>`) is a fourth, equivalent representation —
see [XML format](#xml-format).

## SMS RFM strings

`smsRfmToJson()` converts an SMS RFM string into `SmsContentJson`.
`jsonToSmsRfm()` converts it back:

```typescript
import { smsRfmToJson, jsonToSmsRfm } from '@rule/rcml';

// SMS RFM → JSON. Use the ::placeholder{…} directive for dynamic values.
const json = smsRfmToJson(
  'Your order is ready.\nAccount: ::placeholder{type="Subscriber" original="[Subscriber:email]" name="Email"}'
);
// {
//   type: 'sms',
//   content: [
//     { type: 'message', text: 'Your order is ready.\nAccount: ' },
//     { type: 'placeholder', attrs: { type: 'Subscriber', original: '[Subscriber:email]',
//         name: 'Email', value: null } },
//   ],
// }

// JSON → SMS RFM
const rfm = jsonToSmsRfm(json);
// → 'Your order is ready.\nAccount: ::placeholder{type="Subscriber" original="[Subscriber:email]" name="Email"}'
```

Both `\n` and `\n\n` in the SMS RFM string produce `\n` characters in the
resulting `message` node text. Line breaks are just characters — there are no
separate break nodes.

## Builders

The `sms` namespace exposes typed factory functions that return correctly
shaped `SmsContentJson` nodes. Use builders when the document is composed from
variables — a custom-field group held in code, a date offset that needs to be
computed, a URL that depends on an environment.

Builders give full type checking, no string concatenation, and no exposure to
wire-format details (`'max-length'` kebab key, `original` token format). They
perform no validation themselves; the TypeScript types catch shape errors and
`createSmsDocument` validates the assembled document at the boundary.

```typescript
import { sms, createSmsDocument } from '@rule/rcml';

const content = sms.createContent({
  nodes: [
    sms.createMessageNode({ text: 'Your order is ready.\nAccount: ' }),
    sms.createSubscriberPlaceholder({ field: 'email' }),
    ...sms.createUnsubscribeNodes(),
  ],
});

const doc = createSmsDocument({ content });
```

Builder signatures and examples for each node type live on the node reference pages:

- [`message`](./content/nodes/message) — `sms.createMessageNode`
- [`link`](./content/nodes/link) — `sms.createLinkNode`
- [`placeholder`](./content/nodes/placeholder) — `sms.createSubscriberPlaceholder`, `sms.createCustomFieldPlaceholder`, `sms.createDatePlaceholder`, `sms.createRemoteContentPlaceholder`, `sms.createLinkPlaceholder`, `sms.createPlaceholderNode`

### `sms.createContent`

Wraps top-level nodes in a root `sms` node:

```typescript
const content = sms.createContent({
  nodes: [sms.createMessageNode({ text: 'Hello' })],
});
// → { type: 'sms', content: [{ type: 'message', text: 'Hello' }] }
```

### `sms.createUnsubscribeNodes`

Produces the two-node unsubscribe footer as a spreadable tuple. See
[Unsubscription](./concepts/unsubscription) for details.

```typescript
sms.createContent({
  nodes: [
    sms.createMessageNode({ text: 'Your order has shipped.' }),
    ...sms.createUnsubscribeNodes(),
  ],
});
```

## JSON input

`createSmsDocument` also accepts a pre-built `SmsContentJson` value. This is
useful when the JSON tree comes from somewhere other than the builders or the
parser — for example, an editor save or a stored draft:

```typescript
import { createSmsDocument } from '@rule/rcml';
import type { SmsContentJson } from '@rule/rcml';

const content: SmsContentJson = loadDraftFromStorage(); // your code
const doc = createSmsDocument({ content });
```

See [Content](./concepts/content) for the full type reference.

## XML format

`smsToXml()` converts an `SmsDocument` to an XML string. `xmlToSms()` converts
it back. XML is one of two equivalent serialisations of an SMS template — the
body of `<rc-sms>` is just an SMS RFM string, and the conversion is exact in
both directions:

```typescript
import { createSmsDocument, smsToXml, xmlToSms } from '@rule/rcml';

const doc = createSmsDocument({
  content:
    'Your total is ::placeholder{type="CustomField" original="[CustomField:Order.Total]" name="Order.Total"}.' +
    '\nAccount: ::placeholder{type="Subscriber" original="[Subscriber:email]" name="Email"}',
});

const xml = smsToXml(doc, { pretty: true });
// → '<rc-sms>Your total is ::placeholder{type="CustomField" original="[CustomField:Order.Total]" name="Order.Total"}.\nAccount: ::placeholder{type="Subscriber" original="[Subscriber:email]" name="Email"}</rc-sms>'

// Parse back to SmsDocument
const restored = xmlToSms(xml);
// restored deeply equals doc
```

`smsToXml` accepts an optional options object:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pretty` | `boolean` | `true` | Format the output with newlines and indentation. |
| `indent` | `string` | `'  '` | Indentation string used when `pretty` is `true`. |

`xmlToSms` throws `SmsXmlParseError` on failure. Use `safeXmlToSms` for the
non-throwing variant.

## Safe import from XML

When importing a document from an external source (an LLM, a CMS, or
user-provided input), use `safeXmlToSms` to parse and then
`safeValidateSmsDocument` to validate before using the result:

```typescript
import { safeXmlToSms, safeValidateSmsDocument } from '@rule/rcml';

// 1. Parse XML → SmsDocument
const parsed = safeXmlToSms(xmlString);
if (!parsed.success) {
  console.error(parsed.errors);
  // Each error has: { path, code, message }
  // Codes: XML_PARSE_ERROR | ROOT_INVALID | SMS_RFM_PARSE_ERROR
  return;
}

// 2. Validate the document structure and content
const validated = safeValidateSmsDocument(parsed.data);
if (!validated.success) {
  console.error(validated.errors);
  return;
}

// validated.data is the SmsDocument, ready to submit
```

## Putting it together

A complete order-shipped SMS built with builders only — message nodes,
placeholders, a link node, and a system-link placeholder:

```typescript
import { sms, createSmsDocument } from '@rule/rcml';

const content = sms.createContent({
  nodes: [
    sms.createMessageNode({ text: 'Your order ' }),
    sms.createCustomFieldPlaceholder({ group: 'Order', name: 'Id' }),
    sms.createMessageNode({ text: ' has shipped.\nTrack it: ' }),
    sms.createLinkNode({
      url: 'https://example.com/orders/[CustomField:Order.Id]',
      track: true,
      shorten: true,
    }),
    ...sms.createUnsubscribeNodes(),
  ],
});

const doc = createSmsDocument({ content });
```

## Related

- [Template](./concepts/template) — `SmsDocument` structure and `createSmsDocument()` usage
- [Content](./concepts/content) — `SmsContentJson` flat sequence model
- [`message`](./content/nodes/message) — message node reference
- [`link`](./content/nodes/link) — link node reference
- [`placeholder`](./content/nodes/placeholder) — placeholder node attribute reference
- [Validation](./validation) — error types and codes
- [Building with LLM](./building-with-llm) — spec-driven generation workflow
- [`createSmsDocument`](/api/rcml/src/functions/createSmsDocument) — API reference
- [`smsRfmToJson`](/api/rcml/src/functions/smsRfmToJson) — API reference
- [`jsonToSmsRfm`](/api/rcml/src/functions/jsonToSmsRfm) — API reference
- [`smsToXml`](/api/rcml/src/functions/smsToXml) — API reference
- [`xmlToSms`](/api/rcml/src/functions/xmlToSms) — API reference
- [`sms`](/api/rcml/src/variables/sms) — `sms` builder namespace
