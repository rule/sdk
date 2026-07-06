# `<rc-loop>`

Repeating section driven by a data feed. Renders its child `<rc-section>` once per item in the feed. Supports news feeds, remote content URLs, custom fields, and XML data sources.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `loop-type` | — | String | `news-feed` | Data source type for the loop (e.g. `news-feed`, `remote-content`, `custom-field`, `xml`). |
| `loop-value` | — | String | `42` | ID or URL of the data source — feed ID, remote content URL, custom-field ID, or XML document path. |
| `loop-max-iterations` | — | Positive integer | `5` | Maximum number of items to render. Prevents runaway loops on large feeds. |

## Children

| Element | Description |
|---------|-------------|
| [`<rc-section>`](../layout/rc-section.md) | The layout row rendered once per feed item. |

## Parents

- [`<rc-body>`](../../root/rc-body.md)
- [`<rc-column>`](../layout/rc-column.md)

## JSON

```json
{
  "tagName": "rc-loop",
  "attributes": {
    "loop-type": "news-feed",
    "loop-value": "42",
    "loop-max-iterations": "5"
  },
  "children": [
    { "tagName": "rc-section", "children": [] }
  ]
}
```

## XML

```xml
<rc-loop loop-type="news-feed" loop-value="42" loop-max-iterations="5">
  <rc-section>...</rc-section>
</rc-loop>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createLoopElement, createSectionElement } from '@rule/rcml';

createLoopElement({
  attrs: { 'loop-type': 'news-feed', 'loop-value': '42', 'loop-max-iterations': '5' },
  children: [createSectionElement({ children: [] })],
})
```

## API Reference

- [createLoopElement](/api/rcml/src/functions/createLoopElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
