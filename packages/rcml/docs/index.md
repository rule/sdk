# @rule/rcml

`@rule/rcml` is the RCML (Rule Campaign Markup Language) library. It provides the
types, element factories, theme utilities, format converters, and validation functions
needed to build email and SMS templates that the Rule platform can render and send.

## Template formats

RCML templates exist in two equivalent formats.

**JSON AST (`RcmlDocument`)** is the canonical format. It is the format the Rule API
accepts when creating or updating a template, and the format produced by the element
factory functions in this package.

**XML** is a human-readable and LLM-friendly serialisation of the same structure. Text
content inside elements uses **Email RFM** (Rule Flavored Markdown) — a compact markdown
dialect — rather than the verbose ProseMirror nodes used in the JSON AST. Both formats
carry the same information and convert losslessly in either direction.

## What this package includes

### Element factories

Twenty-eight typed factory functions that construct `RcmlDocument` nodes. Each validates
its inputs at the call site and throws `RcmlElementBuildError` immediately on invalid
input.

```typescript
import {
  createRcmlDocumentElement,
  createHeadElement, createBodyElement,
  createSectionElement, createColumnElement,
  createTextElement, createHeadingElement, createButtonElement,
  createImageElement, createSpacerElement,
  createPreviewElement,
} from '@rule/rcml';
```

See [Building programmatically](/packages/rcml/email/building-programmatically) for a
full composition walkthrough.

### Content builders

Helpers for constructing the ProseMirror rich-text content that lives inside
`rc-text`, `rc-heading`, and `rc-button` elements. `createTextContent()` is the most
common entry point — it accepts an Email RFM markdown string and returns the ProseMirror JSON
document expected by the element factories.

```typescript
import { createTextContent, createInlineContent, createTextNode, createPlaceholderNode } from '@rule/rcml';

const content = createTextContent('Hi ::subscriber.first_name::, **your order** is confirmed.');
```

### Email RFM string builders

Utility functions that produce valid Email RFM syntax strings for use in template
copy. Reach them via the `email` namespace: `email.createCustomField`,
`email.createLoopValue`, `email.createLink`, `email.createFont`.

### Theme utilities

`createEmailTheme`, `applyTheme`, and `getTheme` manage the brand configuration stored
in `rc-head`. Applying a theme is what makes a template compatible with the Rule email
editor — it writes the brand-style reference, color defaults, font styles, and
social-link URLs into `rc-head` in the exact structure the editor expects.

```typescript
import { createEmailTheme, applyTheme, EmailThemeColorType } from '@rule/rcml';

const theme = createEmailTheme({
  brandStyleId: 10457,
  colors: [{ type: EmailThemeColorType.Primary, hex: '#05CC87' }],
});
const themedDoc = applyTheme(doc, theme);
```

See [Theme](/packages/rcml/email/concepts/basic/theme) for a full explanation of the
theme mechanism, and [Building programmatically](/packages/rcml/email/building-programmatically)
for usage in context.

### Format converters

Convert between JSON and XML in either direction:

| Function | Direction |
|---|---|
| `rcmlToXml(doc, options?)` | JSON AST → XML string |
| `xmlToRcml(xml)` | XML string → JSON AST (throws on error) |
| `safeXmlToRcml(xml)` | XML string → JSON AST (returns discriminated union) |
| `emailRfmToJson(rfm)` | RFM markdown → ProseMirror JSON |
| `jsonToEmailRfm(json)` | ProseMirror JSON → Email RFM markdown |

See [Building programmatically](/packages/rcml/email/building-programmatically) and
[Building with LLM](/packages/rcml/email/building-with-llm) for usage patterns.

### Validation

`validateEmailTemplate` (throwing) and `safeValidateEmailTemplate` (non-throwing) run
three passes — structural, attribute-value, and content — and return a unified issue
list with machine-readable error codes. Both accept either a JSON AST or an XML string.

See [Validation](/packages/rcml/email/validation) for full details.

### Schema specs

Three machine-readable constants that describe the full RCML schema for use in LLM
system prompts: `rcmlSpec`, `emailRfmSpec`, and `placeholderSpec`. Each is a plain
JSON-serializable object.

```typescript
import { rcmlSpec, emailRfmSpec, placeholderSpec } from '@rule/rcml';
// JSON.stringify and include in an LLM system prompt
```

See [Building with LLM](/packages/rcml/email/building-with-llm) for the recommended
prompting pattern.

## SMS templates

The SMS module provides a parallel set of utilities for building SMS messages. An SMS
template is a single `rc-sms` element whose body is written in **SMS RFM**
(SMS Rule Flavor Markdown). Dynamic values use the `::placeholder{…}` directive.

```typescript
import { createSmsDocument } from '@rule/rcml';

const doc = createSmsDocument({
  content: 'Hi ::placeholder{type="Subscriber" original="[Subscriber:FirstName]" name="First name"}! Your order has shipped.',
});
```

Three machine-readable spec constants for SMS LLM generation:

```typescript
import { smsSpec, smsRfmSpec, smsPlaceholderSpec } from '@rule/rcml';
```

See [SMS](/packages/rcml/sms/) for the full SMS module documentation.

## Related

- [Building programmatically](/packages/rcml/email/building-programmatically) — composing templates in code
- [Building with LLM](/packages/rcml/email/building-with-llm) — LLM-assisted generation
- [Validation](/packages/rcml/email/validation) — validating before submission
- [RCML reference](/packages/rcml/email/rcml/) — every element and its attributes
- [SMS](/packages/rcml/sms/) — SMS template module
