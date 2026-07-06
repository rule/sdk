# `font`

A mark that applies typographic styling to a [`text`](../inline-nodes/text) node. All attributes are optional — set only the ones you need. At least one attribute must be present; a bare `font` mark with no attributes is invalid.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `font-family` | `null` | CSS font-family string | `"Arial, sans-serif"` | The font face. |
| `font-size` | `null` | CSS length | `"14px"` | The font size. |
| `line-height` | `null` | CSS line-height value | `"1.5"` | Line spacing. |
| `letter-spacing` | `null` | CSS length | `"0.05em"` | Character spacing. |
| `font-style` | `null` | `"normal"` \| `"italic"` | `"italic"` | Italic toggle. |
| `font-weight` | `null` | CSS font-weight or `"bold"` | `"bold"` | Bold toggle. |
| `text-decoration` | `null` | `"none"` \| `"underline"` \| `"line-through"` | `"underline"` | Underline or strikethrough. |
| `color` | `null` | CSS color value | `"#e74c3c"` | Text colour. |

## Applies to

- [`text`](../inline-nodes/text)

## Available in

- Full Email RFM (`rc-text`, `rc-heading`)
- Email Inline RFM (`rc-button`)

## JSON

Bold text:

```json
{
  "type": "text",
  "text": "Bold",
  "marks": [{ "type": "font", "attrs": { "font-weight": "bold" } }]
}
```

Bold, italic, and coloured text — multiple attributes on one mark:

```json
{
  "type": "text",
  "text": "Styled",
  "marks": [
    {
      "type": "font",
      "attrs": {
        "font-weight": "bold",
        "font-style": "italic",
        "color": "#e74c3c"
      }
    }
  ]
}
```

The Email RFM converter emits `null` for every unset attribute. Programmatically constructed JSON may omit unset attributes instead.

## Email RFM syntax

Use the `:font[text]{…}` span directive. Include only the attributes you want to set.

```
:font[bold text]{font-weight="bold"}

:font[italic text]{font-style="italic"}

:font[bold and italic]{font-weight="bold" font-style="italic"}

:font[coloured]{color="#e74c3c"}

:font[underlined]{text-decoration="underline"}

:font[custom font]{font-family="Georgia, serif" font-size="18px"}
```
