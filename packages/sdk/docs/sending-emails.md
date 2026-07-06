# Sending Emails

The SDK provides two high-level helpers that handle the full creation flow — campaign/automation → message → template → dynamic set — in a single call, with automatic cleanup on failure.

## Campaign Emails (one-off sends)

```typescript
const result = await client.createCampaignEmail({
  name: 'Spring Sale',
  subject: 'Spring deals are here!',
  brandStyleId,
  tags: [{ id: 1, negative: false }],
});

console.log(result.campaignId, result.templateId);
```

## Automation Emails (tag-triggered)

```typescript
const result = await client.createAutomationEmail({
  name: 'Order Confirmation',
  triggerType: 'tag',
  triggerValue: 'order-confirmed',
  subject: 'Your order is confirmed!',
  brandStyleId,
});

console.log(result.automationId, result.templateId);
```

## Using a custom template

Both helpers accept either `brandStyleId` (auto-builds a branded template) or `template` (your own `RcmlDocument`). You can also pass custom `sections` to replace the default placeholder content when using `brandStyleId`:

```typescript
import { createBrandTemplate, createContentSection, createBrandHeading, createTextNode } from '@rule/sdk';

const template = createBrandTemplate({
  brandStyle: myBrand,
  sections: [
    createContentSection([
      createBrandHeading(createTextNode('Your order is confirmed!')),
    ]),
  ],
});

const result = await client.createAutomationEmail({
  name: 'Order Confirmation',
  triggerType: 'tag',
  triggerValue: 'order-confirmed',
  subject: 'Your order is confirmed!',
  template,
});
```

> **Note:** Trigger tags must exist before creating automations. The SDK looks up the tag ID by name via `getTagIdByName()`. Create tags first using the v2 API if they don't exist on the account.

## See also

- [Brand Styles](/packages/client/brand-styles) — resolve `brandStyleId` and `myBrand`
- [Building Templates](/packages/rcml/) — compose a custom `RcmlDocument`
