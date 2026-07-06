# `loop-value`

An inline atom that references a property from the current `rc-loop` iteration item and is replaced with its value at render time.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `original` | — | string | `"orders.item_name"` | Authoritative source token in `"value.index"` form. Used for re-parsing. |
| `value` | — | string | `"orders"` | The loop collection name (matches the `loop-value` attribute on the enclosing `rc-loop`). |
| `index` | — | string | `"item_name"` | The property name on the iteration item to render. |

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
    "original": "orders.item_name",
    "value": "orders",
    "index": "item_name"
  }
}
```

In context — a `paragraph` inside an `rc-loop` that renders each order's item name:

```json
{
  "type": "paragraph",
  "content": [
    { "type": "text", "text": "Product: " },
    {
      "type": "loop-value",
      "attrs": {
        "original": "orders.item_name",
        "value": "orders",
        "index": "item_name"
      }
    }
  ]
}
```

## Email RFM syntax

Loop values are written as leaf directives using `::loop-value{…}`:

```
Product: ::loop-value{original="orders.item_name" value="orders" index="item_name"}
```

The `original` attribute is the canonical identifier — the parser uses it on re-parse to reconstruct `value` and `index`. Always set `original` to `"<value>.<index>"`.
