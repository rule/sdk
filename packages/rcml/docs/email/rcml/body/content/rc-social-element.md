# `<rc-social-element>`

A single social media profile link inside an `<rc-social>` container. Displays a platform icon with an optional text label.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `align` | `left` | `left` \| `center` \| `right` | `center` | Alignment of this element within the row. |
| `alt` | `""` | String | `Follow us on Twitter` | Alt text for the platform icon. |
| `background-color` | — | CSS color value | `#1da1f2` | Background fill behind the icon (for circle/square shapes). |
| `border-radius` | `3px` | px or %, 1–4 values | `50%` | Border-radius of the icon container shape. |
| `color` | `#333333` | CSS color value | `#333333` | Text colour for the link label. |
| `font-family` | `Helvetica, sans-serif` | String | `'Helvetica, sans-serif'` | Font family for the link label. |
| `font-size` | `13px` | Pixel value | `13px` | Font size for the link label. |
| `font-style` | — | `normal` \| `italic` \| `oblique` | `normal` | Font style for the label. |
| `font-weight` | `400` | `100`–`900` | `400` | Font weight for the label. |
| `href` | — | URL | `https://twitter.com/example` | URL of the social profile page. May contain placeholder tokens. |
| `icon-color` | `brand` | `brand` \| `black` \| `white` | `white` | Icon colour theme. `brand` uses the platform's official colour. |
| `icon-height` | — | px or percentage | `24px` | Icon height when different from `icon-size`. |
| `icon-padding` | — | px, 1–4 values | `4px` | Padding around the icon. |
| `icon-shape` | `original` | `original` \| `circle` \| `square` | `circle` | Shape of the icon container. |
| `icon-size` | — | px or percentage | `24px` | Icon size. Overrides the parent `<rc-social>` `icon-size`. |
| `line-height` | `120%` | px or percentage | `120%` | Line height for the link label. |
| `name` | — | String | `Twitter` | Platform display label (e.g. `"Twitter"`, `"Instagram"`). |
| `padding` | `4px` | px, 1–4 values | `4px 8px` | Padding around the entire element. |
| `padding-top` | — | px or percentage | `4px` | Top padding. |
| `padding-bottom` | — | px or percentage | `4px` | Bottom padding. |
| `padding-left` | — | px or percentage | `8px` | Left padding. |
| `padding-right` | — | px or percentage | `8px` | Right padding. |
| `rel` | — | String | `noopener noreferrer` | HTML `rel` attribute on the anchor. |
| `src` | — | URL | `https://cdn.example.com/twitter-icon.png` | URL of a custom icon image. When omitted, the built-in platform icon is used. |
| `target` | `_blank` | `_blank` \| `_self` \| `_parent` \| `_top` | `_blank` | HTML anchor target. |
| `text-decoration` | `none` | `none` \| `underline` \| `overline` \| `line-through` | `none` | Text decoration for the label. |
| `text-padding` | `4px 4px 4px 0` | px, 1–4 values | `4px 4px 4px 0` | Padding around the label text. |
| `title` | — | String | `Follow us on Twitter` | Tooltip on hover. |
| `vertical-align` | `middle` | `top` \| `middle` \| `bottom` | `middle` | Vertical alignment within the row. |

## Children

None.

## Parents

- [`<rc-social>`](./rc-social.md)

## JSON

```json
{
  "tagName": "rc-social-element",
  "attributes": {
    "name": "Instagram",
    "href": "https://instagram.com/example",
    "icon-color": "brand",
    "icon-shape": "circle",
    "icon-size": "24px"
  }
}
```

## XML

```xml
<rc-social-element name="Instagram" href="https://instagram.com/example" icon-color="brand" icon-shape="circle" icon-size="24px"></rc-social-element>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createSocialChildElement } from '@rule/rcml';

createSocialChildElement({
  attrs: {
    name: 'Instagram',
    href: 'https://instagram.com/example',
    'icon-color': 'brand',
    'icon-shape': 'circle',
    'icon-size': '24px',
  },
})
```

## API Reference

- [createSocialChildElement](/api/rcml/src/functions/createSocialChildElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
