# `<rc-plain-text>`

Plain-text version of the email body for clients that cannot render HTML.

## Attributes

None.

## Children

None. Content is plain text set via the `content` field.

## Parents

- [`<rc-head>`](../root/rc-head.md)

## JSON

```json
{
  "tagName": "rc-plain-text",
  "content": { "type": "text", "text": "Hi — see the full offer at example.com/sale." }
}
```

## XML

```xml
<rc-plain-text>Hi — see the full offer at example.com/sale.</rc-plain-text>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createPlainTextElement } from '@rule/rcml';

createPlainTextElement({ content: 'Hi — see the full offer at example.com/sale.' })
```

## API Reference

- [createPlainTextElement](/api/rcml/src/functions/createPlainTextElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
