# Validation

`@rule/rcml` provides three distinct validation entry points for SMS templates, each
targeting a different stage of the document lifecycle:

- **Document validation** — validate a complete `SmsDocument` before submitting to Rule.
- **Content validation** — validate a raw `SmsContentJson` in isolation.
- **XML parsing errors** — errors produced during XML → `SmsDocument` conversion.

Validation is the primary guard in an LLM-assisted or code-driven workflow: generate a
draft, validate it, surface errors as structured feedback, and iterate. The `errors`
arrays returned on failure are designed to be forwarded directly to an LLM prompt.

## Document validation

Use document-level validation when you have an `SmsDocument` object (from
`createSmsDocument`, `xmlToSms`, or built by hand) and want to confirm it is ready to
submit.

| Function | On failure |
|----------|-----------|
| `validateSmsDocument` | Throws `SmsDocumentValidationError` |
| `safeValidateSmsDocument` | Returns `{ success: false, errors }` |

```typescript
import { validateSmsDocument, safeValidateSmsDocument } from '@rule/rcml';

// Throwing variant — use when invalid input is a programming error
const doc = validateSmsDocument(candidate);

// Non-throwing variant — use when you need to inspect or forward the error list
const result = safeValidateSmsDocument(candidate);
if (!result.success) {
  console.error(result.errors);
}
```

The validator runs two sequential passes on every call:

1. **Structural** — verifies that `tagName` is `'rc-sms'`, `attributes` is an empty
   object, and `content` is present.
2. **Content** — validates the `SmsContentJson` against the SMS JSON Schema (via AJV),
   checking that only valid node types, mark types, and placeholder `type` values are
   used.

Both passes always run. A failure in the first pass does not suppress the second — you
get the full issue list in a single call.

### Document error codes

| Code | Meaning |
|------|---------|
| `STRUCTURE_INVALID` | `tagName`, `attributes`, or the presence of `content` failed structural checks |
| `CONTENT_REQUIRED` | The `content` field is null or missing |
| `CONTENT_INVALID` | The `SmsContentJson` value failed JSON Schema validation |

All codes are available on the `SmsDocumentErrorCodes` constant:

```typescript
import { SmsDocumentErrorCodes, safeValidateSmsDocument } from '@rule/rcml';

const result = safeValidateSmsDocument(doc);
if (!result.success) {
  const structureErrors = result.errors.filter(
    (e) => e.code === SmsDocumentErrorCodes.STRUCTURE_INVALID,
  );
  const contentErrors = result.errors.filter(
    (e) => e.code === SmsDocumentErrorCodes.CONTENT_INVALID,
  );
}
```

## Content validation

Use content-level validation when you have a raw `SmsContentJson` value — for example,
when receiving editor state from the Rule frontend — and want to validate it before
embedding it in a document.

| Function | On failure |
|----------|-----------|
| `validateSmsJson` | Throws `SmsContentParseError` |
| `safeParseSmsJson` | Returns `{ success: false, errors }` |

```typescript
import { validateSmsJson, safeParseSmsJson } from '@rule/rcml';

// Throwing variant
const content = validateSmsJson(rawJson);

// Non-throwing variant
const result = safeParseSmsJson(rawJson);
if (!result.success) {
  console.error(result.errors);
  // Each error: { path: string, message: string }
}
```

`validateSmsJson` and `safeParseSmsJson` validate against the SMS JSON Schema only —
they do not check the `tagName` or `attributes` fields (those are document-level
concerns). Use `safeValidateSmsDocument` when you have a complete `SmsDocument`.

## Error types

### `SmsDocumentValidationError`

Thrown by `validateSmsDocument`. The `.errors` array contains every issue found across
both validation passes:

```typescript
class SmsDocumentValidationError extends Error {
  readonly errors: SmsDocumentValidationIssue[];
}

type SmsDocumentValidationIssue = {
  path: string;                  // JSON Pointer into the SmsDocument, e.g. '/content/content/0'
  code: SmsDocumentErrorCode;    // from SmsDocumentErrorCodes
  message: string;               // human-readable description
};
```

### `SmsContentParseError`

Thrown by `validateSmsJson`. The `.errors` array contains AJV-derived schema violations:

```typescript
class SmsContentParseError extends Error {
  readonly errors: SmsContentValidationError[];
}

type SmsContentValidationError = {
  path: string;
  message: string;
};
```

### `SmsDocumentBuildError`

Thrown by `createSmsDocument` when a pre-built `SmsContentJson` is passed and fails
validation. Its `.errors` array has the same shape as `SmsDocumentValidationIssue`.
It is not thrown when passing an SMS RFM string — parsing errors from `smsRfmToJson`
surface as `RcmlValidationError` instead.

### `SmsXmlParseError`

Thrown by `xmlToSms` when XML parsing or `rc-sms` root validation fails. Use
`safeXmlToSms` for the non-throwing variant:

```typescript
import { safeXmlToSms, SmsXmlErrorCodes } from '@rule/rcml';

const result = safeXmlToSms(xmlString);
if (!result.success) {
  const parseFailures = result.errors.filter(
    (e) => e.code === SmsXmlErrorCodes.XML_PARSE_ERROR,
  );
}
```

### XML error codes

| Code | Meaning |
|------|---------|
| `XML_PARSE_ERROR` | The XML string could not be parsed |
| `ROOT_INVALID` | The root element is not `<rc-sms>` |
| `SMS_RFM_PARSE_ERROR` | The text content inside `<rc-sms>` is not valid SMS RFM |

## Complete validation pipeline

The full recommended pattern when importing a document from an untrusted source:

```typescript
import { safeXmlToSms, safeValidateSmsDocument } from '@rule/rcml';

async function importSmsTemplate(xmlString: string) {
  // Step 1: parse XML
  const parsed = safeXmlToSms(xmlString);
  if (!parsed.success) {
    return { ok: false, errors: parsed.errors };
  }

  // Step 2: validate document structure and content
  const validated = safeValidateSmsDocument(parsed.data);
  if (!validated.success) {
    return { ok: false, errors: validated.errors };
  }

  // validated.data is ready to submit
  return { ok: true, doc: validated.data };
}
```

## Related

- [Building programmatically](./building-programmatically) — constructing and importing documents
- [Building with LLM](./building-with-llm) — using validation errors as LLM feedback
- [`validateSmsDocument`](/api/rcml/src/functions/validateSmsDocument) — API reference
- [`safeValidateSmsDocument`](/api/rcml/src/functions/safeValidateSmsDocument) — API reference
- [`validateSmsJson`](/api/rcml/src/functions/validateSmsJson) — API reference
- [`safeParseSmsJson`](/api/rcml/src/functions/safeParseSmsJson) — API reference
- [`safeXmlToSms`](/api/rcml/src/functions/safeXmlToSms) — API reference
- [`SmsDocumentErrorCodes`](/api/rcml/src/variables/SmsDocumentErrorCodes) — API reference
- [`SmsXmlErrorCodes`](/api/rcml/src/variables/SmsXmlErrorCodes) — API reference
