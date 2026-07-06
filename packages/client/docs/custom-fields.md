# Subscriber Custom Fields

Custom fields store structured data about your subscribers — order details, preferences, membership tiers, or any other per-subscriber attributes your emails need. Rule.io organises custom fields into named groups (e.g. `"Order"`, `"Profile"`), and each group contains named fields.

The most common way to write custom fields is via `subscribers.sync()`, which creates or updates a subscriber and writes their field data in one call. See [Syncing Subscribers](./syncing-subscribers) for details. For cases where you need to read, update, or delete individual field data records, the methods below give you full control.

## Reading field data

The SDK exposes a family of methods for reading paginated custom field data:

| Method | What it does |
|---|---|
| `listCustomFieldData()` | Fetch exactly one page |
| `iterateCustomFieldDataPages()` | Auto-paginate and yield full pages |
| `iterateCustomFieldData()` | Auto-paginate and yield individual records |
| `listAllCustomFieldData()` | Auto-paginate and collect everything into an array |

The same four-method family exists for group-scoped reads (`listCustomFieldDataByGroup`, `iterateCustomFieldDataByGroupPages`, `iterateCustomFieldDataByGroup`, `listAllCustomFieldDataByGroup`).

## Fetching one page

`listCustomFieldData()` fetches exactly one page of records. Use this for manual pagination, UI tables, or "load more" flows.

```typescript
// First page, default page size
const result = await client.subscribers.listCustomFieldData(subscriberId);

// Specific page and size
const result = await client.subscribers.listCustomFieldData(subscriberId, {
  pagination: { page: 2, pageSize: 20 },
});

// Filter by group name, by ID, or both
const result = await client.subscribers.listCustomFieldData(subscriberId, {
  pagination: { pageSize: 50 },
  filters: { groupNames: ['Order', 'Purchases'] },
});

const result = await client.subscribers.listCustomFieldData(subscriberId, {
  filters: { groupIds: [169233, 169234] },
});

const result = await client.subscribers.listCustomFieldData(subscriberId, {
  filters: { groupNames: ['Order'], groupIds: [169234] },
});
```

The result contains `data` (array of records) and `meta` with pagination info:

```typescript
const result = await client.subscribers.listCustomFieldData(subscriberId);

for (const record of result.data) {
  console.log(record.groupName, record.values);
}

console.log(result.meta?.page, result.meta?.pageSize);
```

To scope the fetch to a single group, use `listCustomFieldDataByGroup()`. The `group` argument accepts a name or numeric ID:

```typescript
// By group name
const result = await client.subscribers.listCustomFieldDataByGroup(subscriberId, 'Order');

// By numeric ID
const result = await client.subscribers.listCustomFieldDataByGroup(subscriberId, 169233);

// Narrow to specific fields
const result = await client.subscribers.listCustomFieldDataByGroup(subscriberId, 'Order', {
  filters: { fields: ['OrderRef', 'Total'] },
});
```

*→ [`CustomFieldDataListResult`](/api/client/src/interfaces/CustomFieldDataListResult) · [`ListCustomFieldDataParams`](/api/client/src/interfaces/ListCustomFieldDataParams) · [`ListCustomFieldDataByGroupParams`](/api/client/src/interfaces/ListCustomFieldDataByGroupParams)*

## Iterating over records

`iterateCustomFieldData()` automatically fetches additional pages and yields individual records one by one. This is the recommended approach for scripts, sync jobs, exports, and large datasets.

```typescript
for await (const record of client.subscribers.iterateCustomFieldData(subscriberId)) {
  console.log(record.groupName, record.values);
}
```

You can filter and control the starting page:

```typescript
for await (const record of client.subscribers.iterateCustomFieldData(subscriberId, {
  pagination: { page: 2, pageSize: 50 },
  filters: { groupIds: [169233] },
})) {
  console.log(record);
}
```

`pagination.pageSize` controls how many records are fetched per API request — not the total records to yield.

Use `iterateCustomFieldDataPages()` instead when you need access to page-level metadata alongside the records:

```typescript
for await (const page of client.subscribers.iterateCustomFieldDataPages(subscriberId, {
  pagination: { pageSize: 100 },
  filters: { groupNames: ['Order'] },
})) {
  console.log(page.data);         // records on this page
  console.log(page.meta?.page);   // current page number
}
```

Both methods have group-scoped equivalents — `iterateCustomFieldDataByGroup()` and `iterateCustomFieldDataByGroupPages()` — that accept a `group` argument after `subscriberId`:

```typescript
for await (const record of client.subscribers.iterateCustomFieldDataByGroup(subscriberId, 'Order')) {
  console.log(record.values);
}
```

*→ [`CustomFieldData`](/api/client/src/interfaces/CustomFieldData) · [`ListCustomFieldDataParams`](/api/client/src/interfaces/ListCustomFieldDataParams)*

## Collecting all records at once

`listAllCustomFieldData()` fetches all matching records and returns them as a single array. Use `maxItems` to avoid unbounded memory usage on large datasets. Prefer `iterateCustomFieldData()` when memory is a concern.

```typescript
const records = await client.subscribers.listAllCustomFieldData(subscriberId, {
  filters: { groupNames: ['Order'] },
  maxItems: 500,
});
```

The group-scoped version works the same way:

```typescript
const records = await client.subscribers.listAllCustomFieldDataByGroup(subscriberId, 'Order', {
  maxItems: 200,
});
```

*→ [`CustomFieldData`](/api/client/src/interfaces/CustomFieldData) · [`ListAllCustomFieldDataParams`](/api/client/src/interfaces/ListAllCustomFieldDataParams) · [`ListAllCustomFieldDataByGroupParams`](/api/client/src/interfaces/ListAllCustomFieldDataByGroupParams)*

## Writing field values

The SDK exposes a family of write methods:

| Method | What it does |
|---|---|
| `upsertCustomFieldData()` | Non-historical: create missing groups/fields and write values |
| `updateCustomFieldData()` | Non-historical: update existing groups/fields only |
| `upsertHistoricalCustomFieldData()` | Historical: create missing groups/fields and write values |
| `updateHistoricalCustomFieldData()` | Historical: update existing groups/fields only |
| `writeCustomFieldData()` | Raw write, full API payload control |
| `patchCustomFieldData()` | Update a specific record by identifier or data ID |

## Writing non-historical fields

`upsertCustomFieldData()` creates missing groups and fields automatically, then writes the values. Use this when you want a simple "set these fields, creating them if needed" behaviour:

```typescript
await client.subscribers.upsertCustomFieldData(subscriberId, {
  Profile: {
    FirstName: 'Astrid',
    Language: 'sv',
  },
  Order: {
    OrderRef: 'ORD-9921',
    Total: '149.00',
  },
});
```

`updateCustomFieldData()` writes values to existing groups and fields only. Missing groups or fields are silently ignored. Use this when you know the schema already exists and do not want to create new definitions:

```typescript
await client.subscribers.updateCustomFieldData(subscriberId, {
  Profile: {
    Language: 'en',
  },
});
```

*→ [`CustomFieldDataInput`](/api/client/src/type-aliases/CustomFieldDataInput)*

## Writing historical fields

Historical groups append a new entry on every write instead of overwriting the previous value. Use them for event streams like purchases, bookings, or logins.

`upsertHistoricalCustomFieldData()` creates missing groups and fields automatically before appending:

```typescript
await client.subscribers.upsertHistoricalCustomFieldData(subscriberId, {
  Purchases: {
    OrderRef: 'ORD-9921',
    Total: '149.00',
  },
});
```

`updateHistoricalCustomFieldData()` appends to existing historical groups only. Missing groups or fields are silently ignored:

```typescript
await client.subscribers.updateHistoricalCustomFieldData(subscriberId, {
  Purchases: {
    OrderRef: 'ORD-9922',
    Total: '89.00',
  },
});
```

*→ [`CustomFieldDataInput`](/api/client/src/type-aliases/CustomFieldDataInput)*

## Advanced write

`writeCustomFieldData()` accepts the raw API-shaped payload. Use it when you need full control over group creation, field creation, historical flags, or when writing multiple groups with mixed settings in a single call:

```typescript
await client.subscribers.writeCustomFieldData(subscriberId, {
  groups: [
    {
      group: 'Purchases',
      createIfNotExists: true,
      historical: true,
      values: [
        { field: 'OrderRef', createIfNotExists: true, value: 'ORD-9921' },
        { field: 'Total',    createIfNotExists: true, value: '149.00' },
      ],
    },
  ],
});
```

*→ [`WriteCustomFieldDataPayload`](/api/client/src/interfaces/WriteCustomFieldDataPayload) · [`CustomFieldGroupEntry`](/api/client/src/interfaces/CustomFieldGroupEntry) · [`CustomFieldEntry`](/api/client/src/interfaces/CustomFieldEntry)*

## Patching a record

`patchCustomFieldData()` updates field values in an existing record. The `identifier` locates the record to update:

- Use `dataId` when you already have the record's numeric ID (fastest lookup).
- Use `group + field + value` to find a record by its current field value.

```typescript
// By record ID
await client.subscribers.patchCustomFieldData(subscriberId, {
  identifier: { dataId: 8842 },
  values: [{ field: 'Total', value: '199.00' }],
});

// By field value lookup
await client.subscribers.patchCustomFieldData(subscriberId, {
  identifier: { group: 'Order', field: 'OrderRef', value: 'ORD-9921' },
  values: [{ field: 'Total', value: '199.00' }],
});
```

*→ [`PatchCustomFieldDataPayload`](/api/client/src/interfaces/PatchCustomFieldDataPayload)*

## Finding a record

`findCustomFieldData()` finds a single record matching the given criteria. Returns `null` when no match is found:

```typescript
const record = await client.subscribers.findCustomFieldData(subscriberId, {
  group: 'Order',
  field: 'OrderRef',
  value: 'ORD-9921',
});

if (record === null) {
  // not found
} else {
  console.log(record.data?.id); // numeric record ID
}
```

*→ [`CustomFieldDataResult`](/api/client/src/interfaces/CustomFieldDataResult) · [`SearchCustomFieldDataParams`](/api/client/src/interfaces/SearchCustomFieldDataParams)*

## Deleting field data

`deleteCustomFieldDataByGroup()` deletes all custom field data records for a subscriber in a specific group. Accepts a group name or numeric ID:

```typescript
await client.subscribers.deleteCustomFieldDataByGroup(subscriberId, 'Order');
await client.subscribers.deleteCustomFieldDataByGroup(subscriberId, 169233); // by ID
```

## Next steps

- Write custom fields alongside subscriber upsert: [Syncing Subscribers](./syncing-subscribers)
- Assign and remove tags: [Organizing with Tags](./organizing-with-tags)
- Use custom fields in email templates: [@rule/rcml](/packages/rcml/)
