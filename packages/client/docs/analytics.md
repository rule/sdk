# Analytics

The analytics API gives you open, click, bounce, and other engagement metrics for your campaigns and automations. Use it to understand how individual sends are performing, or to get a broad view of account-wide activity over time.

## Getting account-wide statistics

Omit the `objectType` parameter to get aggregate metrics for all sends in a date range:

```typescript
const result = await client.analytics.get({
  dateFrom: '2025-01-01',
  dateTo: '2025-01-31',
});
```

Dates are required. The time portion is stripped automatically — `'2025-01-01T12:00:00Z'` is treated the same as `'2025-01-01'`.

*→ [`AnalyticsResult`](/api/client/src/interfaces/AnalyticsResult) · [`AnalyticsStat`](/api/client/src/interfaces/AnalyticsStat)*

## Getting metrics for specific campaigns

To drill into a specific campaign (or multiple campaigns), provide `objectType`, `objectIds`, and the `metrics` you want. Use the `AnalyticsObjectTypes` and `AnalyticsMetrics` constants for autocomplete:

```typescript
import { AnalyticsMetrics, AnalyticsObjectTypes } from '@rule/client';

const result = await client.analytics.get({
  dateFrom: '2025-01-01',
  dateTo: '2025-01-31',
  objectType: AnalyticsObjectTypes.campaign,
  objectIds: ['123', '456'],
  metrics: [
    AnalyticsMetrics.sent,
    AnalyticsMetrics.openUniq,
    AnalyticsMetrics.clickUniq,
    AnalyticsMetrics.hardBounce,
    AnalyticsMetrics.softBounce,
  ],
});
```

When `objectType` is provided, both `objectIds` and `metrics` must be non-empty arrays.

*→ [`AnalyticsQueryParams`](/api/client/src/interfaces/AnalyticsQueryParams)*

## Getting metrics for automations

```typescript
import { AnalyticsMetrics, AnalyticsObjectTypes } from '@rule/client';

const result = await client.analytics.get({
  dateFrom: '2025-01-01',
  dateTo: '2025-01-31',
  objectType: AnalyticsObjectTypes.automail,
  objectIds: ['789'],
  metrics: [AnalyticsMetrics.sent, AnalyticsMetrics.openUniq, AnalyticsMetrics.clickUniq],
});
```

## Filtering by message type

Narrow results to a specific channel:

```typescript
import { AnalyticsMessageTypes } from '@rule/client';

const result = await client.analytics.get({
  dateFrom: '2025-01-01',
  dateTo: '2025-01-31',
  messageType: AnalyticsMessageTypes.email,
});
```

## Available metrics

| Constant | String value | Description |
|---|---|---|
| `AnalyticsMetrics.sent` | `'sent'` | Total emails delivered to the provider |
| `AnalyticsMetrics.delivered` | `'delivered'` | Successfully delivered to the recipient |
| `AnalyticsMetrics.open` | `'open'` | Total opens |
| `AnalyticsMetrics.openUniq` | `'open_uniq'` | Unique opens |
| `AnalyticsMetrics.click` | `'click'` | Total clicks |
| `AnalyticsMetrics.clickUniq` | `'click_uniq'` | Unique clicks |
| `AnalyticsMetrics.totalBounce` | `'total_bounce'` | All delivery failures combined |
| `AnalyticsMetrics.hardBounce` | `'hard_bounce'` | Permanent delivery failures |
| `AnalyticsMetrics.softBounce` | `'soft_bounce'` | Temporary delivery failures |
| `AnalyticsMetrics.unsubscribe` | `'unsubscribe'` | Unsubscribe events |
| `AnalyticsMetrics.spam` | `'spam'` | Spam complaint reports |

The available metrics may vary by account plan. Check the API response for which metrics are populated for your account.

## Available object types

| Constant | String value |
|---|---|
| `AnalyticsObjectTypes.campaign` | `'CAMPAIGN'` |
| `AnalyticsObjectTypes.automail` | `'AUTOMAIL'` |
| `AnalyticsObjectTypes.journey` | `'JOURNEY'` |
| `AnalyticsObjectTypes.abTest` | `'AB_TEST'` |
| `AnalyticsObjectTypes.transactionalName` | `'TRANSACTIONAL_NAME'` |

## Next steps

- For raw per-subscriber event data, use [Exports](./exports) (Enterprise)
- Review campaign setup: [Email Campaigns](./email-campaigns)
