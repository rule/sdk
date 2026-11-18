# @rule/vendor-bookvisit

> **Under Development** — This package is not yet published to npm. It is under active development and will be included in a future release of the Rule.io SDK. The API is unstable and may change without notice.

---

BookVisit preset for the Rule.io SDK. Field and tag schemas for BookVisit hotel bookings, plus `convertBookVisitBooking`, a pure function that turns a BookVisit booking (`GET /bookings/booking-v1?BookingGuidId=…&FetchExternalBooking=true`) into a `client.subscribers.sync()` payload.

```ts
import { bookvisitPreset, convertBookVisitBooking, BOOKVISIT_TAGS } from '@rule/vendor-bookvisit';

const result = convertBookVisitBooking(booking);
if (result.ok) await client.subscribers.sync(result.payload);
```

- Lifecycle tags from `bookingStatus`: `booking-confirmed` (New), `booking-changed`, `booking-cancelled`, `booking-no-show`; `Unknown` gets none.
- `ota` when `pointOfSale` is `OTA` or the booking has an external reservation ID, otherwise `direct`. `conference` for conference bookings.
- `marketing-consent` only for direct bookings with `allowEmailAdvertising: true` and a non-relay email. BookVisit's flag only covers its own booking flow, so it is never trusted for OTA bookings.
- OTA relay addresses (e.g. `@guest.booking.com`) are synced, since booking emails reach the guest, and flagged with `isOtaRelayEmail`.
- A booking with no customer email, or a malformed one, returns `{ ok: false, error: { code: 'missing-email' | 'invalid-email' } }` instead of a partial payload.
- The phone is sent only when it converts unambiguously to E.164; otherwise it is left out.
- Tags are only ever added: `subscribers.sync()` does not remove tags, so a guest keeps `marketing-consent` and the lifecycle and source tags from earlier bookings. Removing stale tags is up to the caller.

The package holds no API client, credentials or polling logic.

See the [main `@rule/sdk` README](../sdk/README.md) for full SDK docs.
