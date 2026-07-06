# `hardbreak`

An inline line break — forces a new line within a paragraph without creating a new paragraph node.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `isInline` | `true` | boolean | `true` | Whether this break is rendered inline. Always `true`. |

## Children

None (inline leaf node)

## Parent nodes

- `paragraph`

## Available in

- Full Email RFM (`rc-text`, `rc-heading`)
- Email Inline RFM (`rc-button`)

## JSON

```json
{
  "type": "paragraph",
  "content": [
    { "type": "text", "text": "Line one" },
    { "type": "hardbreak" },
    { "type": "text", "text": "Line two" }
  ]
}
```

## Email RFM syntax

Two trailing spaces at the end of a line, or a backslash `\` immediately before the newline.

Example with trailing spaces:

```
Line one  
Line two
```

(Two spaces after "Line one" produce a `hardbreak`.)

Alternatively, use a backslash:

```
Line one\
Line two
```
