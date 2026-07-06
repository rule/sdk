# Inline RFM Flavor Specification

**Version:** 0.1.0
**Status:** Draft

## Overview

**Inline RFM** is the markdown dialect used for **short label content** inside the template — button labels and any single-line or short-form rich text field. Subject lines and preview text use plain text only.

Inline RFM is a strict subset of [RFM](rfm-spec.md). It shares the same directive vocabulary for inline marks and atoms but excludes all block-level constructs beyond a single paragraph: no lists, no hard breaks, no alignment.

> For full-featured body text with lists and alignment, see [`rfm-spec.md`](rfm-spec.md).

---

## Block Elements

### Paragraph

The only supported block element. Inline RFM content is always exactly one paragraph — multiple paragraphs are structurally invalid and will fail validation.

```markdown
Click here to get started.
```

---

## Deliberately Unsupported

The following are **not supported** in Inline RFM (they are supported in full RFM):

- Hard breaks (`\` at end of line, two trailing spaces, inline `\n`)
- Bullet lists (`- item`)
- Ordered lists (`1. item`)
- Alignment (`:::align`)

The following CommonMark / GFM constructs are also not supported (same as full RFM):

- Headings, blockquotes, code blocks, thematic breaks, images, tables

---

## Inline Marks

### `:font` — Text Styling

All text styling is expressed through a single `:font` mark.

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

A bare `:font[text]{}` with no attributes is **invalid**.

**Examples:**

```markdown
:font[bold label]{font-weight="bold"}

:font[italic label]{font-style="italic"}

:font[colored label]{color="#2e5bff"}
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

Links typically wrap a `:font` mark:

```markdown
:link[:font[click here]{color="#2e5bff" text-decoration="underline"}]{href="https://example.com"}
```

---

## Inline Atoms

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
| `original` | Bracket-token string | Legacy server-side render token |
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

- Text nodes are plain UTF-8.
- Emoji are stored as actual Unicode characters — never as `:shortcode:` form.

---

## Complete Example

**Visual output:**
> Hello :font[First name]{font-weight="bold"}, :font[get started]{font-style="italic"} today!

**Serialised Inline RFM:**

```markdown
Hello ::placeholder{type="Subscriber" value="first_name" name="First name" original="[subscriber:first_name]"}, :font[get started]{font-style="italic"} today!
```

---

## ProseMirror Schema

### Nodes

| Node | Content | Description |
|------|---------|-------------|
| `doc` | `paragraph+` | Root document |
| `paragraph` | `inline*` | Block of text |
| `text` | — | Leaf text node |
| `placeholder` | — | Inline atom — merge tag chip |
| `loop_value` | — | Inline atom — loop variable chip |

### Marks

| Mark | Directive | Attributes |
|------|-----------|------------|
| `font` | `:font` | `font-family`, `font-size`, `line-height`, `letter-spacing`, `font-style`, `font-weight`, `text-decoration`, `color` |
| `link` | `:link` | `href`, `target`, `no-tracked` |

---

## Difference from Full RFM

| Feature | Inline RFM | Full RFM |
|---------|-----------|---------|
| Paragraph | Yes | Yes |
| Hard break | **No** | Yes |
| Bullet / ordered list | **No** | Yes |
| `:::align` | **No** | Yes |
| `:font` mark | Yes | Yes |
| `:link` mark | Yes | Yes |
| `::placeholder` | Yes | Yes |
| `::loop-value` | Yes | Yes |

---

## MCP Usage

An AI model generating Inline RFM content should:

1. Use a single paragraph — no lists, no hard breaks, no alignment
2. Express **all** text styling through `:font[text]{attrs}` — never use `**bold**` or `*italic*`
3. Express links as `:link[text]{href="..."}` — not `[text](url)`
4. Use `::placeholder{...}` for merge tags
5. Use `::loop-value{...}` for loop variable references
6. Keep content concise — this is a label, not a body text area
