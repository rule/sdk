# `paragraph`

A block of text. The fundamental building block of rich-text content.

## Attributes

None.

## Children

Inline nodes — `text`, `hardbreak`, `placeholder`, `loop-value`

## Parent nodes

- `doc`
- `list-item`
- `align`

## Available in

- Full Email RFM (`rc-text`, `rc-heading`)
- Email Inline RFM (`rc-button`)

## JSON

```json
{
  "type": "paragraph",
  "content": [{ "type": "text", "text": "Hello world" }]
}
```

## Email RFM syntax

Plain text on its own line. A blank line separates paragraphs.

```rfm
This is a paragraph.

This is another paragraph.
```
