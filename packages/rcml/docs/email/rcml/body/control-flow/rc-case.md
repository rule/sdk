# `<rc-case>`

A single conditional branch inside an `<rc-switch>`. Rendered when its condition matches the subscriber's data. Set `case-type="default"` for the fallback branch that renders when no other case matches.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `case-type` | — | `tag` \| `segment` \| `custom-field` \| `default` | `tag` | Kind of subscriber data to match against. `default` renders when no other case matches. |
| `case-property` | — | String (numeric ID) | `456` | ID of the segment, tag, or custom field to evaluate. Not required when `case-type` is `default`. |
| `case-condition` | — | `eq` \| `ne` | `eq` | Comparison operator. `eq` matches when the property equals `case-value`; `ne` when it does not. |
| `case-value` | — | String | `true` | Value to compare against the subscriber property. |
| `case-active` | — | `true` \| `false` | `true` | When `true`, this branch is selected in editor preview mode regardless of conditions. |

## Children

| Element | Description |
|---------|-------------|
| [`<rc-section>`](../layout/rc-section.md) | The layout row rendered when this case is active. |

## Parents

- [`<rc-switch>`](./rc-switch.md)

## JSON

```json
{
  "tagName": "rc-case",
  "attributes": {
    "case-type": "tag",
    "case-property": "456",
    "case-condition": "eq",
    "case-value": "true"
  },
  "children": [
    { "tagName": "rc-section", "children": [] }
  ]
}
```

## XML

```xml
<rc-case case-type="tag" case-property="456" case-condition="eq" case-value="true">
  <rc-section>...</rc-section>
</rc-case>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createCaseElement, createSectionElement } from '@rule/rcml';

createCaseElement({
  attrs: { 'case-type': 'tag', 'case-property': '456', 'case-condition': 'eq', 'case-value': 'true' },
  children: [createSectionElement({ children: [] })],
})
```

## API Reference

- [createCaseElement](/api/rcml/src/functions/createCaseElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
