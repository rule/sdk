# `<rc-section>`

Full-width horizontal band that holds one or more columns. The primary layout row of an email — every visible content block lives inside a section.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `background-color` | — | CSS color value | `#f5f5f5` | Solid background colour for the section. |
| `background-url` | — | URL | `https://cdn.example.com/bg.jpg` | URL of a background image displayed behind the section content. |
| `background-repeat` | `repeat` | `repeat` \| `no-repeat` \| `repeat-x` \| `repeat-y` | `no-repeat` | CSS background-repeat behaviour. |
| `background-size` | `auto` | CSS background-size value | `cover` | CSS background-size — keyword or dimension values. |
| `background-position` | `top center` | Two space-separated values | `top center` | CSS background-position. |
| `background-position-x` | — | CSS background-position-x value | `left` | Horizontal background position, overrides `background-position`. |
| `background-position-y` | — | CSS background-position-y value | `top` | Vertical background position, overrides `background-position`. |
| `border` | `none` | CSS border shorthand | `1px solid #cccccc` | Border applied to all four sides of the section. |
| `border-bottom` | — | CSS border shorthand | `2px solid #000000` | Bottom border only. |
| `border-left` | — | CSS border shorthand | `1px dashed #cccccc` | Left border only. |
| `border-right` | — | CSS border shorthand | `1px dashed #cccccc` | Right border only. |
| `border-top` | — | CSS border shorthand | `2px solid #000000` | Top border only. |
| `border-radius` | — | px or %, 1–4 values | `8px` | Rounded corners on the section. |
| `css-class` | — | String | `hero-section` | HTML class names applied to the rendered element. |
| `direction` | `ltr` | `ltr` \| `rtl` | `rtl` | Text and layout direction for the section. |
| `full-width` | — | `full-width` \| `false` | `full-width` | Makes the section bleed edge-to-edge beyond the body width. |
| `hide` | — | `desktop` \| `mobile` | `mobile` | Hides the section on the specified device type. |
| `padding` | `20px 0` | px, 1–4 values | `40px 0` | Space between the section border and its columns. |
| `padding-top` | — | Pixel value | `40px` | Top padding. Overrides the top value of `padding`. |
| `padding-bottom` | — | Pixel value | `40px` | Bottom padding. |
| `padding-left` | — | Pixel value | `20px` | Left padding. |
| `padding-right` | — | Pixel value | `20px` | Right padding. |
| `padding-on-mobile` | — | px, 1–4 values | `20px 0` | Padding override applied only on mobile viewports. |
| `text-align` | `center` | `left` \| `center` \| `right` | `left` | Default text alignment inherited by inline content. |
| `text-padding` | `4px 4px 4px 0` | px, 1–4 values | `4px 8px 4px 0` | Padding applied around inline text nodes within the section. |

## Children

| Element | Cardinality | Description |
|---------|-------------|-------------|
| [`<rc-column>`](./rc-column.md) | 1–20 | Vertical content cell. |

## Parents

- [`<rc-body>`](../../root/rc-body.md)
- [`<rc-wrapper>`](./rc-wrapper.md)
- [`<rc-case>`](../control-flow/rc-case.md)
- [`<rc-loop>`](../control-flow/rc-loop.md)

## JSON

```json
{
  "tagName": "rc-section",
  "attributes": {
    "background-color": "#ffffff",
    "padding": "40px 0"
  },
  "children": [
    { "tagName": "rc-column", "children": [] }
  ]
}
```

## XML

```xml
<rc-section background-color="#ffffff" padding="40px 0">
  <rc-column>...</rc-column>
</rc-section>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createSectionElement, createColumnElement } from '@rule/rcml';

createSectionElement({
  attrs: { 'background-color': '#ffffff', padding: '40px 0' },
  children: [createColumnElement({ children: [] })],
})
```

## API Reference

- [createSectionElement](/api/rcml/src/functions/createSectionElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
