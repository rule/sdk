# Building with LLM

LLMs can generate RCML templates in both XML and JSON formats. The Rule API requires
JSON — if the LLM produces XML, one conversion step bridges the gap. You can also
convert a finished JSON template back to XML when you need a human-readable form.

## Providing schema context

Without context about the RCML schema, an LLM will produce the simplest template it
can: a heading, a paragraph, maybe a button. It won't know about loops, switches,
alignment, social blocks, placeholders, merge fields, custom fonts, or the full set of
attributes each element accepts.

Pasting this documentation into a system prompt solves that, but at the cost of a large
token budget on every call. `@rule/rcml` exports three purpose-built, machine-readable
spec constants that describe the schema concisely. Each is a plain object — serialize it
to JSON and include it in the system prompt once, at the start of a session.

```typescript
import { rcmlSpec, emailRfmSpec, placeholderSpec } from '@rule/rcml';

const systemPrompt = `
You generate RCML email templates.

RCML element schema:
${JSON.stringify(rcmlSpec)}

Rich-text content (Email RFM) syntax:
${JSON.stringify(emailRfmSpec)}

Placeholder and merge-field tokens:
${JSON.stringify(placeholderSpec)}

Output valid RCML XML. Text content inside rc-text, rc-heading, and rc-button uses Email RFM
markdown syntax as described in the Email RFM spec above.
`;
```

### What each spec covers

**`rcmlSpec`** — every RCML XML element: its category, description, allowed children,
maximum child count, and the full attribute table for each element (type, required,
default value, allowed values, description, examples). This is the primary reference the
LLM needs to produce structurally correct XML.

**`emailRfmSpec`** — the two RFM content flavors (`rcml-content` for full blocks and
`inline-rcml-content` for buttons), every node type (paragraph, lists, alignment,
hard break, placeholder, loop-value), and every mark (font styling, links) with their
attributes. Without this the LLM won't know it can produce multi-paragraph blocks,
bulleted lists, aligned sections, or styled inline text inside content elements.

**`placeholderSpec`** — every merge-field and dynamic token the Rule template engine
supports: subscriber fields, custom fields, dates, remote content, loop values, promo
codes, and more. Each entry includes the exact syntax pattern, required and optional
parameters, allowed values, and examples. Without this the LLM falls back to
inventing its own placeholder syntax that the engine won't recognise.

## Why XML is a natural LLM output format

XML is often the better format to request from an LLM:

- Tag-based structure is similar to HTML, which is well-represented in LLM training data.
- Rich-text content inside text elements (`rc-text`, `rc-heading`, `rc-button`) is written
  in **Email RFM** — a compact markdown dialect — rather than verbose ProseMirror JSON nodes.

Example of what LLM-generated XML looks like:

```xml
<rcml>
  <rc-head>
    <rc-preview>Your order is confirmed</rc-preview>
  </rc-head>
  <rc-body>
    <rc-section>
      <rc-column>
        <rc-heading level="1">Order confirmed</rc-heading>
        <rc-text>
          Hi ::subscriber.first_name::,

          Your order **#[CustomField:Order.Number]** has been confirmed.

          [View your order](::order_url::)
        </rc-text>
        <rc-button href="::order_url::">View order</rc-button>
      </rc-column>
    </rc-section>
  </rc-body>
</rcml>
```

## The LLM → Rule pipeline

Convert and validate before submitting:

```typescript
import { safeXmlToRcml, safeValidateEmailTemplate } from '@rule/rcml';

// 1. LLM produces XML
const xmlString = await llm.generate(prompt);

// 2. Parse XML → JSON
const parsed = safeXmlToRcml(xmlString);
if (!parsed.success) {
  // Feed errors back to the LLM for correction
  return feedbackToLlm(parsed.errors);
}

// 3. Validate against the RCML schema
const validated = safeValidateEmailTemplate(parsed.data);
if (!validated.success) {
  return feedbackToLlm(validated.errors);
}

// validated.data is the RcmlDocument, ready to submit
```

`safeXmlToRcml` parses Email RFM content inside text elements into ProseMirror JSON
automatically — no separate step is needed.

## Generating JSON directly

LLMs can also be prompted to output the JSON AST (`RcmlDocument`) directly, skipping
the conversion step. The trade-off is that the prompt must describe the ProseMirror
content structure for text nodes — more verbose than the equivalent Email RFM markdown.
Pass `emailRfmSpec` anyway so the LLM understands how content nodes are shaped.

Validate before using regardless of format:

```typescript
import { safeValidateEmailTemplate } from '@rule/rcml';

const doc = JSON.parse(await llm.generate(jsonPrompt));
const result = safeValidateEmailTemplate(doc);

if (result.success) {
  // result.data is the validated RcmlDocument, ready to submit
}
```

## Outputting XML for humans

`rcmlToXml()` converts a validated JSON template back to XML. Use this when:

- Showing the template to a user in a readable format.
- Storing templates outside Rule — in a CMS, git repository, or integration config.
- Letting users edit a template in XML before it is re-submitted.

```typescript
import { rcmlToXml } from '@rule/rcml';

const xml = rcmlToXml(validated.data, { prettyPrint: true });
// display, store, or return xml to the user
```

## Related

- [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) — RCML element schema for system prompts
- [`emailRfmSpec`](/api/rcml/src/variables/emailRfmSpec) — RFM content syntax for system prompts
- [`placeholderSpec`](/api/rcml/src/variables/placeholderSpec) — merge-field token syntax for system prompts
- [Validation](/packages/rcml/email/validation) — structured error feedback for LLM correction
- [Building programmatically](/packages/rcml/email/building-programmatically) — builder-based workflow
- [`safeXmlToRcml`](/api/rcml/src/functions/safeXmlToRcml) — API reference
- [`rcmlToXml`](/api/rcml/src/functions/rcmlToXml) — API reference
