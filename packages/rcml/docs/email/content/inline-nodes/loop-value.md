# `loop-value`

An inline atom that references a property from the current `rc-loop` iteration item and is replaced with its value at render time.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `original` | — | string | `"[LoopValue:title.1]"` | Source token in `[LoopValue:<key>.<index>]` form. This is what Rule renders. |
| `value` | — | string | `"title"` | The `key`: the property name on the iteration item (a JSON property, or an Open Graph tag name for news-feed loops). |
| `index` | — | string | `"1"` | The 1-based column slot the value fills, counted across all sections of the loop block. A single-column loop uses `"1"` for every value. |

## Children

None (inline atom, leaf node).

## Parent nodes

- `paragraph`

## Available in

- Full Email RFM (`rc-text`, `rc-heading`)

## JSON

```json
{
  "type": "loop-value",
  "attrs": {
    "original": "[LoopValue:title.1]",
    "value": "title",
    "index": "1"
  }
}
```

In context — a `paragraph` inside an `rc-loop` that renders each item's title:

```json
{
  "type": "paragraph",
  "content": [
    { "type": "text", "text": "Product: " },
    {
      "type": "loop-value",
      "attrs": {
        "original": "[LoopValue:title.1]",
        "value": "title",
        "index": "1"
      }
    }
  ]
}
```

## Email RFM syntax

Loop values are written as leaf directives using `::loop-value{…}`:

```
Product: ::loop-value{original="[LoopValue:title.1]" value="title" index="1"}
```

Always set `original` to `"[LoopValue:<value>.<index>]"`. A token without the `.<index>` suffix (for example `[LoopValue:title]`) is not substituted and appears literally in the sent email. `email.createLoopValue` and `createLoopValueNode` build the correct form.
