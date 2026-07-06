# Building with LLM

LLMs can generate SMS templates as SMS RFM strings or as `SmsContentJson` JSON. The
`@rule/rcml` package exports three machine-readable spec constants that describe the
complete SMS schema concisely. Serialize them to JSON and include them in a system
prompt once, at the start of a session.

## Providing schema context

Without schema context, an LLM will invent its own placeholder syntax or produce JSON
that does not match the `SmsContentJson` shape. The three spec objects give the model
everything it needs to produce correct output:

```typescript
import { smsSpec, smsRfmSpec, smsPlaceholderSpec } from '@rule/rcml';

const systemPrompt = `
You generate Rule.io SMS templates as SMS RFM strings.

SMS element schema:
${JSON.stringify(smsSpec)}

SMS RFM content syntax:
${JSON.stringify(smsRfmSpec)}

Placeholder and merge-field tokens valid in SMS:
${JSON.stringify(smsPlaceholderSpec)}

Output a single SMS RFM string — the message body only.
Use [Type:Name] tokens for dynamic values as described in the placeholder spec.
Use a single newline for a line break within the same message.
`;
```

## The spec objects

**`smsSpec`** — describes the `rc-sms` element: its description and the content type
identifier (`sms-rfm-content`). Use this to orient the model on the overall template
structure.

**`smsRfmSpec`** — describes the `sms-rfm-content` flavor: the three valid top-level
JSON node types (`message`, `link`, `placeholder`), each with a full attribute table.
Includes the exact attribute names, types, required flags, and allowed values for each.
Cross-references `smsPlaceholderSpec` for placeholder `type` values.

**`smsPlaceholderSpec`** — the five user-authored token types valid in SMS: `CustomField`,
`Subscriber`, `User`, `Date`, and `RemoteContent`. Each entry has the exact token syntax,
parameter descriptions, allowed values, and examples. The `Link` type is system-only —
generated exclusively by `::unsubscribe` / `createUnsubscribeNodes()`, not user-authored.

## Tag structure

`smsSpec.tags['rc-sms']` describes the one allowed element:

```typescript
import { smsSpec } from '@rule/rcml';

smsSpec.tags['rc-sms']
// {
//   description: 'Root element of an SMS document…',
//   content: { type: 'sms-rfm-content' },
// }

// Cross-reference with smsRfmSpec using the content type key:
const contentType = smsSpec.tags['rc-sms'].content.type;
// → 'sms-rfm-content'
const flavor = smsRfmSpec.flavors[contentType];
```

## Content model

`smsRfmSpec.flavors['sms-rfm-content']` tells the model which node types are valid at
the top level of an SMS document:

```typescript
import { smsRfmSpec } from '@rule/rcml';

smsRfmSpec.flavors['sms-rfm-content']
// {
//   description: 'SMS RFM … flat sequence of top-level nodes …',
//   topLevelNodes: ['message', 'link', 'placeholder'],
//   blockNodes: [],
//   inlineNodes: [],
//   marks: [],
// }

// Attribute schema for the link node:
smsRfmSpec.nodes['link'].attrs
// {
//   text:    { type: 'string',  required: true,  description: 'The URL…' },
//   track:   { type: 'boolean', required: true,  description: '…' },
//   shorten: { type: 'boolean', required: true,  description: '…' },
// }

// User-authored placeholder types (Link is system-only via ::unsubscribe):
smsRfmSpec.nodes['placeholder'].attrs?.['type'].allowedValues
// → ['CustomField', 'Subscriber', 'User', 'RemoteContent', 'Date']
```

Note that the link node's `track` and `shorten` flags are typed as **booleans**
in `SmsContentJson` — make sure the LLM emits `true`/`false`, not the strings
`"true"`/`"false"`, when generating JSON output.

## Placeholders

`smsPlaceholderSpec.tokens` contains one entry per user-authored token type valid in SMS:

```typescript
import { smsPlaceholderSpec } from '@rule/rcml';

Object.keys(smsPlaceholderSpec.tokens)
// → ['CustomField', 'Subscriber', 'User', 'Date', 'RemoteContent']

// Subscriber field syntax and examples:
smsPlaceholderSpec.tokens['Subscriber']
// { syntax: '[Subscriber:<field>]', examples: ['[Subscriber:email]', ...], ... }
```

`Link` is not in `smsPlaceholderSpec.tokens` because it is system-only — always produced
by the `::unsubscribe` directive, never authored directly. Direct LLMs to use `::unsubscribe`
for the required footer rather than `[Link:Unsubscribe]` or any `[Link:…]` token.

## Generation workflow

### SMS RFM string (recommended)

SMS RFM is the easiest output format for an LLM to produce correctly. Ask the model to
output the message body as a single SMS RFM string, then parse and validate:

```typescript
import { smsRfmToJson, createSmsDocument, safeValidateSmsDocument } from '@rule/rcml';

// 1. LLM produces an SMS RFM string
const rfmString = await llm.generate(systemPrompt + '\n\nGenerate a shipping confirmation.');

// 2. Parse and build the document (throws SmsDocumentBuildError on failure)
const doc = createSmsDocument({ content: rfmString });

// 3. Or use the safe variant to inspect errors without a try/catch:
const content = smsRfmToJson(rfmString);
const result = safeValidateSmsDocument({ tagName: 'rc-sms', content });

if (!result.success) {
  // Feed result.errors back to the LLM for correction
  const feedback = result.errors.map((e) => `[${e.code}] ${e.path}: ${e.message}`).join('\n');
  return feedbackToLlm(feedback);
}

// result.data is the validated SmsDocument, ready to submit
```

### JSON AST (when precise link control is needed)

If the message requires links with specific tracking/shortening settings, prompt
the LLM to output `SmsContentJson` directly and validate with `safeParseSmsJson`:

```typescript
import { safeParseSmsJson, createSmsDocument } from '@rule/rcml';

// LLM produces a SmsContentJson object
const rawJson = JSON.parse(await llm.generate(jsonPrompt));

// Validate the content JSON
const parsed = safeParseSmsJson(rawJson);
if (!parsed.success) {
  return feedbackToLlm(parsed.errors);
}

// Wrap in SmsDocument
const doc = createSmsDocument({ content: parsed.data });
```

For this path, include `smsRfmSpec` in the system prompt so the model knows the exact
shape of every node and the boolean types of `track` and `shorten`.

## Output format trade-offs

| Format | LLM difficulty | Notes |
|--------|---------------|-------|
| SMS RFM string | Easy — compact, familiar | Recommended. Use `:link[url]{…}` for hyperlinks and `::placeholder{…}` for dynamic values. |
| `SmsContentJson` JSON | Harder — verbose tree shape | Use only when you need to produce nodes directly with specific link settings. |
| XML (`<rc-sms>…</rc-sms>`) | Easy — familiar XML | The body of `<rc-sms>` is itself an SMS RFM string, so generation difficulty matches SMS RFM. |

## Related

- [`smsSpec`](/api/rcml/src/variables/smsSpec) — SMS element schema for system prompts
- [`smsRfmSpec`](/api/rcml/src/variables/smsRfmSpec) — SMS RFM content model for system prompts
- [`smsPlaceholderSpec`](/api/rcml/src/variables/smsPlaceholderSpec) — SMS token syntax for system prompts
- [Validation](./validation) — structured error feedback for LLM correction
- [Building programmatically](./building-programmatically) — constructing documents in code
