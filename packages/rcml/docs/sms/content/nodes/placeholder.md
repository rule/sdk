# `placeholder`

An inline atom that is replaced at render time with a dynamic value — a subscriber
field, custom field value, user attribute, remote content, or formatted date.

## Attributes

| Attribute | Required | Type | Description |
|-----------|----------|------|-------------|
| `type` | Yes | enum | The placeholder category. Determines what `original` contains. |
| `name` | Yes | string | Human-readable display label shown in the editor chip. |
| `original` | Yes | string | The backend token substituted at send time. |
| `value` | Yes | string \| number \| null | Resolved preview value shown in the editor, or `null` when not yet resolved. |
| `max-length` | No | string \| null | Maximum character length (truncates and appends `…`). Omit when no limit is needed. |

Allowed `type` values: `"CustomField"` | `"Subscriber"` | `"User"` | `"Date"` | `"RemoteContent"`

## Children

None (leaf node).

## Parent nodes

- [`sms`](./sms)

## Available in

- SMS RFM (`rc-sms`)

## Programmatic

Each placeholder type has a typed convenience builder. See the per-type sections below
for the builder for each type. For types not covered by a convenience builder, use the
generic `sms.createPlaceholderNode`:

```typescript
sms.createPlaceholderNode({
  type: 'Subscriber',
  original: '[Subscriber:email]',
  name: 'Email',
  value: 'jane@example.com',
})
```

## SMS RFM syntax

To insert a placeholder as text in the message body, use the `::placeholder{…}`
directive:

```
Your account email: ::placeholder{type="Subscriber" original="[Subscriber:email]" name="Email"}
Your total: ::placeholder{type="CustomField" original="[CustomField:Order.Total]" name="Order.Total"}
```

Three attributes are required in the directive form (`type`, `original`,
`name`); the optional `value` and `max-length` attributes are omitted
when null. The parser treats a missing or empty attribute as `null` —
**do not write the literal string `null`**, since the parser would treat
that as the string value `"null"`. To assign a non-null value, quote it
(e.g. `value="Jane"` or `max-length="20"`).

| Attribute | Required? | Notes |
|-----------|-----------|-------|
| `type` | Yes | One of the six placeholder types. |
| `original` | Yes | Backend `[Type:Name]` token. |
| `name` | Yes | Editor display label. |
| `value` | No | Omit when null. To set a preview value, quote the string (e.g. `value="Jane"`). |
| `max-length` | No | Omit when null. To set a truncation limit, quote it as a string (e.g. `max-length="20"`). |

### Plain-text `[Type:Name]` tokens

Plain-text `[Type:Name]` tokens — `[Subscriber:email]`,
`[CustomField:Order.Total]`, `[Link:Unsubscribe]`, and so on — are valid in
**exactly two places**:

1. As the value of the `original` attribute on a placeholder node — appears
   verbatim inside `::placeholder{…}` in SMS RFM and on `attrs.original` in JSON.
2. As a URL value — typically the `text` of a [`link`](./link) node, or the
   URL passed to a `RemoteContent` placeholder.

The parser also accepts a bare `[Type:Name]` token as a shorthand for a
placeholder in body content, and produces an equivalent node. The serializer
(`jsonToSmsRfm`) always emits the full `::placeholder{…}` directive form —
the shorthand is parse-only.

---

## Subscriber

Inserts a standard subscriber profile field.

| `original` token | `name` | Field |
|-----------------|--------|-------|
| `[Subscriber:email]` | `"Email"` | Email address |
| `[Subscriber:phone_number]` | `"Phone number"` | Phone number |
| `[Subscriber:language]` | `"Language"` | Language code |

**JSON:**

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "Subscriber",
    "name": "Email",
    "original": "[Subscriber:email]",
    "value": "email"
  }
}
```

**SMS RFM:**

```
Your account email: ::placeholder{type="Subscriber" original="[Subscriber:email]" name="Email"}
```

With a resolved preview value:

```
Your account email: ::placeholder{type="Subscriber" original="[Subscriber:email]" name="Email" value="jane@example.com"}
```

**Programmatic:**

```typescript
sms.createSubscriberPlaceholder({ field: 'email' })
sms.createSubscriberPlaceholder({ field: 'phone_number', name: 'Phone' })
```

---

## User

Inserts a field from the sender's Rule.io account profile.

| `original` token | `name` | Field |
|-----------------|--------|-------|
| `[User:CompanyName]` | `"Company name"` | Account company name |
| `[User:Street]` | `"Street"` | Account street address |
| `[User:Zip]` | `"Zip"` | Account postal code |
| `[User:City]` | `"City"` | Account city |
| `[User:EmailAddress]` | `"Email address"` | Account email |

**JSON:**

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "User",
    "name": "Company name",
    "original": "[User:CompanyName]",
    "value": "CompanyName"
  }
}
```

**SMS RFM:**

```
Sent by ::placeholder{type="User" original="[User:CompanyName]" name="Company name"}
```

**Programmatic:**

```typescript
sms.createUserPlaceholder({ field: 'CompanyName' })
sms.createUserPlaceholder({ field: 'CompanyName', name: 'Company name' })
```

---

## CustomField

Inserts a subscriber custom field value. The `original` token uses `Group.Field` dot
notation. An optional `::N` suffix in the token and a matching `max-length` attribute
truncate the value to N characters and append `…`.

**JSON (no truncation):**

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "CustomField",
    "name": "Order.Total",
    "original": "[CustomField:Order.Total]",
    "value": "Order.Total"
  }
}
```

**JSON (truncated to 20 characters):**

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "CustomField",
    "name": "Order.Total",
    "original": "[CustomField:Order.Total::20]",
    "value": "Order.Total",
    "max-length": "20"
  }
}
```

**SMS RFM (no truncation):**

```
Your total: ::placeholder{type="CustomField" original="[CustomField:Order.Total]" name="Order.Total"}
```

**SMS RFM (truncated to 20 characters):**

```
Your total: ::placeholder{type="CustomField" original="[CustomField:Order.Total::20]" name="Order.Total" max-length="20"}
```

**Programmatic:**

```typescript
sms.createCustomFieldPlaceholder({ group: 'Order', name: 'Total' })
sms.createCustomFieldPlaceholder({ group: 'Order', name: 'Total', maxLength: 20 })
```

---

## Date

Inserts a formatted date computed at send time. `value` is always `null`. The date
source and output format are encoded entirely in the `original` token.

**Date source options:**

| Token | Source |
|-------|--------|
| `[Date:now::Y-m-d]` | Current date |
| `[Date:tomorrow::Y-m-d]` | Tomorrow |
| `[Date:yesterday::Y-m-d]` | Yesterday |
| `[Date:in-2-days::Y-m-d]` | N days from now (replace `2` with any number) |
| `[Date:3-days-ago::Y-m-d]` | N days ago (replace `3` with any number) |
| `[Date:[CustomField:Order.CreatedAt]::Y-m-d]` | From a subscriber custom field |

**Format** (the part after `::` at the end of the token): PHP date format string.
Supported values: `Y-m-d`, `d.m.Y`, `m-d-Y`, `m/d/Y`, `d/m/Y`.

**JSON:**

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "Date",
    "name": "Offer expires",
    "original": "[Date:tomorrow::d.m.Y]",
    "value": null
  }
}
```

**SMS RFM:**

```
Offer valid until ::placeholder{type="Date" original="[Date:tomorrow::d.m.Y]" name="Offer expires"}.
```

**Programmatic:**

```typescript
sms.createDatePlaceholder({ source: 'tomorrow', format: 'd.m.Y' })
sms.createDatePlaceholder({ source: { kind: 'days-from-now', count: 7 }, format: 'Y-m-d' })
sms.createDatePlaceholder({ source: { kind: 'custom-field', group: 'Order', name: 'CreatedAt' }, format: 'Y-m-d' })
```

---

## RemoteContent

Fetches content from a remote URL at send time and inserts the response body. `name` is
always `"RemoteContent"`. The URL may contain nested `[CustomField:…]`,
`[Subscriber:…]`, and `[User:…]` tokens that are resolved before the request is made.

**JSON:**

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "RemoteContent",
    "name": "RemoteContent",
    "original": "[RemoteContent:https://api.example.com/promo]",
    "value": null
  }
}
```

With nested tokens in the URL:

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "RemoteContent",
    "name": "RemoteContent",
    "original": "[RemoteContent:https://api.example.com/offer?id=[CustomField:Order.Id]&email=[Subscriber:email]]",
    "value": null
  }
}
```

**SMS RFM:**

```
::placeholder{type="RemoteContent" original="[RemoteContent:https://api.example.com/promo]" name="RemoteContent"}
```

**Programmatic:**

```typescript
sms.createRemoteContentPlaceholder({ url: 'https://api.example.com/promo' })
sms.createRemoteContentPlaceholder({ url: 'https://api.example.com/offer?id=[CustomField:Order.Id]' })
```

---

## Machine-readable token catalog

The complete token reference is available as `smsPlaceholderSpec`:

```typescript
import { smsPlaceholderSpec } from '@rule/rcml';

// All SMS-valid token types
Object.keys(smsPlaceholderSpec.tokens)
// → ['CustomField', 'Subscriber', 'User', 'Date', 'RemoteContent', 'Link']

// Token syntax and examples
smsPlaceholderSpec.tokens['Subscriber'].syntax
// '[Subscriber:<field>]'
```

`smsPlaceholderSpec` exposes the token types available in SMS RFM, each with
its full token syntax, parameter schema, allowed values, and examples — useful as
machine-readable input to LLM-driven generation. See
[Building with LLM](../../building-with-llm) for that workflow.
