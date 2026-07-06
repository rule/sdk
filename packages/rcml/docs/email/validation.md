# Validation

`validateEmailTemplate` and `safeValidateEmailTemplate` check an RCML document against
the full RCML schema before rendering or sending. Both accept either an `RcmlDocument`
JSON AST or an RCML XML string and return the same structured issue list.

Validation is the primary guard in an LLM-assisted template workflow: generate a draft,
validate it, surface any errors as structured feedback, and iterate. The `errors` array
on a failed result is designed to be fed directly back into an LLM prompt.

## Choosing a variant

| Function | On failure |
|---|---|
| `validateEmailTemplate` | Throws `EmailTemplateValidationError` |
| `safeValidateEmailTemplate` | Returns `{ success: false, errors }` |

Use `validateEmailTemplate` when invalid input is a programming error and you want an
immediate exception. Use `safeValidateEmailTemplate` when you need to inspect or forward
the issue list.

```typescript
import { validateEmailTemplate, safeValidateEmailTemplate } from '@rule/rcml';

// Throwing variant
const doc = validateEmailTemplate(xmlString);

// Non-throwing variant
const result = safeValidateEmailTemplate(xmlString);
if (!result.success) {
  console.error(result.errors);
}
```

## Input formats

Both functions accept either format:

| Input | When to use |
|---|---|
| `string` | RCML XML produced by an LLM or serialisation step |
| `RcmlDocument` | JSON AST from the RCML builder or `xmlToRcml` |

When the input is a string it is parsed via `xmlToRcml` first. A parse failure produces
an `XML_PARSE_ERROR` issue immediately — no further passes run.

## Validation passes

The validator runs three sequential passes and merges their results into one issue list:

1. **Structural** — verifies tag names, required tags, parent–child relationships, and child-count constraints against the RCML JSON Schema.
2. **Attribute values** — checks that every attribute has an accepted value (for example, `align` must be `"left"`, `"center"`, or `"right"`).
3. **Content** — validates the ProseMirror-shaped rich-text content inside text nodes.

All three passes run on every call. A failure in the first pass does not suppress later
passes — you get the full picture in one round-trip.

## Issue shape

Each detected problem is an `EmailTemplateValidationIssue`:

```typescript
type EmailTemplateValidationIssue = {
  path: string;               // RFC 6901 JSON Pointer (e.g. "/children/1/attributes/width")
  code: EmailTemplateErrorCode;
  message: string;            // human-readable description
};
```

An empty `path` means the issue applies to the root of the document.

## Error codes

| Code | Meaning |
|---|---|
| `XML_PARSE_ERROR` | The XML string could not be parsed |
| `ROOT_INVALID` | The root element is not `<rcml>` |
| `TAG_UNKNOWN` | An element tag is not part of the RCML schema |
| `TAG_MISSING` | A required element is absent |
| `CHILD_INVALID` | A child element is not allowed inside its parent |
| `CHILD_TOO_MANY` | A parent has more children than allowed |
| `CHILD_COUNT_INVALID` | The number of children does not meet a cardinality constraint |
| `ATTR_UNKNOWN` | An attribute is not recognised on its element |
| `ATTR_REQUIRED_MISSING` | A required attribute is absent |
| `ATTR_INVALID_VALUE` | An attribute has a value of the wrong type or outside the allowed set |
| `CONTENT_INVALID` | The ProseMirror content inside a text node is malformed |
| `LEAF_HAS_CHILDREN` | A leaf element unexpectedly contains children |
| `SCHEMA_VIOLATION` | A generic schema constraint was violated |

All codes are also available as the `EmailTemplateErrorCodes` constant so you can compare
without string literals:

```typescript
import { EmailTemplateErrorCodes, safeValidateEmailTemplate } from '@rule/rcml';

const result = safeValidateEmailTemplate(doc);
if (!result.success) {
  const attrErrors = result.errors.filter(
    (e) => e.code === EmailTemplateErrorCodes.ATTR_INVALID_VALUE,
  );
}
```

## `EmailTemplateValidationError`

`validateEmailTemplate` throws this error class on failure:

```typescript
class EmailTemplateValidationError extends Error {
  readonly errors: EmailTemplateValidationIssue[];
}
```

`.errors` contains every issue found across all three passes. `.message` is a short
summary of the first five issues followed by `"…and N more"` when there are additional
ones.

## Related

- [`safeValidateEmailTemplate`](/api/rcml/src/functions/safeValidateEmailTemplate) — API reference
- [`validateEmailTemplate`](/api/rcml/src/functions/validateEmailTemplate) — API reference
- [`EmailTemplateErrorCodes`](/api/rcml/src/variables/EmailTemplateErrorCodes) — API reference
