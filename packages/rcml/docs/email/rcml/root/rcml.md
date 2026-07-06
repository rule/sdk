# `<rcml>`

`<rcml>` is the root of every email template. It contains exactly one `<rc-head>` and one `<rc-body>`.

## Attributes

None.

## Children

| Element | Cardinality | Description |
|---------|-------------|-------------|
| [`<rc-head>`](./rc-head.md) | Exactly 1 | Metadata container. |
| [`<rc-body>`](./rc-body.md) | Exactly 1 | Content root. |

## Parents

None — this is the root element.

## JSON

```json
{
  "tagName": "rcml",
  "children": [
    { "tagName": "rc-head", "children": [] },
    { "tagName": "rc-body", "children": [] }
  ]
}
```

## XML

```xml
<rcml>
  <rc-head></rc-head>
  <rc-body></rc-body>
</rcml>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createRcmlDocumentElement, createHeadElement, createBodyElement } from '@rule/rcml';

const template = createRcmlDocumentElement({
  head: createHeadElement({ children: [] }),
  body: createBodyElement({ children: [] }),
});
```

## API Reference

- [createRcmlDocumentElement](/api/rcml/src/functions/createRcmlDocumentElement)
- [createHeadElement](/api/rcml/src/functions/createHeadElement)
- [createBodyElement](/api/rcml/src/functions/createBodyElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
