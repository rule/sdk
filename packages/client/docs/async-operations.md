# Asynchronous Operations

Some methods in `@rule/client` return immediately once Rule.io has accepted the request. The actual work — tagging subscribers, blocking contacts, sending bulk updates — happens in the background on Rule.io's side.

These methods are:

| Method | Description |
|--------|-------------|
| `subscribers.addSubscriberTags()` | Add tags to one subscriber |
| `subscribers.removeSubscriberTags()` | Remove tags from one subscriber |
| `subscribers.bulkAddSubscriberTags()` | Add tags to many subscribers |
| `subscribers.bulkRemoveSubscriberTags()` | Remove tags from many subscribers |
| `subscribers.block()` | Block multiple subscribers |
| `subscribers.unblock()` | Unblock multiple subscribers |

A success response from these methods means the request was **accepted**, not that it has completed.

## Waiting for completion

If your workflow depends on knowing when the operation finishes — for example, verifying tags before sending a campaign — pass a `callbackUrl`. Rule.io will POST a notification to that URL when processing is complete.

```typescript
await client.subscribers.bulkAddSubscriberTags(
  [{ email: 'alice@example.com' }, { email: 'bob@example.com' }],
  ['newsletter'],
  { callbackUrl: 'https://yourapp.com/webhooks/rule' },
);
```

The same `callbackUrl` option is available on all async methods listed above.

## When to omit the callback

If you only need eventual consistency — for example, the tags will be in place before the next scheduled campaign send — you can omit the callback and simply continue. Rule.io processes bulk operations quickly under normal load.

## Not the same as account-level webhooks

The `callbackUrl` on these methods is one-off: Rule.io fires it once when the specific background job triggered by a single SDK call finishes. It is unrelated to the **account-level webhooks** configured in the Rule UI under Settings → Developer → Webhooks, which fire on platform events like campaign-opened or subscriber-suppressed and have completely different payload shapes. See [Webhooks](./webhooks) for those.
