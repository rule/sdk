# Elements

Content elements are the leaf nodes of an RCML document — they live inside `<rc-column>` and render the visible parts of the email.

## Element overview

| Element | Purpose |
|---------|---------|
| [`<rc-text>`](/packages/rcml/email/rcml/body/content/rc-text) | Rich-text paragraph block. Supports paragraphs, lists, inline marks, and placeholders. |
| [`<rc-heading>`](/packages/rcml/email/rcml/body/content/rc-heading) | Heading block (h1–h6 semantics). |
| [`<rc-button>`](/packages/rcml/email/rcml/body/content/rc-button) | Call-to-action button with a single-line label. |
| [`<rc-image>`](/packages/rcml/email/rcml/body/content/rc-image) | Responsive image with optional link. |
| [`<rc-logo>`](/packages/rcml/email/rcml/body/content/rc-logo) | Brand logo image. |
| [`<rc-video>`](/packages/rcml/email/rcml/body/content/rc-video) | Video thumbnail with play-button overlay. |
| [`<rc-spacer>`](/packages/rcml/email/rcml/body/content/rc-spacer) | Invisible vertical whitespace. |
| [`<rc-divider>`](/packages/rcml/email/rcml/body/content/rc-divider) | Horizontal rule. |
| [`<rc-social>`](/packages/rcml/email/rcml/body/content/rc-social) | Row of social-network icon links. |
| [`<rc-raw>`](/packages/rcml/email/rcml/body/content/rc-raw) | Arbitrary HTML injected verbatim. |

## Content shapes

Elements carry their content in one of three ways:

**`content`** — a ProseMirror JSON document, produced from RFM text using `emailRfmToJson()` or `emailInlineRfmToJson()`. Used by `rc-text`, `rc-heading`, and `rc-button`. See [Rich text content](/packages/rcml/email/concepts/basic/rich-text-content).

**`children`** — an array of child element objects. Used by `rc-social`, which holds `<rc-social-element>` children.

**Attributes only** — no `content` or `children`; all data lives in `attributes`. Used by `rc-image`, `rc-logo`, `rc-video`, `rc-spacer`, `rc-divider`, and `rc-raw`.

The three shapes reflect different content models. Rich text (`rc-text`, `rc-heading`, `rc-button`) needs to carry structured formatting — bold, links, merge tags — in a form the editor can load and re-edit. A plain string loses that structure; ProseMirror is the editor's internal document model, so using it as the storage format means documents round-trip through the editor without conversion. `rc-social` uses `children` because it is a list of structured items, not prose. Everything else (`rc-image`, `rc-logo`, etc.) is pure configuration — their entire "content" is their attribute values.

Several elements participate in theming passively. `rc-button` inherits its background colour from the theme's primary colour slot. `rc-text` and `rc-heading` inherit typography from named classes such as `rcml-p-style` and `rcml-h1-style` if those classes are applied. `rc-logo` receives its `src` from the theme if its `rc-class` attribute includes `rcml-logo-style`. See [Theme](/packages/rcml/email/concepts/basic/theme).

## Related

- [Rich text content](/packages/rcml/email/concepts/basic/rich-text-content) — how Email RFM produces the `content` field
- [Containers](/packages/rcml/email/concepts/basic/containers) — the column and section structure that elements live inside
