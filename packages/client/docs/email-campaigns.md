# Email Campaigns

> Channel: **email**. For SMS, see [SMS Campaigns](./sms-campaigns).

A campaign is a one-time or scheduled email blast sent to a defined set of recipients. The full lifecycle has four stages:

1. **Create** the campaign shell
2. **Attach email content** — message, template, dynamic set
3. **Set recipients** — tags, segments, or individual subscribers
4. **Schedule** — send immediately or at a specific time

For building the email content (stage 2), see [Email Messages](./email-messages), [Email Templates](./email-templates), and [Dynamic Sets](./dynamic-sets).

## Creating a campaign

Use `createEmailCampaign()` to create a new email campaign shell. The campaign starts with no name and no recipients — add those separately before scheduling.

```typescript
const campaign = await client.campaigns.createEmailCampaign({
  sendoutType: 'marketing',
});
const campaignId = campaign.id!;
```

*→ [`CreateEmailCampaignPayload`](/api/client/src/interfaces/CreateEmailCampaignPayload)*

## Default campaign

Use `createDefaultEmailCampaign()` to create a campaign with all required content in a single call. The method creates the campaign, message, and a branded email template in parallel, then links them together with a dynamic set. If any step fails, all already-created resources are automatically rolled back.

```typescript
import { resolvePreferredBrandStyle } from '@rule/sdk';

const { id: brandStyleId } = await resolvePreferredBrandStyle(client);

const result = await client.campaigns.createDefaultEmailCampaign({ brandStyleId });
// result: { campaignId, messageId, templateId, dynamicSetId }
```

The template is built automatically from the brand style — logo, brand colours, and a placeholder content section. See [Brand Styles](./brand-styles) for how to look up the account's preferred brand style.

Pass `message` and `template` to override the auto-generated defaults:

```typescript
const result = await client.campaigns.createDefaultEmailCampaign({
  brandStyleId,
  message: {
    subject: 'Summer sale — 20% off everything',
    preheader: 'Shop now before it ends',
    fromName: 'Acme Store',
  },
  template: { name: 'Summer Sale 2025' },
});
```

Supply a fully custom RCML document via `template.content` to skip the brand style fetch entirely:

```typescript
const result = await client.campaigns.createDefaultEmailCampaign({
  brandStyleId,   // still required by type; not fetched when template.content is provided
  template: { content: myRcmlDocument },
});
```

An optional `name` and `sendoutType` (`'marketing'` or `'transactional'`) can be passed as well.

*→ [`CreateDefaultEmailCampaignParams`](/api/client/src/interfaces/CreateDefaultEmailCampaignParams), [`CreateDefaultCampaignResult`](/api/client/src/interfaces/CreateDefaultCampaignResult)*

## Attaching email content

After creating a campaign, attach a message, template, and dynamic set before scheduling. See [Email Messages](./email-messages) for the full walkthrough — the process is the same regardless of whether the dispatcher is a campaign or an automation.

## Renaming a campaign

```typescript
await client.campaigns.renameCampaign(campaignId, 'Spring Newsletter 2025');
```

## Setting sendout type

```typescript
// Marketing (default) — standard bulk email
await client.campaigns.setCampaignSendoutType(campaignId, 'marketing');

// Transactional — for order confirmations, receipts, etc.
await client.campaigns.setCampaignSendoutType(campaignId, 'transactional');
```

## Setting recipients

### Tags

Use tags to target groups of subscribers. Set `negative: true` to exclude subscribers with that tag.

```typescript
await client.campaigns.setCampaignTags(campaignId, [
  { id: 42, negative: false },  // include subscribers with tag 42
  { id: 7,  negative: true },   // exclude subscribers with tag 7
]);
```

To find available tag IDs use `client.recipients.listAllTags()`.

### Segments

```typescript
await client.campaigns.setCampaignSegments(campaignId, [
  { id: 12, negative: false },
]);
```

To find segment IDs use `client.recipients.listAllSegments()`.

### Individual subscribers

```typescript
await client.campaigns.setCampaignSubscribers(campaignId, [101, 102, 103]);
```

You can combine all three types on the same campaign — set whichever combination applies.

## Updating multiple fields

Use `updateEmailCampaign()` when you want to change several fields in a single operation. It fetches the existing record, merges your changes, and writes the full merged body back. Omitted fields are left as-is.

```typescript
await client.campaigns.updateEmailCampaign(campaignId, {
  name: 'Spring Newsletter',
  sendoutType: 'marketing',
  tags: [{ id: 42, negative: false }],
  segments: [],
  subscribers: [],
});
```

*→ [`UpdateEmailCampaignPayload`](/api/client/src/interfaces/UpdateEmailCampaignPayload)*

## Scheduling a campaign

Send immediately:

```typescript
await client.campaigns.schedule(campaignId, { type: 'now' });
```

Schedule for a specific date and time (ISO 8601):

```typescript
await client.campaigns.schedule(campaignId, {
  type: 'schedule',
  datetime: '2025-09-15T09:00:00+02:00',
});
```

Cancel a scheduled send (moves the campaign back to draft):

```typescript
await client.campaigns.schedule(campaignId, { type: null });
```

*→ [`ScheduleCampaignPayload`](/api/client/src/interfaces/ScheduleCampaignPayload)*

## Duplicating a campaign

Copy an existing campaign — useful for recurring newsletters where the structure stays the same but the content changes each time.

```typescript
const copy = await client.campaigns.copy(campaignId);
const newCampaignId = copy.id!;
```

## Fetching a campaign

Retrieve a single campaign by ID. Returns `null` if the campaign does not exist.

```typescript
const campaign = await client.campaigns.get(campaignId);
if (campaign) {
  console.log(campaign.name, campaign.status?.key);
}
```

## Listing campaigns

The API returns campaigns of all message types. Use the method that fits your use case:

```typescript
// One page — for UI tables, manual pagination, or retrying a specific page
const page = await client.campaigns.listCampaigns({
  filters: { messageType: 'email' },
  pagination: { page: 1, pageSize: 20 },
});

// All campaigns as a single array
const all = await client.campaigns.listAllCampaigns({ filters: { messageType: 'email' } });

// Stream individual campaigns — memory-efficient for large lists
for await (const campaign of client.campaigns.iterateCampaigns()) {
  console.log(campaign.name, campaign.status?.key);
}

// Stream page by page — useful for batched processing
for await (const page of client.campaigns.iterateCampaignsPages({ pagination: { pageSize: 50 } })) {
  console.log(`Batch of ${page.length} campaigns`);
}
```

`listCampaigns()` fetches exactly one page. The iterators auto-paginate until all campaigns have been yielded.

## Deleting a campaign

```typescript
await client.campaigns.delete(campaignId);
```

## Next steps

- Build the email content: [Email Messages](./email-messages)
- Set up a recurring trigger-based email instead: [Email Automations](./email-automations)
- Review campaign performance after sending: [Analytics](./analytics)
