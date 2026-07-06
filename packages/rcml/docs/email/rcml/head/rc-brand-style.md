# `<rc-brand-style>`

References a saved brand style by ID, applying its colour palette, fonts, and spacing defaults to the entire document.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `id` | — | Positive integer as a string | `123` | Numeric ID of the brand style to apply. |

## Children

None.

## Parents

- [`<rc-head>`](../root/rc-head.md)

## JSON

```json
{
  "tagName": "rc-brand-style",
  "attributes": { "id": "42" }
}
```

## XML

```xml
<rc-brand-style id="42"></rc-brand-style>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createBrandStyleElement } from '@rule/rcml';

createBrandStyleElement({ attrs: { id: '42' } })
```

## API Reference

- [createBrandStyleElement](/api/rcml/src/functions/createBrandStyleElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
