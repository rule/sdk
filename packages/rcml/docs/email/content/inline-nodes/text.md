# `text`

A leaf inline node that carries a string of text with optional styling and link marks applied.

## Attributes

None. The text content is held in the `text` field, not in `attrs`.

## Fields

| Field | Required | Description |
|-------|----------|-------------|
| `text` | Yes | The raw text string. Must be non-empty. |
| `marks` | No | Array of [`font`](../marks/font) or [`link`](../marks/link) marks. Omit entirely when no marks are applied — do not set to `[]`. |

## Children

None (leaf node).

## Parent nodes

- `paragraph`

## Available in

- Full Email RFM (`rc-text`, `rc-heading`)
- Email Inline RFM (`rc-button`)

## JSON

Plain text with no marks:

```json
{ "type": "text", "text": "Hello world" }
```

Bold text using a `font` mark:

```json
{
  "type": "text",
  "text": "Bold",
  "marks": [{ "type": "font", "attrs": { "font-weight": "bold" } }]
}
```

Linked text using a `link` mark wrapping a `font` mark:

```json
{
  "type": "text",
  "text": "click here",
  "marks": [
    { "type": "link", "attrs": { "href": "https://example.com", "target": "_blank", "no-tracked": "false" } },
    { "type": "font", "attrs": { "color": "#2e5bff", "text-decoration": "underline" } }
  ]
}
```

## Email RFM syntax

Plain text is written as-is. Styled text uses the `:font[…]{…}` span directive; linked text uses the `:link[…]{…}` directive.

```
Plain text.

:font[bold text]{font-weight="bold"}

:link[:font[click here]{color="#2e5bff" text-decoration="underline"}]{href="https://example.com"}
```
