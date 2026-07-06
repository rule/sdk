# Building programmatically

The `@rule/rcml` package exports a set of typed factory functions that build an
`RcmlDocument` JSON AST bottom-up. Each factory validates its inputs immediately and
throws `RcmlElementBuildError` if something is wrong — errors surface at the call site,
not at render time.

## Building a document

Documents are composed from the inside out: content first, then layout, then the
document root.

```typescript
import {
  createRcmlDocumentElement,
  createHeadElement,
  createBodyElement,
  createSectionElement,
  createColumnElement,
  createTextElement,
  createHeadingElement,
  createButtonElement,
  createImageElement,
  createSpacerElement,
  createPreviewElement,
  createTextContent,
} from '@rule/rcml';

// 1. Head — preheader text shown in inbox previews
const head = createHeadElement({
  children: [
    createPreviewElement({ content: 'Your order has been confirmed' }),
  ],
});

// 2. Content elements
const heading = createHeadingElement({
  attrs: { level: '1' },
  content: createTextContent('Order confirmed'),
});

const body = createTextElement({
  content: createTextContent(
    'Hi ::subscriber.first_name::,\n\nYour order has been confirmed.',
  ),
});

const cta = createButtonElement({
  attrs: { href: '::order_url::' },
  content: createTextContent('View order'),
});

// 3. Layout — column → section → body
const column = createColumnElement({ children: [heading, body, createSpacerElement(), cta] });
const section = createSectionElement({ children: [column] });
const emailBody = createBodyElement({ children: [section] });

// 4. Document root
const doc = createRcmlDocumentElement({ head, body: emailBody });
```

## Writing content

Text inside `rc-text`, `rc-heading`, and `rc-button` elements is always stored as a
ProseMirror JSON document. The easiest way to produce one is `createTextContent()`,
which accepts an Email RFM string — a compact markdown dialect designed for email copy.

```typescript
import { createTextContent } from '@rule/rcml';

// Plain text
createTextContent('Hello world')

// Bold and italic
createTextContent('Your order **#1234** has shipped. _Thank you_ for your purchase.')

// Link
createTextContent('[Track your shipment](::tracking_url::)')

// Subscriber merge field (placeholder)
createTextContent('Hi ::subscriber.first_name::,')

// Multiple paragraphs — blank line between them
createTextContent('First paragraph.\n\nSecond paragraph.')
```

For fine-grained control — inline styled spans, custom placeholders with fallbacks, or
loop values — use the inline node builders instead:

```typescript
import {
  createInlineContent,
  createTextNode,
  createPlaceholderNode,
} from '@rule/rcml';

const content = createInlineContent([
  createTextNode('Hi '),
  createPlaceholderNode('first_name', 42, { original: 'there' }),
  createTextNode('!'),
]);
```

## Applying a theme

A bare document built with the factories above has no brand colours, fonts, or style
defaults in its `rc-head`. The Rule email editor reads these values from `rc-head` to
render the template correctly and to populate the editor's style controls. Without them
the template renders with no brand identity and cannot be edited normally in Rule.

`applyTheme()` writes the full brand configuration into `rc-head` in the exact structure
the editor expects:

```
rc-head
  ├── rc-brand-style         ← links the template to a Rule brand profile
  ├── rc-attributes          ← default colors applied to body, sections, and buttons
  │    ├── rc-body           ← background color
  │    ├── rc-section        ← body color
  │    ├── rc-button         ← primary (CTA) color
  │    ├── rc-class "rcml-brand-color"
  │    ├── rc-class "rcml-logo-style"
  │    ├── rc-class "rcml-p-style"
  │    ├── rc-class "rcml-h1-style"  … h2, h3, h4, label
  │    └── rc-social         ← social link URLs
  └── rc-font …              ← one per custom web font
```

Use `createEmailTheme()` to build a theme object, then pass it to `applyTheme()`:

```typescript
import {
  createEmailTheme,
  applyTheme,
  EmailThemeColorType,
  EmailThemeImageType,
  EmailThemeFontStyleType,
  EmailThemeSocialLinkType,
} from '@rule/rcml';

const theme = createEmailTheme({
  // Link to the Rule brand profile that owns this template.
  // The editor uses this ID to load the brand's style settings.
  brandStyleId: 10457,

  colors: [
    { type: EmailThemeColorType.Primary,    hex: '#05CC87' }, // buttons
    { type: EmailThemeColorType.Secondary,  hex: '#F6F8F9' }, // accent class
    { type: EmailThemeColorType.Body,       hex: '#FFFFFF' }, // section backgrounds
    { type: EmailThemeColorType.Background, hex: '#F3F3F3' }, // outer body
  ],

  images: [
    { type: EmailThemeImageType.Logo, url: 'https://cdn.example.com/logo.png' },
  ],

  fonts: [
    { fontFamily: 'Merriweather', url: 'https://fonts.googleapis.com/css2?family=Merriweather' },
  ],

  fontStyles: [
    { type: EmailThemeFontStyleType.Paragraph, fontSize: '16px', color: '#0F0F1F' },
    { type: EmailThemeFontStyleType.H1,        fontSize: '36px', fontWeight: '700' },
  ],

  links: [
    { type: EmailThemeSocialLinkType.Instagram, url: 'https://instagram.com/yourhandle' },
    { type: EmailThemeSocialLinkType.Facebook,  url: 'https://facebook.com/yourpage' },
  ],
});

const themedDoc = applyTheme(doc, theme);
```

`applyTheme` is non-mutating — it returns a new document and leaves `doc` unchanged.
Any slot you do not specify keeps its default value.

`createEmailTheme()` called with no arguments produces a fully-populated theme using the
default colours, Helvetica font styles, and placeholder social URLs. This is useful for
scaffolding or when you intend to let the user configure the brand in the Rule editor
after the template is created.

### Reading a theme back

`getTheme()` extracts the theme from an existing document's `rc-head`. Any missing slots
are filled with defaults:

```typescript
import { getTheme } from '@rule/rcml';

const theme = getTheme(themedDoc);
console.log(theme.colors); // [{ type: 'Primary', hex: '#05CC87' }, ...]
```

This is useful for reading a template that was created in the Rule editor, modifying it,
and writing it back.

## Exporting as XML

`rcmlToXml()` converts a JSON document to an XML string. The ProseMirror content inside
text elements is serialised back to Email RFM, making the output easy to read and diff.

```typescript
import { rcmlToXml } from '@rule/rcml';

const xml = rcmlToXml(themedDoc, { prettyPrint: true });
console.log(xml);
```

Common uses:
- Inspecting a generated template during development.
- Storing templates outside Rule — in a CMS, git repository, or configuration file.
- Passing a template to a system or integration that expects XML.

## Importing from XML

If a template is stored as XML, convert it back to JSON and validate before use:

```typescript
import { safeXmlToRcml, safeValidateEmailTemplate } from '@rule/rcml';

const parsed = safeXmlToRcml(xmlString);
if (!parsed.success) {
  // handle parse errors
  console.error(parsed.errors);
}

const validated = safeValidateEmailTemplate(parsed.data);
if (!validated.success) {
  // handle validation errors
  console.error(validated.errors);
}

// validated.data is the RcmlDocument, ready to use or submit
```

## Related

- [Building with LLM](/packages/rcml/email/building-with-llm) — LLM-assisted template generation
- [Validation](/packages/rcml/email/validation) — validating a template before submission
- [Theme](/packages/rcml/email/concepts/basic/theme) — theme concepts and the `rc-head` structure
- [`applyTheme`](/api/rcml/src/functions/applyTheme) — API reference
- [`createEmailTheme`](/api/rcml/src/functions/createEmailTheme) — API reference
- [`rcmlToXml`](/api/rcml/src/functions/rcmlToXml) — API reference
- [`xmlToRcml`](/api/rcml/src/functions/xmlToRcml) — API reference
