# `<rc-preview>`

Preheader text shown next to the subject line in email client inbox lists before the message is opened.

## Attributes

None.

## Children

None. Content is plain text set via the `content` field.

## Parents

- [`<rc-head>`](../root/rc-head.md)

## JSON

```json
{
  "tagName": "rc-preview",
  "content": "See inside for 20% off"
}
```

## XML

```xml
<rc-preview>See inside for 20% off</rc-preview>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createPreviewElement } from '@rule/rcml';

createPreviewElement({ content: 'See inside for 20% off' })
```

## API Reference

- [createPreviewElement](/api/rcml/src/functions/createPreviewElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
