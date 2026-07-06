# `<rc-social>`

Social media links container. Holds `<rc-social-element>` children representing individual platform links, arranged horizontally or vertically.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `align` | `center` | `left` \| `center` \| `right` | `center` | Horizontal alignment of the social links group. |
| `border-radius` | `3px` | px or %, 1–4 values | `50%` | Default border-radius applied to all social icons. |
| `color` | `#333333` | CSS color value | `#333333` | Default text colour for social link labels. |
| `container-background-color` | — | CSS color value | `#f9f9f9` | Background colour of the containing cell. |
| `css-class` | — | String | `social-links` | HTML class names on the rendered element. |
| `font-family` | `Helvetica, sans-serif` | String | `'Helvetica, sans-serif'` | Font family for social link labels. |
| `font-size` | `13px` | Pixel value | `13px` | Font size for social link labels. |
| `font-style` | — | `normal` \| `italic` \| `oblique` | `normal` | Font style for labels. |
| `font-weight` | `400` | `100`–`900` | `400` | Font weight for labels. |
| `icon-size` | `20px` | px or percentage | `24px` | Default icon size applied to all social elements. |
| `icon-height` | — | px or percentage | `24px` | Default icon height when different from `icon-size`. |
| `icon-padding` | — | px, 1–4 values | `4px` | Default padding around each social icon. |
| `inner-padding` | `4px` | px, 1–4 values | `4px 8px` | Padding between icon and label text. |
| `line-height` | `120%` | px or percentage | `120%` | Line height for social link labels. |
| `mode` | `horizontal` | `horizontal` \| `vertical` | `vertical` | Layout direction for the social links. |
| `padding` | `0 0 20px 0` | px, 1–4 values | `0 0 20px 0` | Outer padding around the social block. |
| `padding-top` | — | px or percentage | `10px` | Top outer padding. |
| `padding-bottom` | — | px or percentage | `20px` | Bottom outer padding. |
| `padding-left` | — | px or percentage | `0` | Left outer padding. |
| `padding-right` | — | px or percentage | `0` | Right outer padding. |
| `padding-on-mobile` | — | px, 1–4 values | `0 0 16px 0` | Padding override on mobile. |
| `table-layout` | — | `auto` \| `fixed` | `fixed` | CSS table-layout for the icons table. |
| `text-decoration` | `none` | `none` \| `underline` \| `overline` \| `line-through` | `none` | Text decoration for social link labels. |
| `text-padding` | — | px, 1–4 values | `4px 4px 4px 0` | Padding around each social link label text. |
| `vertical-align` | — | `top` \| `middle` \| `bottom` | `middle` | Vertical alignment of the icons within the row. |

## Children

| Element | Description |
|---------|-------------|
| [`<rc-social-element>`](./rc-social-element.md) | A single social media profile link. |

## Parents

- [`<rc-column>`](../layout/rc-column.md)

## JSON

```json
{
  "tagName": "rc-social",
  "attributes": { "mode": "horizontal", "align": "center" },
  "children": [
    {
      "tagName": "rc-social-element",
      "attributes": {
        "name": "Twitter",
        "href": "https://twitter.com/example",
        "icon-color": "brand"
      }
    }
  ]
}
```

## XML

```xml
<rc-social mode="horizontal" align="center">
  <rc-social-element name="Twitter" href="https://twitter.com/example" icon-color="brand"></rc-social-element>
</rc-social>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createSocialElement, createSocialChildElement } from '@rule/rcml';

createSocialElement({
  attrs: { mode: 'horizontal', align: 'center' },
  children: [
    createSocialChildElement({
      attrs: { name: 'Twitter', href: 'https://twitter.com/example', 'icon-color': 'brand' },
    }),
  ],
})
```

## API Reference

- [createSocialElement](/api/rcml/src/functions/createSocialElement)
- [createSocialChildElement](/api/rcml/src/functions/createSocialChildElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
