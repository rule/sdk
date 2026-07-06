# `align`

A block wrapper that applies horizontal text alignment to its child content.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `value` | — | `"left"` \| `"center"` \| `"right"` | `"center"` | The horizontal alignment applied to all child block content. |

## Children

Block nodes — `paragraph`, `bullet-list`, `ordered-list` (one or more)

## Parent nodes

- `doc`

## Available in

- Full Email RFM (`rc-text`, `rc-heading`)

## JSON

```json
{
  "type": "align",
  "attrs": { "value": "center" },
  "content": [
    { "type": "paragraph", "content": [{ "type": "text", "text": "Centred text" }] }
  ]
}
```

## Email RFM syntax

Use `:::left`, `:::center`, or `:::right` fence block, closed by `:::` on its own line. Any block content between the fences is wrapped in the `align` node.

Example:

```
:::center
This paragraph is centred.
:::
```

Nested lists are also supported:

```
:::right
- Right-aligned bullet
- Second item
:::
```
