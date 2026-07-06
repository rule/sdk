# `list-item`

A single item inside a `bullet-list` or `ordered-list`, optionally containing nested lists.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `label` | — | string | `"•"`, `"1."` | The rendered marker text assigned by the parent list. |
| `list-type` | — | `"bullet"` \| `"ordered"` | `"bullet"` | Identifies whether this item belongs to a bullet or ordered list. |
| `spread` | `"false"` | `"true"` \| `"false"` | `"true"` | String flag (not boolean) matching the parent list's `spread` attribute. |

## Children

Block nodes — `paragraph`, `bullet-list`, `ordered-list` (one or more)

## Parent nodes

- `bullet-list`
- `ordered-list`

## Available in

- Full Email RFM (`rc-text`, `rc-heading`)

## JSON

```json
{
  "type": "list-item",
  "attrs": { "label": "•", "list-type": "bullet", "spread": "false" },
  "content": [
    { "type": "paragraph", "content": [{ "type": "text", "text": "Main item" }] },
    {
      "type": "bullet-list",
      "attrs": { "spread": false },
      "content": [
        {
          "type": "list-item",
          "attrs": { "label": "•", "list-type": "bullet", "spread": "false" },
          "content": [
            { "type": "paragraph", "content": [{ "type": "text", "text": "Nested item" }] }
          ]
        }
      ]
    }
  ]
}
```

## Email RFM syntax

`list-item` nodes are not written directly in Email RFM. They are produced automatically by the `- ` / `* ` (bullet) and `1. ` / `2. ` (ordered) list syntax. Indent list lines by two or more spaces to create nested items.

Example:

```
- Item one
- Item two
  - Nested bullet one
  - Nested bullet two
    - Double-nested item
```
