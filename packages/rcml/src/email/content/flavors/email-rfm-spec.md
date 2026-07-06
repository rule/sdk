# RFM Flavor Specification

**Version:** 0.1.0
**Status:** Draft

## Overview

**RFM** (Rule Flavor Markdown) is the markdown dialect used for **text block content** in the RCML document — body text areas, multi-paragraph content, and any rich text field that supports lists and alignment.

RFM is a **directive-first** dialect: there is no native inline markdown formatting. All text styling, links, and custom inline atoms are expressed as `remark-directive` directives. Block structure (paragraphs, lists, hard breaks, alignment) uses CommonMark syntax extended with one container directive (`:::align`).

The `rcml-generator` pipeline converts RFM strings into ProseMirror documents compatible with the editor's `rfm` schema.

> For short single-line content like button labels, see [`inline-rfm-spec.md`](inline-rfm-spec.md).

---

## Block Elements

### Paragraph

The primary content container. Multiple paragraphs are separated by a blank line.

```markdown
First paragraph.

Second paragraph.
```

### Hard Break

A line break rendered as `<br>`.

| Form | Syntax | Notes |
|------|--------|-------|
| Block hard break | `\` at end of line, or two trailing spaces | Rendered as `<br>` |
| Inline hard break | Literal `\n` inside a paragraph | Serialised back as `\n`, not `<br>` |

### Bullet List

```markdown
- First item
- Second item
- Third item
```

Markers `- `, `+ `, `* ` are all accepted on input. All bullets render with `•`.

### Ordered List

```markdown
1. First step
2. Second step
3. Third step
```

The `start` value is preserved. Per-item numbering is re-derived on import.

### Nested Lists

Standard indentation (2 spaces or a tab):

```markdown
- Parent item
  - Child item
  - Another child
- Back to parent
```

### `:::align` — Text Alignment

Wraps one or more block elements with a text alignment.

```
:::align{value="center"}

This paragraph is centered.

And so is this one.

:::
```

**Attributes:**

| Attribute | Values | Default |
|-----------|--------|---------|
| `value` | `left`, `center`, `right` | `left` |

Lists are aligned by wrapping the whole list, not individual items. Nested alignment is not produced — re-aligning replaces the existing `value`.

---

## Deliberately Unsupported Block Elements

The following CommonMark / GFM constructs are silently discarded on import and never produced on export:

- Headings (`#`, `##`, …)
- Blockquotes (`>`)
- Fenced and indented code blocks
- Thematic breaks (`---`)
- Images (`![alt](url)`)
- GFM tables, task lists, autolinks
- Raw HTML

---

## Inline Marks

### `:font` — Text Styling

All text styling is expressed through a single `:font` mark. Bold, italic, underline, strikethrough, color, font family, size, and spacing are attribute toggles on this mark.

```
:font[Hello world]{font-weight="bold" font-style="italic"}
```

**Attributes** (all optional, all default to `null`):

| Attribute | Typical values | Description |
|-----------|---------------|-------------|
| `font-family` | Any CSS font-family string | Font face |
| `font-size` | CSS length (`14px`, `1em`) | Font size |
| `line-height` | CSS line-height value | Line spacing |
| `letter-spacing` | CSS length | Character spacing |
| `font-style` | `normal`, `italic` | Italic toggle |
| `font-weight` | `regular`, `bold`, or numeric weight | Bold toggle |
| `text-decoration` | `none`, `underline`, `line-through` | Underline / strikethrough |
| `color` | Any CSS color (`#222222`, `rgb(…)`) | Text color |

A bare `:font[text]{}` with no attributes is **invalid** — the mark only materialises when at least one attribute is set.

**Examples:**

```markdown
:font[bold text]{font-weight="bold"}

:font[italic text]{font-style="italic"}

:font[bold and italic]{font-weight="bold" font-style="italic"}

:font[colored]{color="#e74c3c"}

:font[underlined]{text-decoration="underline"}
```

---

### `:link` — Hyperlink

```
:link[click here]{href="https://example.com" target="_blank" no-tracked="false"}
```

**Attributes:**

| Attribute | Values | Description |
|-----------|--------|-------------|
| `href` | Any URL | Required. Link destination |
| `target` | `_blank` or omitted | Open in new tab |
| `no-tracked` | `"true"` or `"false"` | Opt out of click tracking |

Links typically wrap a `:font` mark with the default link color and underline:

```markdown
:link[:font[click here]{color="#2e5bff" text-decoration="underline"}]{href="https://example.com"}
```

---

## Inline Atoms

Inline atoms render as non-editable chips inside the editor. They are expressed as leaf directives.

### `::placeholder` — Merge Tag / Smart Field

```
::placeholder{type="SubscriberField" value="42" name="First name" original="[subscriber:42]"}
```

**Attributes:**

| Attribute | Values | Description |
|-----------|--------|-------------|
| `type` | `CustomField`, `Subscriber`, `User`, `RemoteContent`, `Date` | Placeholder category |
| `value` | Server-side ID or path | The field identifier. `null` for `RemoteContent` |
| `name` | String | Display label shown in the chip |
| `original` | Bracket-token string | Legacy server-side render token (e.g. `[subscriber:first_name]`) |
| `max-length` | Number (optional) | Truncation hint |

---

### `::loop-value` — Loop Variable

```
::loop-value{original="orders.item_name" value="orders" index="item_name"}
```

| Attribute | Values | Description |
|-----------|--------|-------------|
| `original` | `"value.index"` string | Authoritative on re-parse |
| `value` | Collection name | Loop source |
| `index` | Property name | Field on the iteration item |

---

## Text and Emoji

- Text nodes are plain UTF-8. No escaping beyond standard remark-stringify rules.
- Emoji are stored as actual Unicode characters — never as `:shortcode:` form.

---

## Complete Example

**Visual output:**
> A **bold**, _italic_ paragraph with a [link](https://example.com) and a `First name` merge tag.
>
> A centered paragraph.

**Serialised RFM:**

```markdown
A :font[bold]{font-weight="bold"}, :font[italic]{font-style="italic"} paragraph with a :link[:font[link]{color="#2e5bff" text-decoration="underline"}]{href="https://example.com"} and a ::placeholder{type="Subscriber" value="first_name" name="First name" original="[subscriber:first_name]"} merge tag.

:::align{value="center"}

A centered paragraph.

:::
```

---

## ProseMirror Schema

### Nodes

| Node | Content | Description |
|------|---------|-------------|
| `doc` | `(paragraph \| bullet_list \| ordered_list \| align)+` | Root document |
| `paragraph` | `inline*` | Block of text |
| `text` | — | Leaf text node |
| `hard_break` | — | Line break (`<br>`) |
| `bullet_list` | `list_item+` | Unordered list |
| `ordered_list` | `list_item+` | Ordered list, attr: `order` |
| `list_item` | `paragraph+` | List item |
| `align` | `(paragraph \| bullet_list \| ordered_list)+` | Alignment wrapper, attr: `value` |
| `placeholder` | — | Inline atom — merge tag chip |
| `loop_value` | — | Inline atom — loop variable chip |

### Marks

| Mark | Directive | Attributes |
|------|-----------|------------|
| `font` | `:font` | `font-family`, `font-size`, `line-height`, `letter-spacing`, `font-style`, `font-weight`, `text-decoration`, `color` |
| `link` | `:link` | `href`, `target`, `no-tracked` |

---

## MCP Usage

An AI model generating RFM content should:

1. Use paragraphs, lists, and `:::align` for block structure — no headings, blockquotes, or code blocks
2. Express **all** text styling through `:font[text]{attrs}` — never use `**bold**` or `*italic*`
3. Express links as `:link[text]{href="..."}` — not `[text](url)`
4. Use `::placeholder{...}` for merge tags
5. Use `::loop-value{...}` for loop variable references
6. Separate paragraphs and list items with blank lines
