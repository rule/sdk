# `<rc-group>`

Non-responsive wrapper placed directly inside an [`<rc-section>`](./rc-section.md). Keeps its columns side-by-side on mobile instead of stacking. Without a group, all columns in a section stack vertically on small screens; columns inside a group remain horizontal. At most one group per section — the SDK enforces this to keep templates round-trippable through the Rule.io editor UI.

## Attributes

None.

## Children

| Element | Description |
|---------|-------------|
| [`<rc-column>`](./rc-column.md) | A column that stays grouped with its siblings on mobile. |

## Parents

- [`<rc-section>`](./rc-section.md)

## JSON

```json
{
  "tagName": "rc-group",
  "children": [
    { "tagName": "rc-column", "attributes": { "width": "50%" }, "children": [] },
    { "tagName": "rc-column", "attributes": { "width": "50%" }, "children": [] }
  ]
}
```

## XML

```xml
<rc-group>
  <rc-column width="50%">...</rc-column>
  <rc-column width="50%">...</rc-column>
</rc-group>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createSectionElement, createGroupElement, createColumnElement } from '@rule/rcml';

createSectionElement({
  children: [
    createGroupElement({
      children: [
        createColumnElement({ attrs: { width: '50%' }, children: [] }),
        createColumnElement({ attrs: { width: '50%' }, children: [] }),
      ],
    }),
  ],
})
```

## API Reference

- [createGroupElement](/api/rcml/src/functions/createGroupElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
