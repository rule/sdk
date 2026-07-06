# Rich text content

The `content` field of `rc-text`, `rc-heading`, and `rc-button` holds a ProseMirror JSON document. ProseMirror JSON is verbose and deeply nested — a single bold word is multiple levels of node objects. Rather than writing it directly, you produce it from **Email RFM** (Email Rule Flavor Markdown): a compact, human-readable source format that compiles to that JSON, in the same way Markdown compiles to HTML.

ProseMirror is also the editor's internal document model. Storing content as ProseMirror JSON means templates can be opened directly in the editor, modified, and saved back without any conversion step.

Produce content using two functions:

```typescript
import { emailRfmToJson, emailInlineRfmToJson } from '@rule/rcml';

const doc   = emailRfmToJson('Hello :font[world]{font-weight="bold"}');  // rc-text, rc-heading
const label = emailInlineRfmToJson('Buy now');                           // rc-button
```

Both return a ProseMirror `doc` node that you assign directly to an element's `content` field.

## Two flavors

Email RFM comes in two variants depending on which element it feeds:

| Flavor | Used by | Capabilities |
|--------|---------|--------------|
| **Full Email RFM** | `rc-text`, `rc-heading` | Paragraphs, bullet and ordered lists, alignment blocks, all inline marks and atoms |
| **Email Inline RFM** | `rc-button` | Single paragraph only — no lists, alignment, or hard breaks |

## Email RFM is directive-first

Email RFM has no native `**bold**` or `[text](url)` syntax. All text styling, links, and dynamic values use directives:

- Styling: `:font[text]{font-weight="bold" color="#FF0000"}`
- Link: `:link[text]{href="https://example.com"}`
- Merge tag: `::placeholder{type="Subscriber" value="email" name="Email" original="[Subscriber:email]"}`
- Loop variable: `::loop-value{original="42.title" value="42" index="title"}`

The directive syntax is uniform because email content mixes prose with types that Markdown has no native concept for: styled spans, merge tags that insert subscriber data, loop variables that reference feed fields. All of these need typed attributes. `:font[text]{...}`, `::placeholder{...}`, and `::loop-value{...}` follow the same grammar, making the format extensible without introducing new syntax for each new inline type.

See [Content flavors](/packages/rcml/email/content/flavors) for the complete syntax reference.

## Related

- [Content flavors](/packages/rcml/email/content/flavors) — Full Email RFM vs Email Inline RFM in detail
- [Block nodes](/packages/rcml/email/content/block-nodes/doc) — paragraph, list, alignment
- [Inline nodes](/packages/rcml/email/content/inline-nodes/text) — text, placeholder, loop-value
- [Marks](/packages/rcml/email/content/marks/font) — font, link
