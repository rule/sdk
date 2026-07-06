# `<rc-spacer>`

Invisible vertical spacer block. Adds controlled whitespace between content elements without relying on padding.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `container-background-color` | — | CSS color value | `#f9f9f9` | Background colour of the spacer cell (normally transparent). |
| `css-class` | — | String | `email-spacer` | HTML class names on the rendered element. |
| `height` | `32px` | px or percentage | `48px` | Height of the spacer. |
| `padding` | — | px, 1–4 values | `0 16px` | Padding inside the spacer cell. |
| `padding-top` | — | px or percentage | `8px` | Top padding. |
| `padding-bottom` | — | px or percentage | `8px` | Bottom padding. |
| `padding-left` | — | px or percentage | `16px` | Left padding. |
| `padding-right` | — | px or percentage | `16px` | Right padding. |
| `padding-on-mobile` | — | px, 1–4 values | `0 8px` | Padding override applied only on mobile viewports. |

## Children

None.

## Parents

- [`<rc-column>`](../layout/rc-column.md)

## JSON

```json
{
  "tagName": "rc-spacer",
  "attributes": { "height": "48px" }
}
```

## XML

```xml
<rc-spacer height="48px"></rc-spacer>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createSpacerElement } from '@rule/rcml';

createSpacerElement({ attrs: { height: '48px' } })
```

## API Reference

- [createSpacerElement](/api/rcml/src/functions/createSpacerElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
