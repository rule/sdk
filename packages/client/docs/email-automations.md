# Email Automations

> Channel: **email**. For SMS, see [SMS Automations](./sms-automations).

An automation is a trigger-based email that fires automatically when a subscriber enters a tag or a segment. Unlike campaigns (one-time blasts to a snapshot of your list), automations fire per subscriber as each one meets the trigger condition.

Common uses: welcome emails, order confirmations, re-engagement flows, onboarding sequences.

## Creating an automation

Use `createEmailAutomation()` to create a new email automation. At minimum provide a `name`. The trigger can be set at creation time or added later with `updateEmailAutomation()`.

```typescript
// Tag-triggered — fires when a subscriber is assigned the tag
const automation = await client.automations.createEmailAutomation({
  name: 'Welcome email',
  sendoutType: 'transactional',
  trigger: { type: 'TAG', id: tagId },
});

// Segment-triggered — fires when a subscriber enters the segment
const automation = await client.automations.createEmailAutomation({
  name: 'Re-engagement flow',
  sendoutType: 'marketing',
  trigger: { type: 'SEGMENT', id: segmentId },
});

const automationId = automation.id!;
```

> **Important**: `trigger.type` must be `'TAG'` or `'SEGMENT'` — uppercase. The API will reject lowercase values.

To find tag IDs use `client.tags.list()`. To find segment IDs use `client.recipients.segments.list()`.

*→ [`CreateEmailAutomationPayload`](/api/client/src/interfaces/CreateEmailAutomationPayload) · [`AutomationTrigger`](/api/client/src/interfaces/AutomationTrigger)*

## Attaching email content

After creating an automation, attach a message and template before the automation can fire. See [Email Messages](./email-messages) for the full walkthrough — the process is the same regardless of whether the dispatcher is a campaign or an automation.

## Fetching an automation

Retrieve a single automation by ID. Returns `null` if the automation does not exist.

```typescript
const automation = await client.automations.get(automationId);
if (automation) {
  console.log(automation.name, automation.active, automation.trigger);
}
```

## Updating an automation

Use `updateEmailAutomation()` to change individual fields. Only the fields you include are changed — omitted fields are preserved from the existing record. The client performs a read-modify-write internally.

```typescript
// Change the name
await client.automations.updateEmailAutomation(automationId, {
  name: 'Welcome email v2',
});

// Change the trigger
await client.automations.updateEmailAutomation(automationId, {
  trigger: { type: 'SEGMENT', id: segmentId },
});

// Change multiple fields at once
await client.automations.updateEmailAutomation(automationId, {
  name: 'Welcome email v2',
  active: true,
  sendoutType: 'transactional',
});
```

*→ [`UpdateEmailAutomationPayload`](/api/client/src/interfaces/UpdateEmailAutomationPayload)*

## Full replacement

Use `setEmailAutomation()` to completely replace an automation's fields. All four fields are required — omitted fields revert to API defaults, not the previous values. If the automation does not exist, it is created.

```typescript
await client.automations.setEmailAutomation(automationId, {
  name: 'Welcome email',
  active: true,
  trigger: { type: 'TAG', id: tagId },
  sendoutType: 'transactional',
});
```

*→ [`SetEmailAutomationPayload`](/api/client/src/interfaces/SetEmailAutomationPayload)*

## Pausing an automation

Pausing keeps the automation configured but stops it from firing. It can be re-activated at any time.

```typescript
// Pause
await client.automations.updateEmailAutomation(automationId, { active: false });

// Re-activate
await client.automations.updateEmailAutomation(automationId, { active: true });
```

## Listing automations

Use the method that fits your use case:

```typescript
// One page — for UI tables, manual pagination, or retrying a specific page
const page = await client.automations.listAutomations({
  filters: { active: true, messageType: 'email' },
  pagination: { page: 1, pageSize: 20 },
});

// All automations as a single array
const all = await client.automations.listAllAutomations({ filters: { active: true } });

// Stream individual automations — memory-efficient for large lists
for await (const automation of client.automations.iterateAutomations()) {
  console.log(automation.name, automation.active);
}

// Stream page by page — useful for batched processing
for await (const page of client.automations.iterateAutomationsPages({ pagination: { pageSize: 20 } })) {
  console.log(`Batch of ${page.length} automations`);
}
```

`listAutomations()` fetches exactly one page. The iterators auto-paginate until all automations have been yielded.

## Deleting an automation

```typescript
await client.automations.delete(automationId);
```

## Triggering automations

When you assign a tag to a subscriber, use one of these dedicated methods to also control the automation associated with that tag:

```typescript
// Fire once — safe to repeat, no-op if already triggered for this subscriber
await client.subscribers.triggerTagAutomation({ email: 'jane@example.com' }, 'welcome');

// Always start a new pass (pending messages from any in-progress pass remain scheduled)
await client.subscribers.forceTagAutomation({ email: 'jane@example.com' }, 'welcome');

// Cancel pending messages and restart from the beginning
await client.subscribers.resetTagAutomation({ email: 'jane@example.com' }, 'welcome');
```

To add the tag silently without triggering any automation, use `addSubscriberTag()` instead.

For a full breakdown of each mode's behaviour — including what happens when an automation is already in progress — see [Triggering Tag Automations](./tag-automation-modes).

## Next steps

- Control automation firing in detail: [Triggering Tag Automations](./tag-automation-modes)
- Build the email body: [Email Messages](./email-messages)
- Assign trigger tags to subscribers: [Organizing with Tags](./organizing-with-tags)
- Send a one-off blast instead: [Email Campaigns](./email-campaigns)
