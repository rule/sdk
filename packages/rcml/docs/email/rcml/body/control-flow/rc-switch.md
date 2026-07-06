# `<rc-switch>`

Conditional branching container. Evaluates its `<rc-case>` children in order and renders the first one whose condition matches the subscriber's data. A `case-type="default"` child provides the fallback when no case matches.

## Attributes

None.

## Children

| Element | Description |
|---------|-------------|
| [`<rc-case>`](./rc-case.md) | A single conditional branch. |

## Parents

- [`<rc-body>`](../../root/rc-body.md)
- [`<rc-wrapper>`](../layout/rc-wrapper.md)

## JSON

```json
{
  "tagName": "rc-switch",
  "children": [
    {
      "tagName": "rc-case",
      "attributes": {
        "case-type": "tag",
        "case-property": "123",
        "case-condition": "eq",
        "case-value": "true"
      },
      "children": [{ "tagName": "rc-section", "children": [] }]
    },
    {
      "tagName": "rc-case",
      "attributes": { "case-type": "default" },
      "children": [{ "tagName": "rc-section", "children": [] }]
    }
  ]
}
```

## XML

```xml
<rc-switch>
  <rc-case case-type="tag" case-property="123" case-condition="eq" case-value="true">
    <rc-section>...</rc-section>
  </rc-case>
  <rc-case case-type="default">
    <rc-section>...</rc-section>
  </rc-case>
</rc-switch>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createSwitchElement, createCaseElement, createSectionElement } from '@rule/rcml';

createSwitchElement({
  children: [
    createCaseElement({
      attrs: { 'case-type': 'tag', 'case-property': '123', 'case-condition': 'eq', 'case-value': 'true' },
      children: [createSectionElement({ children: [] })],
    }),
    createCaseElement({
      attrs: { 'case-type': 'default' },
      children: [createSectionElement({ children: [] })],
    }),
  ],
})
```

## API Reference

- [createSwitchElement](/api/rcml/src/functions/createSwitchElement)
- [createCaseElement](/api/rcml/src/functions/createCaseElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
