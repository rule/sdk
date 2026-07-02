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

They are **not the recommended form** for body content. The parser does
accept a bare `[Type:Name]` token as a backward-compatible shorthand —
but the resulting placeholder node has no `name` / `value` / `max-length`
attributes, which the editor relies on. To insert a dynamic value as text
in the message, use the `::placeholder{…}` directive in SMS RFM, or one
of the `sms` builder functions described below.

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
// → 'Your order is ready.\nAccount: [Subscriber:email]'
```

Both `\n` and `\n\n` in the SMS RFM string produce `\n` characters in the
resulting `message` node text. Line breaks are just characters — there are no
separate break nodes.

### Serializer output

Notice the asymmetry between input and output: the recommended *input* form
for a placeholder is the `::placeholder{…}` directive, but `jsonToSmsRfm`
*emits* the compact `[Type:Name]` form when both `value` and `max-length` are
absent or null. This is a serializer optimization for compact output, not a
suggestion about how to write SMS RFM by hand. The parser accepts both forms;
consumers that re-parse the serializer's output get back the same
`SmsContentJson` tree either way.

## Builders

The `sms` namespace exposes typed factory functions that return correctly
shaped `SmsContentJson` nodes. Use builders when the document is composed from
variables — a custom-field group held in code, a date offset that needs to be
computed, a URL that depends on an environment.

Builders give full type checking, no string concatenation, and no exposure to
wire-format details (`'max-length'` kebab key, `original` token format). They
perform no validation themselves; the TypeScript types catch shape errors and
`createSmsDocument` validates the assembled document at the boundary.

A small worked example:

```typescript
import { sms, createSmsDocument } from '@rule/rcml';

const content = sms.createContent({
  nodes: [
    sms.createMessageNode({ text: 'Your order is ready.\nAccount: ' }),
    sms.createSubscriberPlaceholder({ field: 'email' }),
  ],
});

const doc = createSmsDocument({ content });
```

The remainder of this section is the builder reference. Read the
[`message`](./content/nodes/message), [`link`](./content/nodes/link), and
[`placeholder`](./content/nodes/placeholder) reference pages for the JSON shapes
each builder produces.

### Document and node builders

#### `sms.createContent`

Wraps top-level nodes in a root `sms` node — the shape of
[`SmsContentJson`](./concepts/content).

```typescript
function createContent(opts: { nodes: SmsTopLevelNode[] }): SmsContentJson;
```

```typescript
const content = sms.createContent({
  nodes: [sms.createMessageNode({ text: 'Hello' })],
});
// → { type: 'sms', content: [{ type: 'message', text: 'Hello' }] }
```

#### `sms.createMessageNode`

Builds a message node with arbitrary text. Embedded `\n` characters produce
line breaks in the sent message.

```typescript
function createMessageNode(opts: { text: string }): SmsMessageNode;
```

```typescript
sms.createMessageNode({ text: 'Hello, world' });
// → { type: 'message', text: 'Hello, world' }

sms.createMessageNode({ text: 'Line one\nLine two' });
// → { type: 'message', text: 'Line one\nLine two' }
```

#### `sms.createLinkNode`

Builds a link node with a destination URL and tracking/shortening flags.

```typescript
function createLinkNode(opts: {
  url: string;
  track: boolean;
  shorten: boolean;
}): SmsLinkNode;
```

```typescript
sms.createLinkNode({
  url: 'https://example.com/orders/123',
  track: true,
  shorten: true,
});
// → { type: 'link', text: 'https://example.com/orders/123', attrs: { track: true, shorten: true } }
```

#### `sms.createUnsubscribeNodes`

Produces the two-node unsubscribe footer as a spreadable tuple: a localised
stop-word message followed by the system unsubscribe link placeholder.

```typescript
function createUnsubscribeNodes(): [SmsMessageNode, SmsPlaceholderNode];
```

Spread the result directly into a `createContent({ nodes })` call:

```typescript
sms.createContent({
  nodes: [
    sms.createMessageNode({ text: 'Your order has shipped.' }),
    ...sms.createUnsubscribeNodes(),
  ],
});
```

JSON equivalent of the two nodes produced:

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

The `is-unsubscribe` marker signals to the Rule platform that the block is the
opt-out footer. When present, the platform does not append its own footer.

### Placeholder builders

The recommended way to construct a placeholder is one of the per-token
convenience builders below. They compute the correct `original` token from
domain inputs so you never have to assemble `[Subscriber:email]` strings
by hand.

If you need a placeholder type the convenience builders do not cover, fall
back to the generic `sms.createPlaceholderNode`.

#### `sms.createSubscriberPlaceholder`

Inserts a subscriber-profile field. `name` defaults to the `field` value,
matching what the SMS RFM parser produces.

```typescript
function createSubscriberPlaceholder(opts: {
  field: string;
  name?: string;
}): SmsPlaceholderNode;
```

```typescript
sms.createSubscriberPlaceholder({ field: 'email' });
// original: '[Subscriber:email]', name: 'email'

sms.createSubscriberPlaceholder({ field: 'phone_number', name: 'Phone' });
// original: '[Subscriber:phone_number]', name: 'Phone'
```

#### `sms.createUserPlaceholder`

Inserts a field from the sender's Rule.io account profile.

```typescript
function createUserPlaceholder(opts: {
  field: string;
  name?: string;
}): SmsPlaceholderNode;
```

```typescript
sms.createUserPlaceholder({ field: 'CompanyName' });
// original: '[User:CompanyName]', name: 'CompanyName'
```

#### `sms.createCustomFieldPlaceholder`

Inserts a subscriber custom-field value. `group` and `name` are joined with a
dot to form both the `original` token and the placeholder's display label.
Optional `maxLength` (a number) appends `::N` to the token and sets the
node's `max-length` attribute, which truncates the value at render time.

```typescript
function createCustomFieldPlaceholder(opts: {
  group: string;
  name: string;
  maxLength?: number;
}): SmsPlaceholderNode;
```

```typescript
sms.createCustomFieldPlaceholder({ group: 'Order', name: 'Total' });
// original: '[CustomField:Order.Total]'

sms.createCustomFieldPlaceholder({ group: 'Order', name: 'Total', maxLength: 20 });
// original: '[CustomField:Order.Total::20]', 'max-length': '20'
```

#### `sms.createDatePlaceholder`

Inserts a formatted date computed at send time. The `source` argument is a
typed discriminated union covering the simple keywords (`'now'`, `'tomorrow'`,
`'yesterday'`), day-offset variants, and custom-field references. The
`format` argument is a closed set of PHP date format strings.

```typescript
type SmsDateSource =
  | 'now' | 'tomorrow' | 'yesterday'
  | { kind: 'days-from-now'; count: number }
  | { kind: 'days-ago'; count: number }
  | { kind: 'custom-field'; group: string; name: string };

type SmsDateFormat = 'Y-m-d' | 'd.m.Y' | 'm-d-Y' | 'm/d/Y' | 'd/m/Y';

function createDatePlaceholder(opts: {
  source: SmsDateSource;
  format: SmsDateFormat;
  name?: string;
}): SmsPlaceholderNode;
```

```typescript
sms.createDatePlaceholder({ source: 'tomorrow', format: 'd.m.Y' });
// original: '[Date:tomorrow::d.m.Y]'

sms.createDatePlaceholder({
  source: { kind: 'days-from-now', count: 7 },
  format: 'Y-m-d',
});
// original: '[Date:in-7-days::Y-m-d]'

sms.createDatePlaceholder({
  source: { kind: 'custom-field', group: 'Order', name: 'CreatedAt' },
  format: 'Y-m-d',
});
// original: '[Date:[CustomField:Order.CreatedAt]::Y-m-d]'
```

#### `sms.createRemoteContentPlaceholder`

Inserts a value fetched from a URL at send time. The URL is the second of the
two valid locations for plain-text tokens — it may contain nested
`[Subscriber:…]`, `[User:…]`, or `[CustomField:…]` tokens that the Rule
platform resolves before the request is made.

```typescript
function createRemoteContentPlaceholder(opts: { url: string }): SmsPlaceholderNode;
```

```typescript
sms.createRemoteContentPlaceholder({
  url: 'https://api.example.com/offer?id=[CustomField:Order.Id]',
});
// original: '[RemoteContent:https://api.example.com/offer?id=[CustomField:Order.Id]]'
```

#### `sms.createLinkPlaceholder`

Inserts a system-managed link URL as plain text in the message body — Rule's
unsubscribe URL, web-browser-view URL, and similar. The `link` argument is a
closed enum of the five available link types.

To produce a clickable link instead, use `sms.createLinkNode` with the
system-link URL as `url`.

```typescript
type SmsSystemLinkType =
  | 'Optin' | 'Unsubscribe' | 'WebBrowser' | 'ShareLink' | 'Signup';

function createLinkPlaceholder(opts: { link: SmsSystemLinkType }): SmsPlaceholderNode;
```

```typescript
sms.createLinkPlaceholder({ link: 'Unsubscribe' });
// original: '[Link:Unsubscribe]', name: 'Unsubscribe'
```

#### `sms.createPlaceholderNode`

The low-level fallback. Takes the raw `type`, `original` token, `name`, and
optional `value` / `maxLength`. Use this only when the convenience builders
above do not cover what you need.

```typescript
function createPlaceholderNode(opts: {
  type: SmsPlaceholderType;
  original: string;
  name: string;
  value?: string | number | null;
  maxLength?: string | null;
}): SmsPlaceholderNode;
```

```typescript
sms.createPlaceholderNode({
  type: 'Subscriber',
  original: '[Subscriber:email]',
  name: 'Email',
  value: 'jane@example.com',
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

// Serialize to XML. The XML body uses the compact [Type:Name] form
// (the same serializer-output behaviour described under "Serializer output"
// above).
const xml = smsToXml(doc, { pretty: true });
// → '<rc-sms>Your total is [CustomField:Order.Total].\nAccount: [Subscriber:email]</rc-sms>'

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
