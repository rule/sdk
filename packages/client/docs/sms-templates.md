# SMS Templates

A template holds the SMS body as an [`SmsDocument`](/packages/rcml/sms/rcml/rc-sms) from `@rule/rcml`. Templates are independent objects — they are not linked to a message at creation time. The link is made later, via a dynamic set. This means the same template can be reused across multiple messages.

## Creating a template

Use `createSmsTemplate()` to create a new SMS template. The template's `SmsDocument` defines the message body, including any `::placeholder{…}` directives, `:link[…]{…}` link nodes, or `::unsubscribe` footer.

```typescript
import { createSmsDocument } from '@rule/rcml';

const sms = createSmsDocument({
  content: 'Hi ::placeholder{type="Subscriber" original="[Subscriber:FirstName]" name="First name"}, your order has shipped!',
});

const template = await client.templates.createSmsTemplate({
  name: 'Order shipped — v1',
  content: sms,
});
const templateId = template.id;
```

Template names must be unique within the account. When creating templates programmatically, append a timestamp to avoid conflicts: `name: \`${baseName} - ${Date.now()}\``.

*→ [`CreateSmsTemplatePayload`](/api/client/src/interfaces/CreateSmsTemplatePayload)*

See the [@rule/rcml SMS documentation](/packages/rcml/sms/) for how to author SMS templates — including the `sms` builder namespace for composing `SmsContentJson` programmatically and the SMS RFM source format reference.

## Fetching a template

Use `get()` to retrieve a single template by its ID. It returns `null` if the template does not exist, rather than throwing an error.

```typescript
const template = await client.templates.get(templateId);

if (!template) {
  console.log('Template not found');
} else {
  console.log(template.name);        // 'Order shipped — v1'
  console.log(template.messageType); // 'text_message'
  console.log(template.createdAt);
}
```

## Updating a template

Use `updateSmsTemplate()` to change a template's name or `SmsDocument` content. Pass only the fields you want to change — omitted fields are left as-is.

```typescript
import { createSmsDocument } from '@rule/rcml';

const updatedSms = createSmsDocument({ content: 'Updated SMS body…' });

// Rename without changing content
await client.templates.updateSmsTemplate(templateId, {
  name: 'Order shipped — v2',
});

// Replace content without renaming
await client.templates.updateSmsTemplate(templateId, {
  content: updatedSms,
});

// Change both at once
await client.templates.updateSmsTemplate(templateId, {
  name: 'Order shipped — v3',
  content: updatedSms,
});
```

*→ [`UpdateSmsTemplatePayload`](/api/client/src/interfaces/UpdateSmsTemplatePayload)*

## Previewing output

Use `render()` to preview a template's rendered output before attaching it to a campaign or automation. For SMS, this returns the rendered message body with placeholders substituted in.

If your template uses placeholders, pass a `subscriberId` to get a personalized preview with the subscriber's actual data substituted.

```typescript
// Render the template as-is (placeholders shown verbatim)
const rendered = await client.templates.render(templateId);

// Render with a specific subscriber's data substituted into placeholders
const personalized = await client.templates.render(templateId, { subscriberId: 42 });

// render() returns null when the template doesn't exist
if (!rendered) {
  console.log('Template not found');
}
```

*→ [`RenderTemplateParams`](/api/client/src/interfaces/RenderTemplateParams)*

## Deleting a template

Use `delete()` to permanently remove a template. Before deleting, remove any dynamic sets that reference the template first — otherwise those dynamic sets will point to a non-existent template and the message they belong to cannot be sent. See [Dynamic Sets](./dynamic-sets) for how to manage them.

```typescript
await client.templates.delete(templateId);
```

## Listing templates

The API returns templates of all types (email and SMS) and does not support server-side filtering by message type. Filter on the client side using `messageType`:

```typescript
// One page — for UI tables, manual pagination, or retrying a specific page
const page = await client.templates.listTemplates({ pagination: { page: 1, pageSize: 50 } });
const smsPage = page.filter((t) => t.messageType === 'text_message');

// All templates as a single array, then filter to SMS
const all = await client.templates.listAllTemplates();
const allSms = all.filter((t) => t.messageType === 'text_message');

// Stream individual templates — memory-efficient for large libraries
for await (const template of client.templates.iterateTemplates()) {
  if (template.messageType !== 'text_message') continue;
  console.log(template.name);
}

// Stream page by page — useful for batched processing
for await (const page of client.templates.iterateTemplatesPages({ pagination: { pageSize: 50 } })) {
  const smsBatch = page.filter((t) => t.messageType === 'text_message');
  console.log(`Batch of ${smsBatch.length} SMS templates`);
}
```

`listTemplates()` fetches exactly one page. The iterators auto-paginate until all templates have been yielded.

## Next steps

- Link the template to a message: [Dynamic Sets](./dynamic-sets)
- Author SMS templates: [@rule/rcml SMS documentation](/packages/rcml/sms/)
