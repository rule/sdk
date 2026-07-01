# SMS document

An SMS template, in code, is an `SmsDocument` — a plain JavaScript object that
describes the entire message. This page describes the type model: the shape of an
`SmsDocument`, the inner `SmsContentJson` document tree, and what each part
represents.

For factory and converter functions that produce or transform documents, see
[Building programmatically](../building-programmatically).

## The `SmsDocument` type

An `SmsDocument` always has the same three fields:

```typescript
type SmsDocument = {
  tagName: 'rc-sms';          // always the string literal 'rc-sms'
  attributes: {};             // always an empty object — rc-sms takes no attributes
  content: SmsContentJson;    // the message body as a structured document tree
};
```

`tagName` and `attributes` are fixed. The interesting part is `content`: a
structured representation of what the message says, ready for the Rule editor to
render and for the Rule platform to substitute placeholders into at send time.

## The `SmsContentJson` tree

`SmsContentJson` is a flat document model — the same shape the Rule editor uses
internally — that describes the message body as a linear sequence of top-level
nodes.

Storing content as `SmsContentJson` means a template can be loaded directly into
the Rule editor for human editing and saved back without an intermediate
conversion step.

The top of the tree is always an `sms` node:

```typescript
type SmsContentJson = {
  type: 'sms';
  content: SmsTopLevelNode[];
};
```

The `content` array holds a flat sequence of nodes — there are no intermediate
block wrappers. Three node types are valid at the top level:

```typescript
type SmsTopLevelNode = SmsMessageNode | SmsLinkNode | SmsPlaceholderNode;
```

## Node types

### Message

A run of plain text. Line breaks within the message are embedded directly as
`\n` characters in the `text` field — there are no separate line-break nodes.

```typescript
type SmsMessageNode = {
  type: 'message';
  text: string;
};
```

### Link

A hyperlink with click-tracking and URL-shortening controls. The `text` field
holds the destination URL, which the Rule platform renders as a clickable link
when the message is sent.

```typescript
type SmsLinkNode = {
  type: 'link';
  text: string;               // destination URL
  attrs: {
    track: boolean;           // enable click-through tracking
    shorten: boolean;         // shorten the URL before sending
  };
};
```

### Placeholder

A dynamic value the Rule platform substitutes at send time — a subscriber field,
custom field, account attribute, formatted date, fetched remote content, or
system-managed link URL:

```typescript
type SmsPlaceholderNode = {
  type: 'placeholder';
  attrs: {
    type: 'CustomField' | 'Subscriber' | 'User' | 'Date' | 'RemoteContent' | 'Link';
    name: string;             // human-readable label shown in the editor
    original: string;         // backend token, e.g. '[Subscriber:FirstName]'
    value: string | number | null;  // resolved preview value, or null
    'max-length'?: string | null;   // truncation limit; omit when no limit
  };
};
```

The full token catalogue with examples for each `type` value lives in
[Placeholders](../content/nodes/placeholder).

## A complete example

A two-message greeting with a placeholder, a line break inside a message node,
and a link:

```typescript
const content: SmsContentJson = {
  type: 'sms',
  content: [
    { type: 'message', text: 'Hi ' },
    {
      type: 'placeholder',
      attrs: {
        type: 'Subscriber',
        name: 'First name',
        original: '[Subscriber:FirstName]',
        value: null,
      },
    },
    { type: 'message', text: ',\nyour order has shipped.\n' },
    {
      type: 'link',
      text: 'https://example.com/track',
      attrs: { track: true, shorten: true },
    },
    { type: 'message', text: '\nReply STOP to unsubscribe.' },
  ],
};
```

## Related

- [SMS RFM](./sms-rfm) — the source format that compiles to `SmsContentJson`
- [Building programmatically](../building-programmatically) — `createSmsDocument` and the format converters
- [`sms`](../content/nodes/sms) — root node reference
- [`message`](../content/nodes/message) — message node reference
- [`link`](../content/nodes/link) — link node reference
- [`placeholder`](../content/nodes/placeholder) — placeholder node reference and token catalogue
- [Validation](../validation) — validating an `SmsDocument` before submission
