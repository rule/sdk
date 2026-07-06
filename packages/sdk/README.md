# @rule/sdk

The official TypeScript SDK for the [Rule.io](https://rule.io) email marketing API. Build and send email campaigns, set up tag-triggered automations, manage subscribers, and compose RCML templates — all from code.

**Full TypeScript types** | **Node.js >= 20**

## Installation

```bash
npm install @rule/sdk
```

## Quick Start

```typescript
import { RuleClient } from '@rule/sdk';

const client = new RuleClient({ apiKey: process.env.RULE_API_KEY! });

await client.subscribers.create({
  email: 'customer@example.com',
  status: 'ACTIVE',
});

await client.subscribers.addSubscriberTag(
  { email: 'customer@example.com' },
  'order-confirmed',
);
```

Get your API key from [Rule.io Settings → API](https://app.rule.io/v5/#/app/settings/developer).

## Documentation

Full guides and API reference: see the [published documentation site](https://rulecom.github.io/rule-io-sdk/).

## License

MIT
