# Flavors

RCML content fields accept text in one of two Email RFM dialects. The dialect is determined by the element — you do not choose it per field.

## Full Email RFM

Used by `rc-text` and `rc-heading`.

**Email RFM** (Email Rule Flavor Markdown) is a directive-first markdown dialect. Block structure follows CommonMark (paragraphs, lists, hard breaks), extended with one container directive for alignment. All inline styling and linking is expressed through `remark-directive` span directives — there is no native `**bold**` or `[text](url)` syntax.

Parsed and validated by `emailRfmToJson()`.

### Supported block elements

| Element | Syntax |
|---------|--------|
| Paragraph | Plain text; blank line separates paragraphs |
| Hard break | `\` at end of line, or two trailing spaces |
| Bullet list | Lines starting with `- `, `+ `, or `* ` |
| Ordered list | Lines starting with `1. `, `2. `, etc. |
| Nested list | Indent items by 2 spaces |
| Alignment | `:::align{value="center"}` … `:::` container |

### Supported inline marks and atoms

| Directive | Produces | Description |
|-----------|----------|-------------|
| `:font[text]{…}` | [`font`](./marks/font) mark | Text styling (bold, italic, colour, size, …) |
| `:link[text]{…}` | [`link`](./marks/link) mark | Hyperlink |
| `::placeholder{…}` | [`placeholder`](./inline-nodes/placeholder) node | Dynamic merge-tag chip |
| `::loop-value{…}` | [`loop-value`](./inline-nodes/loop-value) node | Loop variable chip |

### Deliberately unsupported

The following CommonMark / GFM constructs are silently discarded:

- Headings (`#`, `##`, …), blockquotes (`>`), code blocks
- Thematic breaks (`---`), images (`![…](…)`), GFM tables, raw HTML

### Example

```
A :font[bold]{font-weight="bold"}, :font[italic]{font-style="italic"} paragraph.

- Bullet one
- Bullet two

:::align{value="center"}

Centred text with a :link[:font[link]{color="#2e5bff" text-decoration="underline"}]{href="https://example.com"}.

:::
```

---

## Email Inline RFM

Used by `rc-button`.

**Email Inline RFM** is a strict subset of Full Email RFM. It supports the same inline marks and atoms but restricts the content to exactly one paragraph — no lists, no hard breaks, no alignment. This maps to the `inline-rfm` ProseMirror schema used for button labels and other short single-line fields.

Parsed and validated by `emailInlineRfmToJson()`.

### Supported elements

| Element | Email Inline RFM | Full Email RFM |
|---------|-----------|---------|
| Paragraph (single) | Yes | Yes |
| Hard break | **No** | Yes |
| Bullet / ordered list | **No** | Yes |
| `:::align` | **No** | Yes |
| `:font` mark | Yes | Yes |
| `:link` mark | Yes | Yes |
| `::placeholder` | Yes | Yes |
| `::loop-value` | Yes | Yes |

### Example

```
:font[Get started]{font-weight="bold"} — :link[sign in here]{href="https://example.com"}
```

---

## API

```typescript
import { emailRfmToJson, emailInlineRfmToJson } from '@rule/rcml';

// Full Email RFM → doc node (rc-text, rc-heading)
const doc = emailRfmToJson('Hello :font[world]{font-weight="bold"}');

// Email Inline RFM → doc node (rc-button)
const inlineDoc = emailInlineRfmToJson(':font[Click here]{color="#2e5bff"}');
```

Both functions return a [`doc`](./block-nodes/doc) node. Pass the result directly as the `content` field of the corresponding RCML element.
