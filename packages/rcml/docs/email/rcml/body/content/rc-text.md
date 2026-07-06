# `<rc-text>`

Rich-text paragraph block. Supports paragraphs, bullet and ordered lists, alignment, inline marks (bold, italic, colour, links), and dynamic placeholders. Renders as an HTML table cell.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `align` | `left` | `left` \| `center` \| `right` | `center` | Horizontal text alignment. |
| `color` | — | CSS color value | `#333333` | Default text colour for the block. |
| `container-background-color` | — | CSS color value | `#f9f9f9` | Background colour of the containing table cell. |
| `css-class` | — | String | `body-text` | HTML class names applied to the rendered element. |
| `rc-class` | — | String | `heading-style` | Space-separated names of [`<rc-class>`](../../head/rc-class.md) elements whose styles are inherited. |
| `font-family` | — | String | `'Georgia, serif'` | Default font family for the text block. |
| `font-size` | — | Pixel value | `16px` | Default font size in pixels. |
| `font-style` | — | `normal` \| `italic` \| `oblique` | `italic` | CSS font-style keyword. |
| `font-weight` | — | `100`–`900` | `700` | Numeric font weight. |
| `height` | — | px or percentage | `200px` | Fixed height of the text cell. |
| `letter-spacing` | — | px or em, negatives allowed | `0.5px` | Space between characters. |
| `line-height` | — | px or percentage | `150%` | Line height of the text. |
| `padding` | `0 0 20px 0` | px, 1–4 values | `0 0 20px 0` | Space around the text block. |
| `padding-top` | — | px or percentage | `10px` | Top padding. |
| `padding-bottom` | — | px or percentage | `20px` | Bottom padding. |
| `padding-left` | — | px or percentage | `16px` | Left padding. |
| `padding-right` | — | px or percentage | `16px` | Right padding. |
| `padding-on-mobile` | — | px, 1–4 values | `0 0 16px 0` | Padding override applied only on mobile viewports. |
| `text-decoration` | — | `none` \| `underline` \| `overline` \| `line-through` | `underline` | CSS text-decoration keyword. |
| `text-transform` | — | `capitalize` \| `uppercase` \| `lowercase` | `uppercase` | CSS text-transform keyword. |
| `vertical-align` | — | `top` \| `middle` \| `bottom` | `middle` | Vertical alignment of the text within its cell. |

## Children

None. Content is a rich-text document set via the `content` field. See [Content types](/packages/rcml/email/content/flavors).

## Parents

- [`<rc-column>`](../layout/rc-column.md)

## JSON

```json
{
  "tagName": "rc-text",
  "attributes": { "color": "#333333", "font-size": "16px" },
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Hello world" }]
      }
    ]
  }
}
```

## XML

```xml
<rc-text color="#333333" font-size="16px">Hello world</rc-text>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createTextElement } from '@rule/rcml';

createTextElement({
  attrs: { color: '#333333', 'font-size': '16px' },
  content: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }],
  },
})
```

## API Reference

- [createTextElement](/api/rcml/src/functions/createTextElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
