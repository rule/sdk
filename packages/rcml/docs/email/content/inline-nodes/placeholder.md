# `placeholder`

An inline atom that is replaced at render time with a dynamic value — a subscriber field, custom field, user attribute, remote content, or date.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `type` | — | `"CustomField"` \| `"Subscriber"` \| `"User"` \| `"RemoteContent"` \| `"Date"` | `"Subscriber"` | The placeholder category. Determines what `value` and `original` contain. |
| `value` | — | string \| number \| null | `"email"` | The field identifier. A **number** for `CustomField`; a **string** for `Subscriber`, `User`, `RemoteContent`; **null** for `Date`. |
| `name` | — | string | `"Email"` | Human-readable display label shown in the editor chip. |
| `original` | — | string | `"[Subscriber:email]"` | The canonical backend token string. The renderer substitutes this token at send time. |
| `max-length` | `null` | string \| null | `"20"` | Maximum character length. Supported for `CustomField` only; truncates the value and appends `…`. |

## Children

None (inline atom, leaf node).

## Parent nodes

- `paragraph`

## Available in

- Full Email RFM (`rc-text`, `rc-heading`)
- Email Inline RFM (`rc-button`)

## Subscriber

Inserts a standard subscriber profile field.

| `value` | `name` | Plain-text token |
|---------|--------|-----------------|
| `"email"` | `"Email"` | `[Subscriber:email]` |
| `"phone_number"` | `"Phone number"` | `[Subscriber:phone_number]` |
| `"language"` | `"Language"` | `[Subscriber:language]` |

**JSON:**

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "Subscriber",
    "value": "email",
    "name": "Email",
    "original": "[Subscriber:email]",
    "max-length": null
  }
}
```

**Email RFM:**

```
Dear ::placeholder{type="Subscriber" value="email" name="Email" original="[Subscriber:email]"},
```

**Plain text:**

```
[Subscriber:email]
```

---

## User

Inserts a field from the sender (Rule.io account) profile.

| `value` | `name` | Plain-text token |
|---------|--------|-----------------|
| `"CompanyName"` | `"Company name"` | `[User:CompanyName]` |
| `"Street"` | `"Street"` | `[User:Street]` |
| `"Zip"` | `"Zip"` | `[User:Zip]` |
| `"City"` | `"City"` | `[User:City]` |
| `"EmailAddress"` | `"Email address"` | `[User:EmailAddress]` |

**JSON:**

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "User",
    "value": "CompanyName",
    "name": "Company name",
    "original": "[User:CompanyName]",
    "max-length": null
  }
}
```

**Email RFM:**

```
Sent by ::placeholder{type="User" value="CompanyName" name="Company name" original="[User:CompanyName]"}
```

**Plain text:**

```
[User:CompanyName]
```

---

## CustomField

Inserts a subscriber custom field value. The `value` attribute holds the **numeric ID** of the field (coerced from string to number by the parser). The `original` token identifies the field by `Group.Field` name — never by numeric ID.

`max-length` is supported: append `::N` to the `original` token and set `max-length` to the same number as a string.

**JSON:**

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "CustomField",
    "value": 13,
    "name": "Order.Total",
    "original": "[CustomField:Order.Total]",
    "max-length": null
  }
}
```

With truncation to 20 characters:

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "CustomField",
    "value": 13,
    "name": "Order.Total",
    "original": "[CustomField:Order.Total::20]",
    "max-length": "20"
  }
}
```

**Email RFM:**

```
Your total: ::placeholder{type="CustomField" value="13" name="Order.Total" original="[CustomField:Order.Total]"}
```

**Plain text:**

```
[CustomField:Order.Total]
[CustomField:Order.Total::20]
```

---

## Date

Inserts a formatted date computed at send time. `value` is always `null`. The date source and output format are encoded entirely in `original`.

**Date source** (`type` param in token):

| Source | Plain-text token |
|--------|-----------------|
| Current date | `[Date:now::Y-m-d]` |
| Tomorrow | `[Date:tomorrow::Y-m-d]` |
| Yesterday | `[Date:yesterday::Y-m-d]` |
| N days from now | `[Date:in-2-days::Y-m-d]` |
| N days ago | `[Date:3-days-ago::Y-m-d]` |
| Subscriber custom field | `[Date:[CustomField:Order.CreatedAt]::Y-m-d]` |

**Format** (`format` param in token): PHP date format string. Supported values: `Y-m-d`, `d.m.Y`, `m-d-Y`, `m/d/Y`, `d/m/Y`.

**JSON:**

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "Date",
    "value": null,
    "name": "Tomorrow",
    "original": "[Date:tomorrow::d.m.Y]",
    "max-length": null
  }
}
```

**Email RFM:**

```
Offer valid until ::placeholder{type="Date" name="Tomorrow" original="[Date:tomorrow::d.m.Y]"}
```

**Plain text:**

```
[Date:tomorrow::d.m.Y]
[Date:in-2-days::Y-m-d]
[Date:[CustomField:Order.CreatedAt]::Y-m-d]
```

---

## RemoteContent

Fetches content from a remote URL at send time and inserts the response body. `name` is always `"RemoteContent"`. The URL may contain nested `[CustomField:...]`, `[Subscriber:...]`, and `[User:...]` tokens that are resolved before the request is made.

**JSON:**

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "RemoteContent",
    "value": "https://api.example.com/banner",
    "name": "RemoteContent",
    "original": "[RemoteContent:https://api.example.com/banner]",
    "max-length": null
  }
}
```

With nested tokens in the URL:

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "RemoteContent",
    "value": "https://api.example.com/offer?id=[CustomField:Order.Id]&email=[Subscriber:email]",
    "name": "RemoteContent",
    "original": "[RemoteContent:https://api.example.com/offer?id=[CustomField:Order.Id]&email=[Subscriber:email]]",
    "max-length": null
  }
}
```

**Email RFM:**

```
::placeholder{type="RemoteContent" value="https://api.example.com/banner" name="RemoteContent" original="[RemoteContent:https://api.example.com/banner]"}
```

**Plain text:**

```
[RemoteContent:https://api.example.com/banner]
[RemoteContent:https://api.example.com/offer?id=[CustomField:Order.Id]&email=[Subscriber:email]]
```

---

## Plain-text tokens

The bracket tokens that appear in `original` can also be used directly as plain strings in RCML attribute values, without wrapping them in a `::placeholder{...}` Email RFM node. For example:

- As the `href` of a `:link` mark: `:link[Unsubscribe]{href="[Link:Unsubscribe]"}`
- In `rc-raw` HTML content: `<p>[Subscriber:email]</p>`
- In any RCML attribute that the backend renderer post-processes at send time

The complete machine-readable token reference is available as `placeholderSpec` from `@rule/rcml`:

```typescript
import { placeholderSpec } from '@rule/rcml';

// All supported token types
Object.keys(placeholderSpec.tokens)
// → ['CustomField', 'Subscriber', 'User', 'Date', 'RemoteContent', 'LoopValue', ...]

// Token syntax and examples
placeholderSpec.tokens['Subscriber'].syntax   // '[Subscriber:<field>]'
placeholderSpec.tokens['Subscriber'].examples // ['[Subscriber:email]', ...]
```
