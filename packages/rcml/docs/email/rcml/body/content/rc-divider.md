# `<rc-divider>`

Horizontal rule rendered as a thin border line. Visually separates sections of content.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `align` | `center` | `left` \| `center` \| `right` | `center` | Horizontal alignment of the divider line. |
| `border-color` | `#000000` | CSS color value | `#dddddd` | Colour of the divider line. |
| `border-style` | `solid` | `solid` \| `dashed` \| `dotted` | `dashed` | CSS border-style of the divider. |
| `border-width` | `1px` | Pixel value | `2px` | Thickness of the divider line. |
| `container-background-color` | — | CSS color value | `#f9f9f9` | Background colour of the containing table cell. |
| `css-class` | — | String | `section-divider` | HTML class names on the rendered element. |
| `padding` | `20px 0` | px, 1–4 values | `32px 0` | Space above and below the divider. |
| `padding-top` | — | px or percentage | `32px` | Top padding. |
| `padding-bottom` | — | px or percentage | `32px` | Bottom padding. |
| `padding-left` | — | px or percentage | `0` | Left padding. |
| `padding-right` | — | px or percentage | `0` | Right padding. |
| `padding-on-mobile` | — | px, 1–4 values | `16px 0` | Padding override applied only on mobile viewports. |
| `width` | `100%` | px or percentage | `80%` | Width of the divider line. |

## Children

None.

## Parents

- [`<rc-column>`](../layout/rc-column.md)

## JSON

```json
{
  "tagName": "rc-divider",
  "attributes": {
    "border-color": "#dddddd",
    "border-width": "1px",
    "padding": "32px 0"
  }
}
```

## XML

```xml
<rc-divider border-color="#dddddd" border-width="1px" padding="32px 0"></rc-divider>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createDividerElement } from '@rule/rcml';

createDividerElement({
  attrs: { 'border-color': '#dddddd', 'border-width': '1px', padding: '32px 0' },
})
```

## API Reference

- [createDividerElement](/api/rcml/src/functions/createDividerElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
