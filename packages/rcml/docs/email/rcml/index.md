# RCML Reference

RCML is the element language used to describe email templates in Rule. A template is a tree of elements — each element is a JSON object with a `tagName`, optional `attributes`, and optional `children` or `content`. The same tree can also be serialised as XML.

## Document structure

Every RCML document follows the same top-level shape:

```
<rcml>
  <rc-head>   ← metadata: fonts, default styles, named classes, plain-text version
  <rc-body>   ← visible content: sections, columns, and content elements
```

Inside `<rc-body>`, content is composed from three groups of elements:

**Layout** — define the two-dimensional grid of the email.

| Element | Purpose |
|---------|---------|
| [`<rc-section>`](./body/layout/rc-section.md) | Full-width horizontal row. The primary layout unit. |
| [`<rc-column>`](./body/layout/rc-column.md) | Vertical cell inside a section. All content lives here. |
| [`<rc-wrapper>`](./body/layout/rc-wrapper.md) | Groups sections under a shared background image or colour. |
| [`<rc-group>`](./body/layout/rc-group.md) | Keeps its columns side-by-side on mobile. |

**Content** — the leaf elements that render visible content inside columns.

| Element | Purpose |
|---------|---------|
| [`<rc-text>`](./body/content/rc-text.md) | Rich-text paragraph block. |
| [`<rc-heading>`](./body/content/rc-heading.md) | Heading block (h1–h6 semantics). |
| [`<rc-button>`](./body/content/rc-button.md) | Call-to-action button. |
| [`<rc-image>`](./body/content/rc-image.md) | Responsive image with optional link. |
| [`<rc-logo>`](./body/content/rc-logo.md) | Brand logo image with `rc-class` support. |
| [`<rc-video>`](./body/content/rc-video.md) | Video thumbnail with play-button overlay. |
| [`<rc-spacer>`](./body/content/rc-spacer.md) | Invisible vertical whitespace block. |
| [`<rc-divider>`](./body/content/rc-divider.md) | Horizontal rule line. |
| [`<rc-social>`](./body/content/rc-social.md) | Row of social media icon links. |
| [`<rc-raw>`](./body/content/rc-raw.md) | Arbitrary HTML injected verbatim. |

**Control flow** — dynamic branching and repetition.

| Element | Purpose |
|---------|---------|
| [`<rc-switch>`](./body/control-flow/rc-switch.md) | Renders the first matching `<rc-case>`. |
| [`<rc-case>`](./body/control-flow/rc-case.md) | One conditional branch inside a switch. |
| [`<rc-loop>`](./body/control-flow/rc-loop.md) | Repeats its `<rc-section>` once per feed item. |

Inside `<rc-head>`, metadata elements configure the document before it is rendered:

| Element | Purpose |
|---------|---------|
| [`<rc-brand-style>`](./head/rc-brand-style.md) | Binds a Rule brand-style preset to the document. |
| [`<rc-font>`](./head/rc-font.md) | Declares a web font loaded from a URL. |
| [`<rc-attributes>`](./head/rc-attributes.md) | Sets default attribute values for body elements. |
| [`<rc-preview>`](./head/rc-preview.md) | Sets the inbox preview text. |
| [`<rc-class>`](./head/rc-class.md) | Defines a named reusable style class. |
| [`<rc-plain-text>`](./head/rc-plain-text.md) | Provides the plain-text fallback version. |

## JSON representation

RCML is primarily a JSON tree. Each node is an object:

```json
{
  "tagName": "rc-text",
  "attributes": {
    "color": "#333333",
    "font-size": "16px"
  },
  "content": {
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Hello world" }] }
    ]
  }
}
```

- `tagName` — the element type (see the tables above).
- `attributes` — key-value pairs; all values are strings.
- `children` — array of child element objects (for layout and container elements).
- `content` — ProseMirror-style rich-text document (for `rc-text`, `rc-heading`, `rc-button`).

## XML representation

The same tree can be expressed as XML:

```xml
<rc-text color="#333333" font-size="16px">Hello world</rc-text>
```

Attributes map directly to XML attributes. Child elements nest normally. Rich-text content is expressed as the element's text body.

## Building with factory functions

The `@rule/rcml` package exports a factory function for every element:

```typescript
import {
  createRcmlDocumentElement,
  createHeadElement,
  createBodyElement,
  createSectionElement,
  createColumnElement,
  createTextElement,
} from '@rule/rcml';

const template = createRcmlDocumentElement({
  head: createHeadElement({ children: [] }),
  body: createBodyElement({
    attrs: { width: '600px' },
    children: [
      createSectionElement({
        children: [
          createColumnElement({
            children: [
              createTextElement({
                attrs: { color: '#333333' },
                content: {
                  type: 'doc',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }],
                },
              }),
            ],
          }),
        ],
      }),
    ],
  }),
});
```

## Building with AI

RCML JSON can also be generated directly by a language model. Pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context in your prompt — it contains the complete element schema with all tag names, allowed attributes, constraints, and parent-child relationships.

```typescript
import { rcmlSpec } from '@rule/rcml';

// Include rcmlSpec in your AI prompt context
// The model can then produce valid RCML JSON directly
```

## Per-element reference

Each element page documents:
- **Attributes** — all supported attributes with types, defaults, and examples.
- **Children** — valid child elements and cardinality.
- **Parents** — elements that may contain this element.
- **JSON / XML** — a minimal usage example in both representations.
- **Building** — the corresponding TypeScript factory call.
