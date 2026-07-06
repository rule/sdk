# `<rc-body>`

`<rc-body>` is the email content root — everything the recipient sees. It sets the canvas background and content width.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `background-color` | — | CSS color value | `#f5f5f5` | Canvas background color. |
| `width` | `600px` | Pixel values only (e.g. `600px`, `640px`). `0` is also valid. | `640px` | Maximum width of the email content area. |

## Children

| Element | Description |
|---------|-------------|
| [`<rc-section>`](../body/layout/rc-section.md) | Horizontal row containing columns. |
| [`<rc-wrapper>`](../body/layout/rc-wrapper.md) | Background or padding group around sections. |
| [`<rc-loop>`](../body/control-flow/rc-loop.md) | Repeats its children over a data array. |
| [`<rc-switch>`](../body/control-flow/rc-switch.md) | Renders one of several cases based on a condition. |

## Parents

- [`<rcml>`](./rcml.md)

## JSON

```json
{
  "tagName": "rc-body",
  "attributes": {
    "background-color": "#f5f5f5",
    "width": "600px"
  },
  "children": [
    { "tagName": "rc-section", "children": [] }
  ]
}
```

## XML

```xml
<rc-body background-color="#f5f5f5" width="600px">
  <rc-section>...</rc-section>
</rc-body>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createBodyElement, createSectionElement } from '@rule/rcml';

const body = createBodyElement({
  attrs: { 'background-color': '#f5f5f5', width: '600px' },
  children: [createSectionElement({ children: [] })],
});
```

## API Reference

- [createBodyElement](/api/rcml/src/functions/createBodyElement)
- [createSectionElement](/api/rcml/src/functions/createSectionElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
