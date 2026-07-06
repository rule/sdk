# `link`

A mark that wraps a [`text`](../inline-nodes/text) node in a hyperlink. The link destination, tab behaviour, and click-tracking opt-out are controlled by its three attributes.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `href` | — | URL string | `"https://example.com"` | Required. The link destination URL. |
| `target` | `null` | `"_blank"` \| null | `"_blank"` | When `"_blank"`, the link opens in a new tab. |
| `no-tracked` | `"false"` | `"true"` \| `"false"` | `"true"` | When `"true"`, click tracking is disabled for this link. |

## Applies to

- [`text`](../inline-nodes/text)

## Available in

- Full Email RFM (`rc-text`, `rc-heading`)
- Email Inline RFM (`rc-button`)

## JSON

A plain link (no extra styling on the text):

```json
{
  "type": "text",
  "text": "click here",
  "marks": [
    {
      "type": "link",
      "attrs": { "href": "https://example.com", "target": "_blank", "no-tracked": "false" }
    }
  ]
}
```

A link with a `font` mark — the typical pattern for styled anchor text:

```json
{
  "type": "text",
  "text": "click here",
  "marks": [
    {
      "type": "link",
      "attrs": { "href": "https://example.com", "target": "_blank", "no-tracked": "false" }
    },
    {
      "type": "font",
      "attrs": { "color": "#2e5bff", "text-decoration": "underline" }
    }
  ]
}
```

## Email RFM syntax

Use the `:link[…]{…}` span directive. The content between `[…]` is the linked text (which may itself contain a `:font` directive for styling).

Plain link:

```
:link[click here]{href="https://example.com" target="_blank" no-tracked="false"}
```

Link with styled anchor text (the typical pattern):

```
:link[:font[click here]{color="#2e5bff" text-decoration="underline"}]{href="https://example.com"}
```

Link with tracking disabled:

```
:link[untracked link]{href="https://example.com" no-tracked="true"}
```
