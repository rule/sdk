# `<rc-column>`

Vertical content cell inside a section. Columns share the available width equally by default, or can be set to explicit widths — all visible content elements live inside columns.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `background-color` | — | CSS color value | `#f5f5f5` | Background colour for the column. |
| `border` | — | CSS border shorthand | `1px solid #cccccc` | Border applied to all four sides of the column. |
| `border-bottom` | — | CSS border shorthand | `2px solid #000000` | Bottom border only. |
| `border-left` | — | CSS border shorthand | `1px dashed #cccccc` | Left border only. |
| `border-right` | — | CSS border shorthand | `1px dashed #cccccc` | Right border only. |
| `border-top` | — | CSS border shorthand | `2px solid #000000` | Top border only. |
| `border-radius` | — | px or %, 1–4 values | `8px` | Rounded corners on the column. |
| `css-class` | — | String | `content-column` | HTML class names for custom CSS targeting. |
| `direction` | `ltr` | `ltr` \| `rtl` | `rtl` | Text and layout direction for content inside this column. |
| `inner-background-color` | — | CSS color value | `#ffffff` | Background colour of the inner content area, inside the column padding. |
| `inner-border` | — | CSS border shorthand | `1px solid #eeeeee` | Border applied to the inner content area on all four sides. |
| `inner-border-bottom` | — | CSS border shorthand | `1px solid #eeeeee` | Inner bottom border only. |
| `inner-border-left` | — | CSS border shorthand | `1px solid #eeeeee` | Inner left border only. |
| `inner-border-right` | — | CSS border shorthand | `1px solid #eeeeee` | Inner right border only. |
| `inner-border-top` | — | CSS border shorthand | `1px solid #eeeeee` | Inner top border only. |
| `inner-border-radius` | — | px or %, 1–4 values | `4px` | Rounded corners on the inner content area. |
| `padding` | — | px or %, 1–4 values | `0 16px` | Space between the column edge and its content. |
| `padding-top` | — | px or percentage | `20px` | Top padding. |
| `padding-bottom` | — | px or percentage | `20px` | Bottom padding. |
| `padding-left` | — | px or percentage | `16px` | Left padding. |
| `padding-right` | — | px or percentage | `16px` | Right padding. |
| `padding-on-mobile` | — | px, 1–4 values | `0 8px` | Padding override applied only on mobile viewports. |
| `vertical-align` | `top` | `top` \| `middle` \| `bottom` | `middle` | Vertical alignment of column content within the row. |
| `width` | — | px or percentage | `50%` | Column width. When omitted, columns share the section width equally. |

## Children

Any content element: [`<rc-text>`](../content/rc-text.md), [`<rc-heading>`](../content/rc-heading.md), [`<rc-button>`](../content/rc-button.md), [`<rc-image>`](../content/rc-image.md), [`<rc-logo>`](../content/rc-logo.md), [`<rc-video>`](../content/rc-video.md), [`<rc-spacer>`](../content/rc-spacer.md), [`<rc-divider>`](../content/rc-divider.md), [`<rc-social>`](../content/rc-social.md), [`<rc-loop>`](../control-flow/rc-loop.md), [`<rc-group>`](./rc-group.md), [`<rc-wrapper>`](./rc-wrapper.md), [`<rc-raw>`](../content/rc-raw.md)

## Parents

- [`<rc-section>`](./rc-section.md)
- [`<rc-group>`](./rc-group.md)

## JSON

```json
{
  "tagName": "rc-column",
  "attributes": { "padding": "0 16px", "width": "50%" },
  "children": [
    { "tagName": "rc-text", "attributes": {}, "content": { "type": "doc", "content": [] } }
  ]
}
```

## XML

```xml
<rc-column padding="0 16px" width="50%">
  <rc-text>...</rc-text>
</rc-column>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createColumnElement, createTextElement } from '@rule/rcml';

createColumnElement({
  attrs: { padding: '0 16px', width: '50%' },
  children: [
    createTextElement({
      attrs: {},
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] },
    }),
  ],
})
```

## API Reference

- [createColumnElement](/api/rcml/src/functions/createColumnElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
