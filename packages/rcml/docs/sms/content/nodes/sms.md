# `sms`

The root node of every `SmsContentJson` document. Its `content` array holds a
flat sequence of top-level nodes.

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
    { "type": "message", "text": "Hi " },
    {
      "type": "placeholder",
      "attrs": {
        "type": "Subscriber",
        "original": "[Subscriber:FirstName]",
        "name": "FirstName",
        "value": null
      }
    },
    { "type": "message", "text": "!" }
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
Hi [Subscriber:FirstName]!
```

Compiles to:

```json
{
  "type": "sms",
  "content": [
    { "type": "message", "text": "Hi " },
    { "type": "placeholder", "attrs": { "type": "Subscriber", "original": "[Subscriber:FirstName]", "name": "FirstName", "value": null } },
    { "type": "message", "text": "!" }
  ]
}
```
