# `message`

A top-level node that carries a run of plain text. Line breaks within the text
are embedded directly as `\n` characters in the `text` field.

## Attributes

None. The text content is held in the `text` field, not in `attrs`.

## Fields

| Field | Required | Description |
|-------|----------|-------------|
| `text` | Yes | The raw text string. May contain embedded `\n` characters for line breaks. |

## Children

None (leaf node).

## Parent nodes

- [`sms`](./sms)

## Available in

- SMS RFM (`rc-sms`)

## JSON

Plain text:

```json
{ "type": "message", "text": "Hello world" }
```

Text with embedded line breaks:

```json
{ "type": "message", "text": "Line one\nLine two\nLine three" }
```

Adjacent to a placeholder:

```json
{
  "type": "sms",
  "content": [
    { "type": "message", "text": "Account: " },
    {
      "type": "placeholder",
      "attrs": { "type": "Subscriber", "original": "[Subscriber:email]", "name": "email", "value": null }
    },
    { "type": "message", "text": "\nYour order has shipped." }
  ]
}
```

## SMS RFM syntax

Plain text written between placeholders and links compiles directly to `message`
nodes. Any line breaks in the source become `\n` in the `text` field:

```
First line
Second line
```

Compiles to:

```json
{ "type": "message", "text": "First line\nSecond line" }
```

Text surrounding a placeholder compiles to two separate `message` nodes:

```
Account: [Subscriber:email]
Your order has shipped.
```

Compiles to:

```json
[
  { "type": "message", "text": "Account: " },
  { "type": "placeholder", "attrs": { "type": "Subscriber", "original": "[Subscriber:email]", "name": "email", "value": null } },
  { "type": "message", "text": "\nYour order has shipped." }
]
```
