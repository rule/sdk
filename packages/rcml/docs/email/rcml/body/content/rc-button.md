# `<rc-button>`

Clickable call-to-action button. The label is set via inline rich-text content. Renders as a styled anchor tag inside a table cell.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `align` | `center` | `left` \| `center` \| `right` | `center` | Horizontal alignment of the button within its cell. |
| `background-color` | — | CSS color value | `#1a1a2e` | Background fill colour of the button. |
| `border` | `none` | CSS border shorthand | `2px solid #000000` | Border applied to all four sides of the button. |
| `border-bottom` | — | CSS border shorthand | `2px solid #000000` | Bottom border only. |
| `border-left` | — | CSS border shorthand | `2px solid #000000` | Left border only. |
| `border-right` | — | CSS border shorthand | `2px solid #000000` | Right border only. |
| `border-top` | — | CSS border shorthand | `2px solid #000000` | Top border only. |
| `border-radius` | `8px` | px or %, 1–4 values | `8px` | Rounded corners. |
| `color` | — | CSS color value | `#ffffff` | Label text colour. |
| `container-background-color` | — | CSS color value | `#f9f9f9` | Background colour of the containing table cell. |
| `css-class` | — | String | `cta-button` | HTML class names for custom CSS targeting. |
| `rc-class` | — | String | `btn-primary` | Space-separated names of [`<rc-class>`](../../head/rc-class.md) elements whose styles are inherited. |
| `font-family` | — | String | `'Helvetica, sans-serif'` | Font family of the button label. |
| `font-size` | — | Pixel value | `14px` | Font size of the button label. |
| `font-style` | — | `normal` \| `italic` \| `oblique` | `normal` | CSS font-style for the label. |
| `font-weight` | — | `100`–`900` | `700` | Font weight of the label. |
| `height` | — | px or percentage | `48px` | Fixed height of the button. |
| `href` | — | URL or `[Link:<type>]` | `https://example.com/shop` | Destination URL. Use `[Link:<type>]` for system-managed links. May contain placeholder tokens. |
| `inner-padding` | `10px 16px` | px, 1–4 values | `12px 24px` | Padding inside the button between its border and label text. |
| `letter-spacing` | — | px or em, negatives allowed | `0.5px` | Character spacing of the label. |
| `line-height` | — | px or percentage | `100%` | Line height of the label text. |
| `name` | — | String | `shop-now-button` | Tracking name used in analytics and link tracking. |
| `padding` | `0 0 20px 0` | px, 1–4 values | `0 0 20px 0` | Outer padding around the button cell. |
| `padding-top` | — | px or percentage | `10px` | Top outer padding. |
| `padding-bottom` | — | px or percentage | `20px` | Bottom outer padding. |
| `padding-left` | — | px or percentage | `16px` | Left outer padding. |
| `padding-right` | — | px or percentage | `16px` | Right outer padding. |
| `padding-on-mobile` | — | px, 1–4 values | `0 0 16px 0` | Outer padding override on mobile. |
| `rel` | — | String | `noopener noreferrer` | HTML `rel` attribute on the anchor tag (e.g. `noopener`). |
| `target` | — | `_blank` \| `_self` \| `_parent` \| `_top` | `_blank` | HTML anchor target attribute. |
| `text-align` | `center` | `left` \| `center` \| `right` | `center` | Alignment of the label text inside the button. |
| `text-decoration` | — | `none` \| `underline` \| `overline` \| `line-through` | `none` | CSS text-decoration for the label. |
| `text-transform` | — | `capitalize` \| `uppercase` \| `lowercase` | `uppercase` | CSS text-transform for the label. |
| `title` | — | String | `Visit our store` | HTML `title` attribute — tooltip shown on hover. |
| `vertical-align` | `middle` | `top` \| `middle` \| `bottom` | `middle` | Vertical alignment of the button within its cell. |
| `width` | — | px or percentage | `200px` | Fixed width of the button. When omitted, the button sizes to its label. |

## Children

None. Content is an inline rich-text label set via the `content` field. See [Content types](/packages/rcml/email/content/flavors).

## Parents

- [`<rc-column>`](../layout/rc-column.md)

## JSON

```json
{
  "tagName": "rc-button",
  "attributes": {
    "background-color": "#1a1a2e",
    "color": "#ffffff",
    "border-radius": "8px",
    "href": "https://example.com/shop"
  },
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Shop now" }]
      }
    ]
  }
}
```

## XML

```xml
<rc-button background-color="#1a1a2e" color="#ffffff" border-radius="8px" href="https://example.com/shop">Shop now</rc-button>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createButtonElement } from '@rule/rcml';

createButtonElement({
  attrs: {
    'background-color': '#1a1a2e',
    color: '#ffffff',
    'border-radius': '8px',
    href: 'https://example.com/shop',
  },
  content: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Shop now' }] }],
  },
})
```

## API Reference

- [createButtonElement](/api/rcml/src/functions/createButtonElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
