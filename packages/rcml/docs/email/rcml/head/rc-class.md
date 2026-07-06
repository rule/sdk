# `<rc-class>`

Named reusable style class. Content nodes reference it via their `rc-class` attribute to inherit its styles, centralising typography and colour definitions in one place.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `name` | — | String | `primary-button` | Identifier used to reference this class from content elements. |
| `background-color` | — | CSS color value | `#1a1a2e` | Background colour applied to matching nodes. |
| `color` | — | CSS color value | `#ffffff` | Text colour applied to matching nodes. |
| `font-family` | — | String | `Inter, sans-serif` | Font family, comma-separated with a generic fallback (e.g. `Inter, sans-serif`). |
| `font-size` | — | Pixel value | `16px` | Font size in pixels. |
| `font-style` | — | `normal` \| `italic` \| `oblique` | `italic` | CSS font-style keyword. |
| `font-weight` | — | `100`–`900` | `700` | Numeric font weight. |
| `letter-spacing` | — | px or em, negatives allowed | `1px` | Space between characters. |
| `line-height` | — | px or percentage | `24px` | Line height in pixels or as a percentage of the font size. |
| `text-decoration` | — | `none` \| `underline` \| `overline` \| `line-through` | `underline` | CSS text-decoration keyword. |
| `text-transform` | — | `capitalize` \| `uppercase` \| `lowercase` | `uppercase` | CSS text-transform keyword. |
| `src` | — | String | `https://cdn.example.com/image.jpg` | Default image source URL for image-type nodes that reference this class. |
| `width` | — | Pixel value | `300px` | Default width for nodes that reference this class. |

## Children

None.

## Parents

- [`<rc-head>`](../root/rc-head.md)
- [`<rc-attributes>`](./rc-attributes.md)

## JSON

```json
{
  "tagName": "rc-class",
  "attributes": {
    "name": "primary-button",
    "background-color": "#1a1a2e",
    "color": "#ffffff",
    "font-size": "16px",
    "font-weight": "700"
  }
}
```

## XML

```xml
<rc-class name="primary-button" background-color="#1a1a2e" color="#ffffff" font-size="16px" font-weight="700"></rc-class>
```

## Usage

### Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createClassElement } from '@rule/rcml';

createClassElement({
  attrs: {
    name: 'primary-button',
    'background-color': '#1a1a2e',
    color: '#ffffff',
    'font-size': '16px',
    'font-weight': '700',
  },
})
```

### Referencing from body elements

Body elements apply a class by setting their `rc-class` attribute to the class `name`. Multiple classes are space-separated.

The `rc-class` attribute is supported by: [`<rc-text>`](../body/content/rc-text.md), [`<rc-heading>`](../body/content/rc-heading.md), [`<rc-button>`](../body/content/rc-button.md), and [`<rc-logo>`](../body/content/rc-logo.md).

```json
{
  "tagName": "rc-class",
  "attributes": { "name": "cta", "background-color": "#1a1a2e", "color": "#ffffff", "font-weight": "700" }
}
```

```json
{
  "tagName": "rc-button",
  "attributes": { "rc-class": "cta", "href": "https://example.com" },
  "children": [...]
}
```

```xml
<!-- Define in head -->
<rc-class name="cta" background-color="#1a1a2e" color="#ffffff" font-weight="700"></rc-class>

<!-- Reference in body -->
<rc-button rc-class="cta" href="https://example.com">Shop now</rc-button>

<!-- Multiple classes, space-separated -->
<rc-button rc-class="cta rounded" href="https://example.com">Shop now</rc-button>
```

## API Reference

- [createClassElement](/api/rcml/src/functions/createClassElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
