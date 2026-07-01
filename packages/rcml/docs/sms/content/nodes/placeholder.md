# `placeholder`

An inline atom that is replaced at render time with a dynamic value — a subscriber
field, custom field value, user attribute, remote content, formatted date, or
system-managed link.

## Attributes

| Attribute | Required | Type | Description |
|-----------|----------|------|-------------|
| `type` | Yes | enum | The placeholder category. Determines what `original` contains. |
| `name` | Yes | string | Human-readable display label shown in the editor chip. |
| `original` | Yes | string | The backend token substituted at send time. |
| `value` | Yes | string \| number \| null | Resolved preview value shown in the editor, or `null` when not yet resolved. |
| `max-length` | No | string \| null | Maximum character length (truncates and appends `…`). Omit when no limit is needed. |

Allowed `type` values: `"CustomField"` | `"Subscriber"` | `"User"` | `"Date"` | `"RemoteContent"` | `"Link"`

## Children

None (leaf node).

## Parent nodes

- [`sms`](./sms)

## Available in

- SMS RFM (`rc-sms`)

## SMS RFM syntax

To insert a placeholder as text in the message body, use the `::placeholder{…}`
directive:

```
Hi ::placeholder{type="Subscriber" original="[Subscriber:FirstName]" name="First name"}!
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

Plain-text `[Type:Name]` tokens — `[Subscriber:FirstName]`,
`[CustomField:Order.Total]`, `[Link:Unsubscribe]`, and so on — are valid in
**exactly two places**:

1. As the value of the `original` attribute on a placeholder node — the value
   appears verbatim inside the `::placeholder{…}` directive in SMS RFM and on
   `attrs.original` in JSON.
2. As a URL value or part of a URL value — typically the `text` of a
   [`link`](./link) node, or the URL passed to a `RemoteContent` placeholder.

```
:link[https://example.com]{href="https://example.com" track="false" shorten="false"}
```

A bare `[Type:Name]` token is **not the recommended form** for placeholders
in body content. The parser does accept it as a backward-compatible
shorthand and produces an equivalent placeholder node, but it carries
neither a `name` nor a `value` nor a `max-length` — the editor relies on
those, so authoring through the `::placeholder{…}` directive keeps the
template editor-friendly.

### Serializer output

`jsonToSmsRfm` emits the bare `[Type:Name]` form when both `value` and
`max-length` are null, and the `::placeholder{…}` directive form otherwise.
This is a serializer output optimization, not a recommendation about how to
write SMS RFM by hand. Re-parsing the serializer output recovers the same
`SmsContentJson` tree either way.

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
    "name": "First name",
    "original": "[Subscriber:FirstName]",
    "value": null
  }
}
```

**SMS RFM:**

```
Hi ::placeholder{type="Subscriber" original="[Subscriber:FirstName]" name="First name"}!
```

With a resolved preview value:

```
Hi ::placeholder{type="Subscriber" original="[Subscriber:FirstName]" name="First name" value="Jane"}!
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
    "value": null
  }
}
```

**SMS RFM:**

```
Sent by ::placeholder{type="User" original="[User:CompanyName]" name="Company name"}
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
    "value": null
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
    "value": null,
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

---

## Link

Inserts a system-managed link URL — Rule's pre-defined system links such as the
unsubscribe URL or the web-browser-view URL. Use this token when you want the raw
URL visible in the message body rather than as linked text.

| `original` token | Link type |
|-----------------|-----------|
| `[Link:Unsubscribe]` | Unsubscribe link |
| `[Link:WebBrowser]` | View in web browser |
| `[Link:Optin]` | Opt-in confirmation |
| `[Link:ShareLink]` | Social share link |
| `[Link:Signup]` | Sign-up link |

**JSON:**

```json
{
  "type": "placeholder",
  "attrs": {
    "type": "Link",
    "name": "Unsubscribe",
    "original": "[Link:Unsubscribe]",
    "value": null
  }
}
```

**SMS RFM:**

```
Reply STOP or unsubscribe here: ::placeholder{type="Link" original="[Link:Unsubscribe]" name="Unsubscribe"}
```

### Link tokens in link nodes

A `[Link:…]` token is a valid value for the `text` field of a
[`link`](./link) node — that is the second of the two valid locations
for plain-text tokens described above:

```
:link[https://example.com/unsubscribe]{href="[Link:Unsubscribe]" track="true" shorten="false"}
```

Use the `::placeholder{…}` form when you want the URL rendered as plain text in the
message body; use the [`link` node](./link) form when you want trackable linked text.

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

smsPlaceholderSpec.tokens['Link'].params?.['type'].allowedValues
// → ['Optin', 'Unsubscribe', 'WebBrowser', 'ShareLink', 'Signup']
```

`smsPlaceholderSpec` exposes the six token types available in SMS RFM, each with
its full token syntax, parameter schema, allowed values, and examples — useful as
machine-readable input to LLM-driven generation. See
[Building with LLM](../../building-with-llm) for that workflow.
