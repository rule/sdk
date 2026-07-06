# Managing Subscribers

Subscribers are the contacts in your Rule.io account. This guide covers adding new subscribers, keeping their data up to date, looking them up by different identifiers, and removing them.

## Adding a subscriber

Use `subscribers.create()` to add a new subscriber. At least one of `email`, `phoneNumber`, or `customIdentifier` is required:

```typescript
// By email
const subscriber = await client.subscribers.create({
  email: 'jane@example.com',
  status: 'ACTIVE',
});
const subscriberId = subscriber.id;

// By phone number
await client.subscribers.create({
  phoneNumber: '+46701234567',
  status: 'ACTIVE',
});

// By custom identifier (your own system's ID)
await client.subscribers.create({
  customIdentifier: 'user-abc123',
  email: 'jane@example.com',
  status: 'ACTIVE',
});
```

Valid `status` values: `'ACTIVE'`, `'BLOCKED'`, `'PENDING'`. Omitting `status` defaults to `'ACTIVE'` on the Rule.io side.

`language` is optional and can be included in any of the above forms. When omitted, the subscriber inherits the account's default language. Pass a BCP 47 language tag to override it:

```typescript
await client.subscribers.create({
  email: 'jane@example.com',
  status: 'ACTIVE',
  language: 'sv', // override to Swedish
});
```

*→ [`CreateSubscriberPayload`](/api/client/src/interfaces/CreateSubscriberPayload) · [`Subscriber`](/api/client/src/interfaces/Subscriber)*

To add many subscribers at once, use `bulkCreateSubscribers()` instead — it accepts up to 1000 entries per call. See [Bulk Create Subscribers](./bulk-create-subscribers).

## Looking up a subscriber

Use the method that matches the identifier you have. For operations that accept a `SubscriberIdentifier` object (tag methods, block/unblock, etc.), see [Subscriber Identifiers](./subscriber-identifiers).

```typescript
// By email address
const result = await client.subscribers.getByEmail('jane@example.com');

// By numeric Rule.io ID
const result = await client.subscribers.getById(42);

// By phone number
const result = await client.subscribers.getByPhone('+46701234567');
```

All three return `null` when no matching subscriber is found:

```typescript
const subscriber = await client.subscribers.getByEmail('jane@example.com');
if (subscriber === null) {
  // not found
} else {
  console.log(subscriber.id);        // numeric Rule.io ID
  console.log(subscriber.email);
  console.log(subscriber.optedIn);   // boolean
  console.log(subscriber.tags);      // SubscriberTag[]
}
```

*→ [`Subscriber`](/api/client/src/interfaces/Subscriber)*

## Updating subscriber data

To update `status` or `language`, call `create()` again with the same email — the API will update the existing record:

```typescript
await client.subscribers.create({
  email: 'jane@example.com',
  status: 'BLOCKED',
});
```

To write custom fields or assign tags alongside an update, use [`subscribers.sync()`](./syncing-subscribers).

## Removing a subscriber

Delete a subscriber using whichever identifier you have:

```typescript
await client.subscribers.deleteByEmail('jane@example.com');
await client.subscribers.deleteById(42);
await client.subscribers.deleteByPhoneNumber('+46701234567');
await client.subscribers.deleteByCustomIdentifier('user-abc123');
```

## Next steps

- Assign tags to segment your subscribers: [Organizing with Tags](./organizing-with-tags)
- Write custom field data during sync: [Custom Fields](./custom-fields)
- Sync subscriber data in one call: [Syncing Subscribers](./syncing-subscribers)
