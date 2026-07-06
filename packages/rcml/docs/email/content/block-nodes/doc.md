# `doc`

The root node of a rich-text content tree. Every `content` field on `rc-text`, `rc-heading`, and `rc-button` is a `doc` node.

## Attributes

None.

## Children

Block nodes — `paragraph`, `bullet-list`, `ordered-list`, `align` (one or more)

## Parent nodes

None. `doc` is always the root.

## Available in

- Full Email RFM (`rc-text`, `rc-heading`)
- Email Inline RFM (`rc-button`)

## JSON

```json
{
  "type": "doc",
  "content": [
    { "type": "paragraph", "content": [{ "type": "text", "text": "Hello world" }] }
  ]
}
```

A `doc` with multiple paragraphs:

```json
{
  "type": "doc",
  "content": [
    { "type": "paragraph", "content": [{ "type": "text", "text": "First paragraph." }] },
    { "type": "paragraph", "content": [{ "type": "text", "text": "Second paragraph." }] }
  ]
}
```

## Email RFM syntax

The `doc` node is the implicit wrapper for all Email RFM content. It is never written directly — the Email RFM parser and the `emailRfmToJson` / `emailInlineRfmToJson` functions always return a `doc` node as the top-level result.

```typescript
import { emailRfmToJson } from '@rule/rcml';

const doc = emailRfmToJson('Hello world');
// { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }] }
```
