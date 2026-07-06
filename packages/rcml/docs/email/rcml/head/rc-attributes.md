# `<rc-attributes>`

Defines attribute defaults applied to matching content nodes throughout the document, reducing repetitive inline styling. Each child element specifies the tag type and the attribute values to use as defaults for all matching elements in the body.

## Attributes

None.

## Children

Children carry only attributes — no `children` or `content` of their own. They act as default-value declarations for matching body elements.

| Element | Purpose |
|---------|---------|
| `<rc-body>` | Default attributes for the document body. |
| `<rc-section>` | Default attributes for sections. |
| `<rc-text>` | Default attributes for text blocks. |
| `<rc-heading>` | Default attributes for headings. |
| `<rc-button>` | Default attributes for buttons. |
| `<rc-social>` | Default attributes for social icon blocks. |
| `<rc-class>` | Named style class (see [`<rc-class>`](./rc-class.md)). |

## Parents

- [`<rc-head>`](../root/rc-head.md)

## JSON

```json
{
  "tagName": "rc-attributes",
  "children": [
    { "tagName": "rc-body", "attributes": { "background-color": "#ffffff" } },
    { "tagName": "rc-text", "attributes": { "color": "#333333", "font-size": "16px" } }
  ]
}
```

## XML

```xml
<rc-attributes>
  <rc-body background-color="#ffffff"></rc-body>
  <rc-text color="#333333" font-size="16px"></rc-text>
</rc-attributes>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createAttributesElement, createBodyElement } from '@rule/rcml';

createAttributesElement({
  children: [
    createBodyElement({ attrs: { 'background-color': '#ffffff' }, children: [] }),
  ],
})
```

## API Reference

- [createAttributesElement](/api/rcml/src/functions/createAttributesElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
