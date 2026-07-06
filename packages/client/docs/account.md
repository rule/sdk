# Account

The `client.account` namespace exposes account-level configuration for your Rule.io account, including sender details used when creating campaigns.

## Sender details

Use `getSenderDetails()` to fetch the account's email and SMS sender configuration.

```typescript
const details = await client.account.getSenderDetails();
console.log(details.textMessageSenderName); // e.g. 'Acme Corp'
console.log(details.linkInsteadOfStopWord); // true | false | undefined
```

| Field | Type | Description |
|-------|------|-------------|
| `accountId` | `number` | Account ID |
| `name` | `string` | Sender display name for emails |
| `email` | `string` | Sender email address |
| `company` | `string` | Company name |
| `textMessageSenderName` | `string` | The `From` field for outgoing SMS messages |
| `linkInsteadOfStopWord` | `boolean?` | When `true`, SMS unsubscribe uses a link; when `false` or omitted, a stop-word is used |

*→ [`AccountSenderDetails`](/api/client/src/interfaces/AccountSenderDetails)*

## Next steps

- `textMessageSenderName` is used automatically when creating a default SMS campaign — see [SMS Campaigns](./sms-campaigns).
