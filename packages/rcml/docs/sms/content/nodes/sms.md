# `sms`

The root node of every `SmsContentJson` document. Its `content` array holds a
flat sequence of top-level nodes.

## TypeScript type

```typescript
interface SmsContentJson {
  type: 'sms';
  content: SmsTopLevelNode[];
}

type SmsTopLevelNode = SmsMessageNode | SmsLinkNode | SmsPlaceholderNode;
```

`SmsContentJson` is the `content` field of `SmsDocument` and the value accepted
by `createSmsDocument({ content })`. The `content` array is a flat sequence of
[`message`](./message), [`link`](./link), and [`placeholder`](./placeholder)
nodes — there are no block wrappers or nesting levels.

## Attributes

None.

## Children

Zero or more [`message`](./message), [`link`](./link), or
[`placeholder`](./placeholder) nodes.

## Parent nodes

None — `sms` is the root; it has no parent.

## Available in

- SMS RFM (`rc-sms`)

## JSON

```json
{
  "type": "sms",
  "content": [
    { "type": "message", "text": "Hello world" }
  ]
}
```

Multi-node document:

```json
{
  "type": "sms",
  "content": [
    { "type": "message", "text": "Account: " },
    {
      "type": "placeholder",
      "attrs": {
        "type": "Subscriber",
        "original": "[Subscriber:email]",
        "name": "email",
        "value": null
      }
    },
    { "type": "message", "text": "\nYour order has shipped." }
  ]
}
```

## SMS RFM

An `sms` node is implicit — it is not written directly. An SMS RFM string
compiles to a single `sms` root with its nodes in the `content` array.

```
Hello world
```

Compiles to:

```json
{ "type": "sms", "content": [{ "type": "message", "text": "Hello world" }] }
```

A message with a placeholder:

```
Account: [Subscriber:email]
Your order has shipped.
```

Compiles to:

```json
{
  "type": "sms",
  "content": [
    { "type": "message", "text": "Account: " },
    { "type": "placeholder", "attrs": { "type": "Subscriber", "original": "[Subscriber:email]", "name": "email", "value": null } },
    { "type": "message", "text": "\nYour order has shipped." }
  ]
}
```
