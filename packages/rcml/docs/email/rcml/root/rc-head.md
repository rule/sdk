# `<rc-head>`

`<rc-head>` is the metadata container for an email template. An empty head is valid — the renderer applies built-in defaults.

## Attributes

None.

## Children

All children are optional.

| Element | Description |
|---------|-------------|
| [`<rc-brand-style>`](../head/rc-brand-style.md) | Loads a saved brand style by ID. |
| [`<rc-attributes>`](../head/rc-attributes.md) | Sets default attribute values for content elements. |
| [`<rc-preview>`](../head/rc-preview.md) | Preheader text shown in inbox previews. |
| [`<rc-class>`](../head/rc-class.md) | Named groups of attributes, applied like style classes. |
| [`<rc-font>`](../head/rc-font.md) | Declares a web font for use in the template. |
| [`<rc-plain-text>`](../head/rc-plain-text.md) | Plain-text fallback for clients that cannot render HTML. |

## Parents

- [`<rcml>`](./rcml.md)

## JSON

```json
{
  "tagName": "rc-head",
  "children": [
    { "tagName": "rc-brand-style", "attributes": { "id": "99999" } },
    { "tagName": "rc-preview", "content": "See inside for 20% off" }
  ]
}
```

## XML

```xml
<rc-head>
  <rc-brand-style id="99999"></rc-brand-style>
  <rc-preview>See inside for 20% off</rc-preview>
</rc-head>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createHeadElement, createBrandStyleElement, createPreviewElement } from '@rule/rcml';

const head = createHeadElement({
  children: [
    createBrandStyleElement({ attrs: { id: '99999' } }),
    createPreviewElement({ content: 'See inside for 20% off' }),
  ],
});
```

## API Reference

- [createHeadElement](/api/rcml/src/functions/createHeadElement)
- [createBrandStyleElement](/api/rcml/src/functions/createBrandStyleElement)
- [createPreviewElement](/api/rcml/src/functions/createPreviewElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
