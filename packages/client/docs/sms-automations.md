# SMS Automations

An automation is a trigger-based SMS that fires automatically when a subscriber enters a tag or a segment. Unlike campaigns (one-time blasts to a snapshot of your list), automations fire per subscriber as each one meets the trigger condition.

Common uses: welcome SMS, order shipment notifications, OTP delivery, appointment reminders, re-engagement nudges.

## Creating an automation

Use `createSmsAutomation()` to create a new SMS automation. At minimum provide a `name`. The trigger can be set at creation time or added later with `updateSmsAutomation()`.

```typescript
// Tag-triggered — fires when a subscriber is assigned the tag
const automation = await client.automations.createSmsAutomation({
  name: 'Welcome SMS',
  sendoutType: 'transactional',
  trigger: { type: 'TAG', id: tagId },
});

// Segment-triggered — fires when a subscriber enters the segment
const automation = await client.automations.createSmsAutomation({
  name: 'Re-engagement SMS',
  sendoutType: 'marketing',
  trigger: { type: 'SEGMENT', id: segmentId },
});

const automationId = automation.id!;
```

> **Important**: `trigger.type` must be `'TAG'` or `'SEGMENT'` — uppercase. The API will reject lowercase values.

To find tag IDs use `client.tags.list()`. To find segment IDs use `client.recipients.segments.list()`.

*→ [`CreateSmsAutomationPayload`](/api/client/src/type-aliases/CreateSmsAutomationPayload) · [`AutomationTrigger`](/api/client/src/interfaces/AutomationTrigger)*

## Attaching SMS content

After creating an automation, attach a message and template before the automation can fire. See [SMS Messages](./sms-messages) for the full walkthrough — the process is the same regardless of whether the dispatcher is a campaign or an automation.

## Fetching an automation

Retrieve a single automation by ID. Returns `null` if the automation does not exist.

```typescript
const automation = await client.automations.get(automationId);
if (automation) {
  console.log(automation.name, automation.active, automation.trigger);
}
```

## Updating an automation

Use `updateSmsAutomation()` to change individual fields. Only the fields you include are changed — omitted fields are preserved from the existing record. The client performs a read-modify-write internally.

```typescript
// Change the name
await client.automations.updateSmsAutomation(automationId, {
  name: 'Welcome SMS v2',
});

// Change the trigger
await client.automations.updateSmsAutomation(automationId, {
  trigger: { type: 'SEGMENT', id: segmentId },
});

// Change multiple fields at once
await client.automations.updateSmsAutomation(automationId, {
  name: 'Welcome SMS v2',
  active: true,
  sendoutType: 'transactional',
});
```

*→ [`UpdateSmsAutomationPayload`](/api/client/src/type-aliases/UpdateSmsAutomationPayload)*

## Full replacement

Use `setSmsAutomation()` to completely replace an automation's fields. All four fields are required — omitted fields revert to API defaults, not the previous values. If the automation does not exist, it is created.

```typescript
await client.automations.setSmsAutomation(automationId, {
  name: 'Welcome SMS',
  active: true,
  trigger: { type: 'TAG', id: tagId },
  sendoutType: 'transactional',
});
```

*→ [`SetSmsAutomationPayload`](/api/client/src/type-aliases/SetSmsAutomationPayload)*

## Pausing an automation

Pausing keeps the automation configured but stops it from firing. It can be re-activated at any time.

```typescript
// Pause
await client.automations.updateSmsAutomation(automationId, { active: false });

// Re-activate
await client.automations.updateSmsAutomation(automationId, { active: true });
```

## Listing automations

Filter to SMS using the `messageType: 'text_message'` filter:

```typescript
// One page — for UI tables, manual pagination, or retrying a specific page
const page = await client.automations.listAutomations({
  filters: { active: true, messageType: 'text_message' },
  pagination: { page: 1, pageSize: 20 },
});

// All SMS automations as a single array
const all = await client.automations.listAllAutomations({
  filters: { active: true, messageType: 'text_message' },
});

// Stream individual automations — memory-efficient for large lists
for await (const automation of client.automations.iterateAutomations({
  filters: { messageType: 'text_message' },
})) {
  console.log(automation.name, automation.active);
}

// Stream page by page — useful for batched processing
for await (const page of client.automations.iterateAutomationsPages({
  filters: { messageType: 'text_message' },
  pagination: { pageSize: 20 },
})) {
  console.log(`Batch of ${page.length} SMS automations`);
}
```

`listAutomations()` fetches exactly one page. The iterators auto-paginate until all matching automations have been yielded.

## Deleting an automation

```typescript
await client.automations.delete(automationId);
```

## Triggering automations

When you assign a tag to a subscriber, use one of these dedicated methods to also control the automation associated with that tag. They work the same way for SMS automations as they do for email automations:

```typescript
// Fire once — safe to repeat, no-op if already triggered for this subscriber
await client.subscribers.triggerTagAutomation({ phone: '+46701234567' }, 'sms-welcome');

// Always start a new pass (pending messages from any in-progress pass remain scheduled)
await client.subscribers.forceTagAutomation({ phone: '+46701234567' }, 'sms-welcome');

// Cancel pending messages and restart from the beginning
await client.subscribers.resetTagAutomation({ phone: '+46701234567' }, 'sms-welcome');
```

To add the tag silently without triggering any automation, use `addSubscriberTag()` instead.

For a full breakdown of each mode's behaviour — including what happens when an automation is already in progress — see [Triggering Tag Automations](./tag-automation-modes).

## Next steps

- Control automation firing in detail: [Triggering Tag Automations](./tag-automation-modes)
- Build the SMS body: [SMS Messages](./sms-messages)
- Assign trigger tags to subscribers: [Organizing with Tags](./organizing-with-tags)
- Send a one-off blast instead: [SMS Campaigns](./sms-campaigns)
