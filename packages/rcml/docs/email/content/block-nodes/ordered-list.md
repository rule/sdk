# `ordered-list`

A numbered list containing one or more `list-item` nodes rendered with sequential numeric markers.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `order` | `1` | number | `3` | The number assigned to the first list item. |
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
  "type": "ordered-list",
  "attrs": { "order": 1, "spread": false },
  "content": [
    {
      "type": "list-item",
      "attrs": { "label": "1.", "list-type": "ordered", "spread": "false" },
      "content": [
        { "type": "paragraph", "content": [{ "type": "text", "text": "First step" }] }
      ]
    },
    {
      "type": "list-item",
      "attrs": { "label": "2.", "list-type": "ordered", "spread": "false" },
      "content": [
        { "type": "paragraph", "content": [{ "type": "text", "text": "Second step" }] }
      ]
    }
  ]
}
```

## Email RFM syntax

Lines starting with `1. `, `2. `, etc. Each line becomes a `list-item` containing a `paragraph`.

```rfm
1. First step
2. Second step
3. Third step
```
