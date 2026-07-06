# Email Templates

> Channel: **email**. For SMS, see [SMS Templates](./sms-templates).

A template holds the email body written in [RCML](/packages/rcml/). Templates are independent objects — they are not linked to a message at creation time. The link is made later, via a dynamic set. This means the same template can be reused across multiple messages.

## Creating a template

Use `createEmailTemplate()` to create a new email template. The template's RCML document defines the visual structure and content of the email.

```typescript
import { buildRcmlDocument } from '@rule/rcml';

const rcml = buildRcmlDocument({ /* ... your template ... */ });

const template = await client.templates.createEmailTemplate({
  name: 'Order shipped — v1',
  content: rcml,
});
const templateId = template.id;
```

Template names must be unique within the account. When creating templates programmatically, append a timestamp to avoid conflicts: `name: \`${baseName} - ${Date.now()}\``.

*→ [`CreateEmailTemplatePayload`](/api/client/src/interfaces/CreateEmailTemplatePayload)*

See the [@rule/rcml documentation](/packages/rcml/) for how to build the RCML document.

## Fetching a template

Use `get()` to retrieve a single template by its ID. It returns `null` if the template does not exist, rather than throwing an error.

```typescript
const template = await client.templates.get(templateId);

if (!template) {
  console.log('Template not found');
} else {
  console.log(template.name);      // 'Order shipped — v1'
  console.log(template.messageType); // 'email'
  console.log(template.createdAt);
}
```

## Updating a template

Use `updateEmailTemplate()` to change a template's name or RCML content. Pass only the fields you want to change — omitted fields are left as-is.

```typescript
// Rename without changing content
await client.templates.updateEmailTemplate(templateId, {
  name: 'Order shipped — v2',
});

// Replace content without renaming
await client.templates.updateEmailTemplate(templateId, {
  content: updatedRcml,
});

// Change both at once
await client.templates.updateEmailTemplate(templateId, {
  name: 'Order shipped — v3',
  content: updatedRcml,
});
```

*→ [`UpdateEmailTemplatePayload`](/api/client/src/interfaces/UpdateEmailTemplatePayload)*

## Previewing output

Use `render()` to get the fully rendered HTML output of a template before attaching it to a campaign or automation. This is useful to confirm the visual result and catch any rendering issues early.

If your template uses smart fields, pass a `subscriberId` to get a personalized preview with the subscriber's actual data substituted in.

```typescript
// Render the template as-is
const html = await client.templates.render(templateId);

// Render with a specific subscriber's data substituted into smart fields
const personalized = await client.templates.render(templateId, { subscriberId: 42 });

// render() returns null when the template doesn't exist
if (!html) {
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

The API returns templates of all types (email and SMS) and does not support server-side filtering by message type. Use the method that fits your use case:

```typescript
// One page — for UI tables, manual pagination, or retrying a specific page
const page = await client.templates.listTemplates({ pagination: { page: 1, pageSize: 50 } });

// All templates as a single array — convenient for scripts and small libraries
const all = await client.templates.listAllTemplates();

// Stream individual templates — memory-efficient for large libraries
for await (const template of client.templates.iterateTemplates()) {
  console.log(template.name);
}

// Stream page by page — useful for batched processing
for await (const page of client.templates.iterateTemplatesPages({ pagination: { pageSize: 50 } })) {
  console.log(`Batch of ${page.length} templates`);
}
```

`listTemplates()` fetches exactly one page. The iterators auto-paginate until all templates have been yielded.

## Next steps

- Link the template to a message: [Dynamic Sets](./dynamic-sets)
- Build RCML templates: [@rule/rcml documentation](/packages/rcml/)
