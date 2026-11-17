# @rule/vendor-norce

> **Under Development** — This package is not yet published to npm. It is under active development and will be included in a future release of the Rule.io SDK. The API is unstable and may change without notice.

---

Norce preset for the Rule.io SDK. Ships the custom-field and tag names that the Norce Commerce→Rule.io integration writes, so order emails can be wired to them. No email templates or pre-built automations yet.

```ts
import { norcePreset, NORCE_FIELDS, NORCE_TAGS } from '@rule/vendor-norce';
```

## Tags

A Norce order event adds the tag for the order's status and removes the other order tags, except when the subscriber already has that tag (then nothing is removed). Other statuses change no tags.

| Norce order status | Tag | `NORCE_TAGS` key |
|---|---|---|
| Created | `OrderPlaced` | `orderPlaced` |
| Confirmed | `OrderProcessing` | `orderProcessing` |
| Delivered | `OrderShipped` | `orderShipped` |
| Invoiced | `OrderCompleted` | `orderCompleted` |
| Cancelled, Credited | `OrderCanceled` | `orderCanceled` |

## Fields

The integration writes to the `Order` group (historical: each event appends a record) and the `Subscriber` group (overwritten). `Order.Products` is a JSON list of the order's line items (Norce `Items`); loop over it with the `itemName` (`Name`), `itemSku` (`PartNo`), `itemQuantity` (`QtyOrdered`), `itemPrice` (`UnitPrice`) and `itemTotal` (`RowAmount`) keys. Only `Name` and `PartNo` are confirmed from the integration code so far.

See the [main `@rule/sdk` README](../sdk/README.md) for full SDK docs.
