# `bullet-list`

An unordered list containing one or more `list-item` nodes rendered with bullet markers.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `spread` | `false` | boolean | `true` | When `true`, adds vertical spacing between list items. |

## Children

`list-item` (one or more)

## Parent nodes

- `doc`
- `list-item` (for nesting)

## Available in

- Full Email RFM (`rc-text`, `rc-heading`)

## JSON

```json
{
  "type": "bullet-list",
  "attrs": { "spread": false },
  "content": [
    {
      "type": "list-item",
      "attrs": { "label": "•", "list-type": "bullet", "spread": "false" },
      "content": [
        { "type": "paragraph", "content": [{ "type": "text", "text": "First item" }] }
      ]
    },
    {
      "type": "list-item",
      "attrs": { "label": "•", "list-type": "bullet", "spread": "false" },
      "content": [
        { "type": "paragraph", "content": [{ "type": "text", "text": "Second item" }] }
      ]
    }
  ]
}
```

## Email RFM syntax

Lines starting with `- ` or `* `. Each line becomes a `list-item` containing a `paragraph`.

```rfm
- First item
- Second item
- Third item
```
