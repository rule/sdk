# Flavors

SMS RCML has a single content flavor. The flavor is fixed — the `<rc-sms>`
element always uses **SMS RFM**.

## SMS RFM

**SMS RFM** (SMS Rule Flavor Markdown) is a directive-only markdown dialect for
SMS message bodies. There is no block structure — the entire body is a flat
sequence of text, links, and dynamic placeholders. Newlines are preserved
literally in the output.

Parsed by `smsRfmToJson()`. Serialised back to SMS RFM by `jsonToSmsRfm()`.

### Supported constructs

| Syntax | Produces | Description |
|--------|----------|-------------|
| Plain text | [`message`](./nodes/message) node | Static text, including embedded `\n` for line breaks |
| `:link[url]{track shorten}` | [`link`](./nodes/link) node | Trackable / shortened URL |
| `::placeholder{…}` | [`placeholder`](./nodes/placeholder) node | Dynamic merge-tag (subscriber field, custom field, date, …) |
| `[Type:Name]` shorthand | [`placeholder`](./nodes/placeholder) node | Compact alias for `::placeholder{…}` |
| `::unsubscribe` | `message` + `placeholder` pair | Required unsubscribe footer — see [Unsubscription](../concepts/unsubscription) |

### Machine-readable spec

The full flavor spec is available as `smsRfmSpec`:

```typescript
import { smsRfmSpec } from '@rule/rcml';

smsRfmSpec.flavors['sms-rfm-content'].topLevelNodes
// → ['message', 'link', 'placeholder']
```
