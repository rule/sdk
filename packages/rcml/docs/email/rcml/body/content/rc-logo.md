# `<rc-logo>`

Brand logo image. Functionally identical to `<rc-image>` but semantically distinct — the editor treats it as the document logo and it can inherit brand styles via `rc-class`.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `align` | `center` | `left` \| `center` \| `right` | `left` | Horizontal alignment of the logo. |
| `align-on-mobile` | — | `left` \| `center` \| `right` | `center` | Alignment override on mobile. |
| `alt` | `""` | String | `Acme Inc. logo` | Alt text for the logo image. |
| `border` | — | CSS border shorthand | `none` | Border around the logo. |
| `border-bottom` | — | CSS border shorthand | `1px solid #eeeeee` | Bottom border only. |
| `border-left` | — | CSS border shorthand | `1px solid #eeeeee` | Left border only. |
| `border-right` | — | CSS border shorthand | `1px solid #eeeeee` | Right border only. |
| `border-top` | — | CSS border shorthand | `1px solid #eeeeee` | Top border only. |
| `border-radius` | — | px or %, 1–4 values | `4px` | Rounded corners on the logo. |
| `container-background-color` | — | CSS color value | `#ffffff` | Background colour of the containing cell. |
| `css-class` | — | String | `brand-logo` | HTML class names for custom targeting. |
| `rc-class` | — | String | `logo-style` | Space-separated names of [`<rc-class>`](../../head/rc-class.md) elements whose styles are inherited. |
| `fluid-on-mobile` | — | `true` \| `false` | `true` | When `true`, the logo stretches to full width on mobile. |
| `font-size` | `14px` | Pixel value | `14px` | Font size for the alt-text fallback display. |
| `height` | `auto` | Pixel value or `auto` | `auto` | Logo height. Defaults to `auto` to maintain aspect ratio. |
| `href` | — | URL or `[Link:<type>]` | `https://example.com` | URL to navigate to when the logo is clicked. Use `[Link:<type>]` for system-managed links. May contain placeholder tokens. |
| `max-height` | — | px or percentage | `80px` | Maximum logo height. |
| `name` | — | String | `logo` | Tracking name. |
| `padding` | `0 0 20px` | px, 1–4 values | `0 0 20px` | Outer padding around the logo cell. |
| `padding-top` | — | px or percentage | `10px` | Top outer padding. |
| `padding-bottom` | — | px or percentage | `20px` | Bottom outer padding. |
| `padding-left` | — | px or percentage | `0` | Left outer padding. |
| `padding-right` | — | px or percentage | `0` | Right outer padding. |
| `padding-on-mobile` | — | px, 1–4 values | `0 0 16px` | Padding override on mobile. |
| `rel` | — | String | `noopener noreferrer` | HTML `rel` attribute on the anchor. |
| `src` | — | URL | `https://cdn.example.com/logo.png` | URL of the logo image file. |
| `target` | `_blank` | `_blank` \| `_self` \| `_parent` \| `_top` | `_blank` | HTML anchor target when `href` is set. |
| `title` | — | String | `Go to homepage` | Tooltip on hover. |
| `width` | `96px` | Pixel value | `120px` | Logo width in pixels. |

## Children

None.

## Parents

- [`<rc-column>`](../layout/rc-column.md)

## JSON

```json
{
  "tagName": "rc-logo",
  "attributes": {
    "src": "https://cdn.example.com/logo.png",
    "alt": "Acme Inc.",
    "width": "120px",
    "href": "https://example.com"
  }
}
```

## XML

```xml
<rc-logo src="https://cdn.example.com/logo.png" alt="Acme Inc." width="120px" href="https://example.com"></rc-logo>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createLogoElement } from '@rule/rcml';

createLogoElement({
  attrs: {
    src: 'https://cdn.example.com/logo.png',
    alt: 'Acme Inc.',
    width: '120px',
    href: 'https://example.com',
  },
})
```

## API Reference

- [createLogoElement](/api/rcml/src/functions/createLogoElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
