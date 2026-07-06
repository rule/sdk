# `<rc-image>`

Responsive image block with optional link wrapping. Renders an `<img>` tag inside a table cell.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `align` | `center` | `left` \| `center` \| `right` | `center` | Horizontal alignment of the image within its cell. |
| `align-on-mobile` | — | `left` \| `center` \| `right` | `left` | Horizontal alignment override on mobile. |
| `alt` | `""` | String | `Summer sale banner` | Alt text for accessibility and clients that block images. |
| `border` | — | CSS border shorthand | `1px solid #cccccc` | Border applied around the image. |
| `border-bottom` | — | CSS border shorthand | `2px solid #000000` | Bottom border only. |
| `border-left` | — | CSS border shorthand | `1px solid #cccccc` | Left border only. |
| `border-right` | — | CSS border shorthand | `1px solid #cccccc` | Right border only. |
| `border-top` | — | CSS border shorthand | `2px solid #000000` | Top border only. |
| `border-radius` | — | px or %, 1–4 values | `8px` | Rounded corners on the image. |
| `container-background-color` | — | CSS color value | `#f9f9f9` | Background colour of the containing table cell. |
| `css-class` | — | String | `promo-image` | HTML class names on the rendered element. |
| `fluid-on-mobile` | — | `true` \| `false` | `true` | When `true`, the image stretches to full width on mobile. |
| `font-size` | `14px` | Pixel value | `14px` | Font size used for the alt-text fallback display. |
| `height` | `auto` | Pixel value or `auto` | `auto` | Image height. Use `auto` to maintain aspect ratio. |
| `href` | — | URL or `[Link:<type>]` | `https://example.com/sale` | URL to navigate to when the image is clicked. Use `[Link:<type>]` for system-managed links. May contain placeholder tokens. |
| `max-height` | — | px or percentage | `400px` | Maximum image height. |
| `name` | — | String | `promo-banner` | Tracking name for analytics. |
| `padding` | `0 0 20px` | px, 1–4 values | `0 0 20px` | Outer padding around the image cell. |
| `padding-top` | — | px or percentage | `10px` | Top outer padding. |
| `padding-bottom` | — | px or percentage | `20px` | Bottom outer padding. |
| `padding-left` | — | px or percentage | `0` | Left outer padding. |
| `padding-right` | — | px or percentage | `0` | Right outer padding. |
| `padding-on-mobile` | — | px, 1–4 values | `0 0 16px` | Padding override on mobile. |
| `rel` | — | String | `noopener noreferrer` | HTML `rel` attribute on the wrapping anchor. |
| `src` | — | URL | `https://cdn.example.com/promo.jpg` | URL of the image file. |
| `target` | `_blank` | `_blank` \| `_self` \| `_parent` \| `_top` | `_blank` | HTML anchor target when `href` is set. |
| `title` | — | String | `Shop the summer sale` | HTML `title` attribute — tooltip on hover. |
| `width` | — | Pixel value | `600px` | Rendered image width in pixels. Omit to use natural width. |

## Children

None.

## Parents

- [`<rc-column>`](../layout/rc-column.md)

## JSON

```json
{
  "tagName": "rc-image",
  "attributes": {
    "src": "https://cdn.example.com/promo.jpg",
    "alt": "Summer sale",
    "width": "600px",
    "href": "https://example.com/sale"
  }
}
```

## XML

```xml
<rc-image src="https://cdn.example.com/promo.jpg" alt="Summer sale" width="600px" href="https://example.com/sale"></rc-image>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createImageElement } from '@rule/rcml';

createImageElement({
  attrs: {
    src: 'https://cdn.example.com/promo.jpg',
    alt: 'Summer sale',
    width: '600px',
    href: 'https://example.com/sale',
  },
})
```

## API Reference

- [createImageElement](/api/rcml/src/functions/createImageElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
