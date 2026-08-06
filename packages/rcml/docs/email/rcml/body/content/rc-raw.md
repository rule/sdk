# `<rc-raw>`

Injects raw HTML directly into the compiled output without escaping. Use sparingly — content bypasses all RCML validation and structural checks.

## Attributes

None.

## Children

None. Content is set via the `content` field as `{ type: 'html', text: string }`, where `text` holds the raw HTML string.

## Parents

- [`<rc-column>`](../layout/rc-column.md)

## JSON

```json
{
  "tagName": "rc-raw",
  "content": {
    "type": "html",
    "text": "<!--[if mso]><table><tr><td><![endif]-->"
  }
}
```

## XML

```xml
<rc-raw><!--[if mso]><table><tr><td><![endif]--></rc-raw>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createRawElement } from '@rule/rcml';

createRawElement({ content: '<!--[if mso]><table><tr><td><![endif]-->' })
```

## API Reference

- [createRawElement](/api/rcml/src/functions/createRawElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
