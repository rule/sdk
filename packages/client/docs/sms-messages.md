# SMS Messages

A message holds the SMS body text and optional UTM tracking parameters for an SMS. It sits between a dispatcher and a template in the SMS chain:

```
Dispatcher (campaign or automation)
  └── Message  (SMS body, UTM)
        └── Dynamic Set
              └── Template  (RCML SMS body)
```

Each dispatcher has its own message. Once you have a message ID, create a template and connect them with a dynamic set to complete the chain. See [SMS Templates](./sms-templates) and [Dynamic Sets](./dynamic-sets).

## SMS message fields

An SMS message has fewer fields than its email counterpart. There is no
`fromName`, no `fromEmail`, no `preheader`, no subject — the platform's
configured sender number is used for delivery, and the SMS body lives in the
template, not the message. The message carries only optional UTM tracking and
(for automations) automail delivery settings.

| Field | Description |
|-------|-------------|
| `utmCampaign` | UTM campaign parameter appended to tracked links. |
| `utmTerm` | UTM term parameter appended to tracked links. |
| `automailSetting` | Automation-only. Controls active state and send delay. |

## Creating a campaign message

Use `createSmsCampaignMessage()` to create a message attached to an SMS campaign. All fields are optional.

```typescript
const message = await client.messages.createSmsCampaignMessage(campaignId, {
  utmCampaign: 'spring-sale',
});
const messageId = message.id!;
```

*→ [`CreateSmsCampaignMessagePayload`](/api/client/src/interfaces/CreateSmsCampaignMessagePayload)*

## Creating an automation message

Use `createSmsAutomationMessage()` to create a message attached to an SMS automation. Configure when the automation fires via `automailSetting`.

```typescript
const message = await client.messages.createSmsAutomationMessage(automationId, {
  // Optional: control when the automation fires
  automailSetting: { active: true, delayInSeconds: '0' },
});
const messageId = message.id!;
```

Pass `delayInSeconds: '3600'` to delay the send by one hour after the trigger fires. Pass `active: false` to create the message in a paused state.

*→ [`CreateSmsAutomationMessagePayload`](/api/client/src/interfaces/CreateSmsAutomationMessagePayload)*

## Fetching a message

Use `get()` to retrieve a single message by ID. Returns `null` if the message does not exist.

```typescript
const message = await client.messages.get(messageId);

if (!message) {
  console.log('Message not found');
} else {
  console.log(message.dispatcher);  // { id, type }
  console.log(message.utmCampaign);
}
```

## Updating a campaign message

Use `updateSmsCampaignMessage()` to change UTM parameters. Pass only the fields you want to change — omitted fields are left as-is.

```typescript
await client.messages.updateSmsCampaignMessage(messageId, {
  utmCampaign: 'spring-sale',
  utmTerm: 'sms-promo',
});
```

*→ [`UpdateSmsCampaignMessagePayload`](/api/client/src/interfaces/UpdateSmsCampaignMessagePayload)*

## Updating an automation message

Use `updateSmsAutomationMessage()` to change UTM parameters or delivery settings. Use `automailSetting` to adjust the active state or send delay.

```typescript
// Change the send delay to 1 hour
await client.messages.updateSmsAutomationMessage(messageId, {
  automailSetting: { active: true, delayInSeconds: '3600' },
});

// Pause the automation without deleting it
await client.messages.updateSmsAutomationMessage(messageId, {
  automailSetting: { active: false, delayInSeconds: '0' },
});
```

*→ [`UpdateSmsAutomationMessagePayload`](/api/client/src/interfaces/UpdateSmsAutomationMessagePayload)*

## Listing messages

Retrieve all messages for a campaign or automation. A dispatcher typically has one message, but the API supports multiple (e.g. for A/B variants).

```typescript
const campaignMessages = await client.messages.listCampaignMessages(campaignId);
const automationMessages = await client.messages.listAutomationMessages(automationId);
```

## Deleting a message

Deleting a message also removes the dynamic sets linked to it, which breaks the connection to any templates. The templates themselves are not deleted. See [Dynamic Sets](./dynamic-sets) for details.

```typescript
await client.messages.delete(messageId);
```

## Next steps

- Create the SMS body: [SMS Templates](./sms-templates)
- Link template to message: [Dynamic Sets](./dynamic-sets)
- Attach to a campaign and schedule it: [SMS Campaigns](./sms-campaigns)
- Attach to an automation: [SMS Automations](./sms-automations)
