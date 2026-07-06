# `<rc-wrapper>`

Groups multiple sections under a shared background image or colour. Use for hero areas or themed bands that span several layout rows.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `background-color` | — | CSS color value | `#f5f5f5` | Solid background colour applied to all wrapped sections. |
| `background-url` | — | URL | `https://cdn.example.com/bg.jpg` | URL of a background image displayed behind all wrapped sections. |
| `background-repeat` | `repeat` | `repeat` \| `no-repeat` \| `repeat-x` \| `repeat-y` | `no-repeat` | CSS background-repeat behaviour. |
| `background-size` | `auto` | CSS background-size value | `cover` | CSS background-size — keyword or dimension values. |
| `background-position` | `top center` | Two space-separated values | `top center` | CSS background-position. |
| `background-position-x` | — | CSS background-position-x value | `left` | Horizontal background position, overrides `background-position`. |
| `background-position-y` | — | CSS background-position-y value | `top` | Vertical background position, overrides `background-position`. |
| `border` | `none` | CSS border shorthand | `1px solid #cccccc` | Border applied around the entire wrapper. |
| `border-bottom` | — | CSS border shorthand | `2px solid #000000` | Bottom border only. |
| `border-left` | — | CSS border shorthand | `1px dashed #cccccc` | Left border only. |
| `border-right` | — | CSS border shorthand | `1px dashed #cccccc` | Right border only. |
| `border-top` | — | CSS border shorthand | `2px solid #000000` | Top border only. |
| `border-radius` | — | px or %, 1–4 values | `8px` | Rounded corners on the wrapper. |
| `full-width` | — | `full-width` \| `false` | `full-width` | Makes the wrapper bleed edge-to-edge beyond the body width. |
| `padding` | `20px 0` | px, 1–4 values | `60px 0` | Padding inside the wrapper, outside the contained sections. |
| `padding-top` | — | Pixel value | `60px` | Top padding. |
| `padding-bottom` | — | Pixel value | `60px` | Bottom padding. |
| `padding-left` | — | Pixel value | `20px` | Left padding. |
| `padding-right` | — | Pixel value | `20px` | Right padding. |
| `padding-on-mobile` | — | px, 1–4 values | `30px 0` | Padding override applied only on mobile viewports. |

## Children

| Element | Description |
|---------|-------------|
| [`<rc-section>`](./rc-section.md) | A layout row inside the wrapper. |
| [`<rc-switch>`](../control-flow/rc-switch.md) | Conditional branch rendering sections. |

## Parents

- [`<rc-body>`](../../root/rc-body.md)
- [`<rc-column>`](./rc-column.md)

## JSON

```json
{
  "tagName": "rc-wrapper",
  "attributes": {
    "background-url": "https://cdn.example.com/hero-bg.jpg",
    "background-size": "cover",
    "padding": "60px 0"
  },
  "children": [
    { "tagName": "rc-section", "children": [] }
  ]
}
```

## XML

```xml
<rc-wrapper background-url="https://cdn.example.com/hero-bg.jpg" background-size="cover" padding="60px 0">
  <rc-section>...</rc-section>
</rc-wrapper>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createWrapperElement, createSectionElement } from '@rule/rcml';

createWrapperElement({
  attrs: {
    'background-url': 'https://cdn.example.com/hero-bg.jpg',
    'background-size': 'cover',
    padding: '60px 0',
  },
  children: [createSectionElement({ children: [] })],
})
```

## API Reference

- [createWrapperElement](/api/rcml/src/functions/createWrapperElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
