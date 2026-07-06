# Email Messages

> Channel: **email**. For SMS, see [SMS Messages](./sms-messages).

A message holds the subject line, sender settings, and delivery configuration for an email. It sits between a dispatcher and a template in the email chain:

```
Dispatcher (campaign or automation)
  └── Message  (subject, sender)
        └── Dynamic Set
              └── Template  (RCML email body)
```

Each dispatcher has its own message. Once you have a message ID, create a template and connect them with a dynamic set to complete the chain. See [Email Templates](./email-templates) and [Dynamic Sets](./dynamic-sets).

## Creating a campaign message

Use `createEmailCampaignMessage()` to create a message attached to a campaign. Provide at minimum a subject line — sender details default to your account settings if omitted.

```typescript
const message = await client.messages.createEmailCampaignMessage(campaignId, {
  subject: 'Your order is on its way',
  fromName: 'Jane from Acme',
  fromEmail: 'jane@acme.com',
});
const messageId = message.id!;
```

*→ [`CreateEmailCampaignMessagePayload`](/api/client/src/interfaces/CreateEmailCampaignMessagePayload)*

## Creating an automation message

Use `createEmailAutomationMessage()` to create a message attached to an automation. You can also configure when the automation fires via `automailSetting`.

```typescript
const message = await client.messages.createEmailAutomationMessage(automationId, {
  subject: 'Welcome to Acme!',
  fromName: 'Jane from Acme',
  fromEmail: 'jane@acme.com',
  // Optional: control when the automation fires
  automailSetting: { active: true, delayInSeconds: '0' },
});
const messageId = message.id!;
```

Pass `delayInSeconds: '3600'` to delay the send by one hour after the trigger fires. Pass `active: false` to create the message in a paused state.

*→ [`CreateEmailAutomationMessagePayload`](/api/client/src/interfaces/CreateEmailAutomationMessagePayload)*

## Fetching a message

Use `get()` to retrieve a single message by ID. Returns `null` if the message does not exist.

```typescript
const message = await client.messages.get(messageId);

if (!message) {
  console.log('Message not found');
} else {
  console.log(message.subject);
  console.log(message.fromName, message.fromEmail);
  console.log(message.dispatcher); // { id, type }
}
```

## Updating a campaign message

Use `updateEmailCampaignMessage()` to change the subject, sender, or tracking parameters. Pass only the fields you want to change — omitted fields are left as-is.

```typescript
// Change the subject
await client.messages.updateEmailCampaignMessage(messageId, {
  subject: 'Your order has shipped!',
});

// Update sender and UTM tracking
await client.messages.updateEmailCampaignMessage(messageId, {
  fromName: 'Support Team',
  fromEmail: 'support@acme.com',
  utmCampaign: 'spring-sale',
});
```

*→ [`UpdateEmailCampaignMessagePayload`](/api/client/src/interfaces/UpdateEmailCampaignMessagePayload)*

## Updating an automation message

Use `updateEmailAutomationMessage()` to change subject, sender, or delivery settings. Automation messages additionally support changing the `automailSetting` to adjust the active state or send delay.

```typescript
// Update subject copy
await client.messages.updateEmailAutomationMessage(messageId, {
  subject: 'Welcome — updated',
});

// Change the send delay to 1 hour
await client.messages.updateEmailAutomationMessage(messageId, {
  automailSetting: { active: true, delayInSeconds: '3600' },
});

// Pause the automation without deleting it
await client.messages.updateEmailAutomationMessage(messageId, {
  automailSetting: { active: false, delayInSeconds: '0' },
});
```

*→ [`UpdateEmailAutomationMessagePayload`](/api/client/src/interfaces/UpdateEmailAutomationMessagePayload)*

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

- Create the email body: [Email Templates](./email-templates)
- Link template to message: [Dynamic Sets](./dynamic-sets)
- Attach to a campaign and schedule it: [Email Campaigns](./email-campaigns)
- Attach to an automation: [Email Automations](./email-automations)
