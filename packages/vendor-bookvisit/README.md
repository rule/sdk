# @rule/vendor-bookvisit

> **Under Development** — This package is not yet published to npm. It is under active development and will be included in a future release of the Rule.io SDK. The API is unstable and may change without notice.

---

BookVisit preset for the Rule.io SDK. Field and tag schemas for BookVisit hotel bookings, plus `convertBookVisitBooking`, a pure function that turns a BookVisit booking (`GET /bookings/booking-v1?BookingGuidId=…&FetchExternalBooking=true`) into a `client.subscribers.sync()` payload.

```ts
import { bookvisitPreset, convertBookVisitBooking, BOOKVISIT_TAGS } from '@rule/vendor-bookvisit';

const result = convertBookVisitBooking(booking);
if (result.ok) {
  await client.subscribers.sync(result.payload);
  // sync() fires no tag automations — send the booking email explicitly,
  // once per booking status change (resetTagAutomation re-fires on every call).
  // isNewStatusForBooking is your own dedupe, e.g. keyed on bookingGuidId + status.
  // mayAutomate is your own policy check: any tag-automation call unblocks a
  // blocked subscriber, so skip guests who must stay blocked.
  if (result.lifecycleTag && isNewStatusForBooking(booking) && (await mayAutomate(result.email))) {
    await client.subscribers.resetTagAutomation({ email: result.email }, result.lifecycleTag);
  }
}
```

- Lifecycle tags from `bookingStatus`: `booking-confirmed` (New), `booking-changed`, `booking-cancelled`, `booking-no-show`; `Unknown` or a missing status gets none. They are markers only: `subscribers.sync()` adds tags without firing automations, so the caller fires the one returned as `lifecycleTag`. Use `resetTagAutomation()`, not `triggerTagAutomation()`: a returning guest already holds the tag, and `triggerTagAutomation()` does nothing once that automation has completed. `resetTagAutomation()` also cancels messages still queued from that tag's previous pass (an earlier booking's reminder); use `forceTagAutomation()` instead when overlapping bookings must keep theirs. Every tag-automation call (`trigger`, `force` or `reset`) also unblocks a blocked subscriber, regardless of `marketing-consent` — check your own policy before calling it.
- `ota` when `pointOfSale` is `OTA` or the booking has an external reservation ID, otherwise `direct`. `conference` for conference bookings.
- `marketing-consent` only for direct bookings with `allowEmailAdvertising: true` and a non-relay email. BookVisit's flag only covers its own booking flow, so it is never trusted for OTA bookings.
- OTA relay addresses (e.g. `@guest.booking.com`) are synced, since booking emails reach the guest, and flagged with `isOtaRelayEmail`.
- A booking with no customer email, or a malformed one (international addresses such as `åsa@åre.se` are accepted), returns `{ ok: false, error: { code: 'missing-email' | 'invalid-email' } }` instead of a partial payload.
- The phone is sent only when it converts unambiguously to E.164; otherwise it is left out.
- Tags are only ever added: `subscribers.sync()` does not remove tags, so a guest keeps `marketing-consent` and the lifecycle and source tags from earlier bookings. Removing stale tags is up to the caller.

The package holds no API client, credentials or polling logic.

See the [main `@rule/sdk` README](../sdk/README.md) for full SDK docs.
