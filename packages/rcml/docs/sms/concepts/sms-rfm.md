# SMS RFM

**SMS RFM** (SMS Rule Flavor Markdown) is the source text format used inside an
`<rc-sms>` element. It is a compact, human-readable string that compiles to the
[`SmsContentJson`](./sms-document) tree. Writing SMS RFM is far more concise than
constructing `SmsContentJson` by hand, and it is the form the XML representation
of an SMS template stores in the body of `<rc-sms>`.

This page describes the format conceptually — what constructs it has and how
they map to the document model. For the functions that parse and serialise it,
see [Building programmatically](../building-programmatically).

## What SMS RFM contains

An SMS RFM string is built from three constructs:

1. **Message text** — plain text including any embedded line breaks.
2. **Placeholders** — dynamic values substituted at send time.
3. **Links** — hyperlinks with tracking and shortening flags.

That is the entire format. Plain text written between placeholders and links
becomes `message` nodes in `SmsContentJson`.

## Message text

Any text that is not a placeholder or link directive becomes a `message` node.
Line breaks — whether single (`\n`) or multiple (`\n\n`) — are preserved inside
the `text` field of the resulting `message` node. There is no separate line-break
construct; line breaks are just characters in the text.

```
First line
Second line
```

Compiles to:

```json
{ "type": "sms", "content": [{ "type": "message", "text": "First line\nSecond line" }] }
```

See [`message`](../content/nodes/message) for the node reference.

## Placeholders

A placeholder inserts a dynamic value — a subscriber field, custom field,
account attribute, formatted date, fetched remote content, or system-managed
link URL.

The recommended form is the `::placeholder{…}` directive:

```
Hi ::placeholder{type="Subscriber" original="[Subscriber:FirstName]" name="First name"}!
```

Six token types are available: `Subscriber`, `User`, `CustomField`, `Date`,
`RemoteContent`, and `Link`. The `original` attribute holds the backend token
(in `[Type:Name]` format) the Rule platform substitutes at send time.

Plain-text `[Type:Name]` tokens belong inside the `original` attribute of a
`::placeholder{…}` directive (as shown above) or inside a URL value such as
the `text` of a `:link` directive. The parser does also accept a bare
`[Type:Name]` token as a backward-compatible shorthand and produces an
equivalent placeholder node from it, but the `::placeholder{…}` directive is
the recommended form for body content because it carries the full `name` /
`value` / `max-length` attributes the editor expects.

See [`placeholder`](../content/nodes/placeholder) for the full attribute table,
the catalogue of all six token types, and per-token examples.

## Links

A link is a top-level node in `SmsContentJson`. The `:link[…]{…}` directive
provides the destination URL, a tracking flag, and a URL-shortening flag:

```
Click :link[https://example.com/track]{href="https://example.com/track" track="true" shorten="true"} to track your order.
```

The URL in the brackets (`[…]`) and in `href` should be the same — `text`
carries the URL as both the destination and the display value.

Any text around the link directive becomes adjacent `message` nodes. In the
example above, `"Click "` becomes one `message` node, then the link node, then
`" to track your order."` becomes another.

See [`link`](../content/nodes/link) for the full attribute reference.

## A complete example

A short marketing message exercising all three constructs:

```
Hi ::placeholder{type="Subscriber" original="[Subscriber:FirstName]" name="First name"},
your order ::placeholder{type="CustomField" original="[CustomField:Order.Id]" name="Order.Id"} has shipped.

Track it: :link[https://example.com/track]{href="https://example.com/track" track="true" shorten="true"}
```

This compiles to a flat `SmsContentJson` sequence — alternating `message` and
`placeholder` nodes, with one `link` node for the tracking URL — exactly the
shape described on the [SMS document](./sms-document) page.

## Related

- [`message`](../content/nodes/message) — message node reference
- [`placeholder`](../content/nodes/placeholder) — placeholder node reference and token catalogue
- [`link`](../content/nodes/link) — link node reference
- [SMS document](./sms-document) — the document model SMS RFM compiles to
- [Building programmatically](../building-programmatically) — `smsRfmToJson` / `jsonToSmsRfm` and the rest of the API
