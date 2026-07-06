# `<rc-heading>`

Heading block with h1–h6 semantics set inside the rich-text content. Supports the same full content model as `<rc-text>`. Renders as a visually prominent HTML table cell.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `align` | `left` | `left` \| `center` \| `right` | `center` | Horizontal text alignment. |
| `background-color` | — | CSS color value | `#f5f5f5` | Background colour of the heading cell. |
| `color` | — | CSS color value | `#1a1a2e` | Heading text colour. |
| `container-background-color` | — | CSS color value | `#f9f9f9` | Background colour of the containing table cell. |
| `css-class` | — | String | `section-title` | HTML class names applied to the rendered element. |
| `rc-class` | — | String | `heading-style` | Space-separated names of [`<rc-class>`](../../head/rc-class.md) elements whose styles are inherited. |
| `font-family` | — | String | `'Georgia, serif'` | Font family for the heading. |
| `font-size` | — | Pixel value | `32px` | Font size in pixels. |
| `font-style` | — | `normal` \| `italic` \| `oblique` | `italic` | CSS font-style keyword. |
| `font-weight` | — | `100`–`900` | `700` | Numeric font weight. |
| `height` | — | px or percentage | `80px` | Fixed cell height. |
| `letter-spacing` | — | px or em, negatives allowed | `1px` | Space between characters. |
| `line-height` | — | px or percentage | `120%` | Line height. |
| `padding` | `0 0 20px 0` | px, 1–4 values | `0 0 20px 0` | Space around the heading block. |
| `padding-top` | — | px or percentage | `10px` | Top padding. |
| `padding-bottom` | — | px or percentage | `20px` | Bottom padding. |
| `padding-left` | — | px or percentage | `16px` | Left padding. |
| `padding-right` | — | px or percentage | `16px` | Right padding. |
| `padding-on-mobile` | — | px, 1–4 values | `0 0 16px 0` | Padding override applied only on mobile viewports. |
| `text-decoration` | — | `none` \| `underline` \| `overline` \| `line-through` | `underline` | CSS text-decoration keyword. |
| `text-transform` | — | `capitalize` \| `uppercase` \| `lowercase` | `uppercase` | CSS text-transform keyword. |
| `vertical-align` | — | `top` \| `middle` \| `bottom` | `middle` | Vertical alignment within the cell. |

## Children

None. Content is a rich-text document set via the `content` field. See [Content types](/packages/rcml/email/content/flavors).

## Parents

- [`<rc-column>`](../layout/rc-column.md)

## JSON

```json
{
  "tagName": "rc-heading",
  "attributes": { "color": "#1a1a2e", "font-size": "32px", "font-weight": "700" },
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Welcome back" }]
      }
    ]
  }
}
```

## XML

```xml
<rc-heading color="#1a1a2e" font-size="32px" font-weight="700">Welcome back</rc-heading>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createHeadingElement } from '@rule/rcml';

createHeadingElement({
  attrs: { color: '#1a1a2e', 'font-size': '32px', 'font-weight': '700' },
  content: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Welcome back' }] }],
  },
})
```

## API Reference

- [createHeadingElement](/api/rcml/src/functions/createHeadingElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
