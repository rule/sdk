/**
 * BookVisit booking → Rule.io subscriber converter.
 *
 * Pure function: no I/O. The caller fetches the booking with
 * `GET /bookings/booking-v1?BookingGuidId=…&FetchExternalBooking=true` and
 * passes the payload to `client.subscribers.sync()`.
 */

import type { CustomFieldGroupData, SubscriberSyncPayload } from '@rule/client';
import type {
  BookVisitBooking,
  BookVisitBookingData,
  BookVisitBookingStatus,
  BookVisitNamedDescription,
} from './bookvisit-types.js';
import { BOOKVISIT_BOOKING_FIELD_SCHEMA, BOOKVISIT_SUBSCRIBER_FIELD_SCHEMA } from './fields.js';
import { BOOKVISIT_TAGS } from './tags.js';
import type { BookVisitLifecycleTag } from './tags.js';

/**
 * Email domains OTAs use for relay addresses. Mail to them reaches the guest
 * for transactional booking messages, but the guest never gave the hotel
 * marketing consent through them.
 */
export const OTA_RELAY_EMAIL_DOMAINS: readonly string[] = ['guest.booking.com'];

/** Successful conversion. */
export interface BookVisitConversionSuccess {
  ok: true;
  /** Input for `client.subscribers.sync()`. */
  payload: SubscriberSyncPayload;
  /** The validated, trimmed customer email (also `payload.subscriber.email`). */
  email: string;
  /** `pointOfSale` is `OTA` or the booking has an external reservation ID. */
  isOta: boolean;
  /** The email is an OTA relay address (see {@link OTA_RELAY_EMAIL_DOMAINS}). Still synced. */
  isOtaRelayEmail: boolean;
  /**
   * The lifecycle tag for this booking's status; absent when `bookingStatus`
   * is `Unknown` or missing. `subscribers.sync()` adds tags without firing
   * automations, so pass this to `client.subscribers.resetTagAutomation()` to
   * send the booking email — not `triggerTagAutomation()`, which does nothing
   * for a returning guest who already completed that automation. Any
   * tag-automation call unblocks a blocked subscriber; gate it on your policy.
   */
  lifecycleTag?: BookVisitLifecycleTag;
}

/** Failed conversion — nothing should be synced. */
export interface BookVisitConversionFailure {
  ok: false;
  error: {
    code: 'missing-email' | 'invalid-email';
    message: string;
    /** BookVisit booking GUID, when present, so the caller can log it. */
    bookingGuidId?: string;
  };
}

export type BookVisitConversionResult = BookVisitConversionSuccess | BookVisitConversionFailure;

const LIFECYCLE_TAGS: Record<BookVisitBookingStatus, BookVisitLifecycleTag | undefined> = {
  New: BOOKVISIT_TAGS.bookingConfirmed,
  Changed: BOOKVISIT_TAGS.bookingChanged,
  Cancelled: BOOKVISIT_TAGS.bookingCancelled,
  NoShow: BOOKVISIT_TAGS.bookingNoShow,
  Unknown: undefined,
};

/** True when `email`'s domain is (a subdomain of) a known OTA relay domain. */
export function isOtaRelayEmail(email: string): boolean {
  const domain = email.slice(email.lastIndexOf('@') + 1).trim().toLowerCase();

  return OTA_RELAY_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

/** Drops empty values so Rule.io leaves the field out instead of blanking it. */
function compact(values: Record<string, string | number | null | undefined>): CustomFieldGroupData {
  const out: CustomFieldGroupData = {};

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== '') out[key] = value;
  }

  return out;
}

function joinNames(items: BookVisitNamedDescription[] | null | undefined): string | undefined {
  const names = [...new Set((items ?? []).map((i) => i.name?.trim()).filter((n): n is string => !!n))];

  return names.length > 0 ? names.join(', ') : undefined;
}

function nightsBetween(start: string | undefined, end: string | undefined): number | undefined {
  if (!start || !end) return undefined;
  const nights = Math.round((Date.parse(end.slice(0, 10)) - Date.parse(start.slice(0, 10))) / 86_400_000);

  return Number.isFinite(nights) && nights >= 0 ? nights : undefined;
}

/** Country codes whose domestic numbers start with a single trunk `0` that E.164 drops. */
const TRUNK_ZERO = new Set(['31', '32', '33', '41', '43', '44', '46', '49', '353', '358']);

/** Country codes whose domestic numbers have no trunk prefix. */
const NO_TRUNK = new Set(['45', '47', '354']);

/** Country codes whose numbers keep their leading 0 after the code (Italy, San Marino). */
const KEEP_ZERO = new Set(['39', '378']);

/**
 * Builds an E.164 number from BookVisit's `phoneNumber` + numeric
 * `phoneCountryCode`, for the numbering plans listed above only. Returns
 * undefined rather than guess whenever the input is ambiguous — no numeric
 * country code, an unlisted numbering plan, an international number that
 * doesn't start with the code, or a domestic number that might already
 * include it — so a phone never lands on the wrong number.
 */
function toE164(phoneNumber: string | null | undefined, countryCode: string | null | undefined): string | undefined {
  const cc = (countryCode ?? '').replace(/[\s+]/g, '').replace(/^00/, '');
  const digits = (phoneNumber ?? '').replace(/[\s\-().]/g, '');

  if (!/^\d{1,3}$/.test(cc) || !digits) return undefined;
  if (!TRUNK_ZERO.has(cc) && !NO_TRUNK.has(cc) && !KEEP_ZERO.has(cc)) return undefined;

  const intl = /^(\+|00)/.exec(digits);
  let national = intl ? digits.slice(intl[0].length) : digits;

  if (intl) {
    if (!national.startsWith(cc)) return undefined;
    national = national.slice(cc.length);
  } else if (national.startsWith(cc)) {
    // Could already include the country code, or not — don't guess.
    return undefined;
  }

  // "+46 (0)70…", "+46 070…", "070…": a single trunk 0 that E.164 drops.
  if (TRUNK_ZERO.has(cc) && national.startsWith('0')) national = national.slice(1);
  if (!KEEP_ZERO.has(cc) && national.startsWith('0')) return undefined;

  const e164 = `+${cc}${national}`;

  return /^\+[1-9]\d{6,14}$/.test(e164) ? e164 : undefined;
}

/**
 * Local part: the WHATWG `<input type="email">` set plus Unicode letters,
 * combining marks and decimal digits (`åsa`, composed or decomposed).
 */
const EMAIL_LOCAL = /^[\p{L}\p{M}\p{Nd}.!#$%&'*+/=?^_`{|}~-]+$/u;

/**
 * Domain: dot-separated labels of Unicode letters, marks and decimal digits
 * with inner hyphens (so `åre.se` passes as written), ending in an alphabetic
 * or `xn--` top-level label — which rules out IPv4 forms like `1.2.3.4`.
 * Nothing is normalised: fullwidth dots, percent-encoding, control and
 * zero-width characters fail instead of being silently mapped.
 */
const EMAIL_DOMAIN =
  /^(?:[\p{L}\p{M}\p{Nd}](?:[\p{L}\p{M}\p{Nd}-]{0,61}[\p{L}\p{M}\p{Nd}])?\.)+(?:[\p{L}\p{M}]{2,63}|xn--[a-z0-9](?:[a-z0-9-]{0,57}[a-z0-9])?)$/iu;

/**
 * Shape check; the local part may not start or end with a dot or contain two
 * in a row. Invisible default-ignorable characters (variation selectors,
 * joiners) and compatibility characters (fullwidth or mathematical digits,
 * circled digits) are rejected — `NFC === NFKC` keeps decomposed `åsa` valid.
 */
function isValidEmail(email: string): boolean {
  const at = email.lastIndexOf('@');
  const local = email.slice(0, at);

  if (/\p{Default_Ignorable_Code_Point}/u.test(email)) return false;
  if (email.normalize('NFC') !== email.normalize('NFKC')) return false;
  if (at < 1 || !EMAIL_LOCAL.test(local)) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;

  return EMAIL_DOMAIN.test(email.slice(at + 1));
}

function conversionFailure(
  code: BookVisitConversionFailure['error']['code'],
  problem: string,
  data: BookVisitBookingData
): BookVisitConversionFailure {
  return {
    ok: false,
    error: {
      code,
      message: `BookVisit booking ${data.bookingCode ?? data.bookingGuidId ?? '(unknown)'} ${problem}`,
      ...(data.bookingGuidId ? { bookingGuidId: data.bookingGuidId } : {}),
    },
  };
}

/**
 * Converts a BookVisit booking into a Rule.io subscriber sync payload.
 *
 * - Lifecycle tag from `bookingStatus` (`Unknown` gets none).
 * - `ota` when `pointOfSale` is `OTA` or `externalBookingInfo.externalReservationId`
 *   is set, otherwise `direct`.
 * - `marketing-consent` only for non-OTA bookings with
 *   `allowEmailAdvertising === true` and a non-relay email. BookVisit's flag
 *   only covers consent given in its own booking flow, so it is ignored for
 *   OTA bookings.
 * - OTA relay emails are synced (booking emails work) and flagged via
 *   `isOtaRelayEmail`.
 * - A missing or malformed email returns `{ ok: false }` with code
 *   `missing-email` / `invalid-email`; nothing should be synced.
 * - The phone is included only when it converts unambiguously to E.164.
 * - `tags` lists the tags this booking earns; `subscribers.sync()` only adds
 *   tags, so removing stale ones from earlier bookings is up to the caller.
 * - `subscribers.sync()` fires no tag automations. To send the booking email,
 *   call `resetTagAutomation()` with `lifecycleTag` after a successful sync —
 *   it re-fires for returning guests, where `triggerTagAutomation()` would do
 *   nothing. It re-fires on every call, so run it once per booking status
 *   change (e.g. keyed on `bookingGuidId` + status), not on every poll. It
 *   also cancels messages still queued from that tag's previous pass (an
 *   earlier booking's reminder); use `forceTagAutomation()` instead when
 *   overlapping bookings must keep theirs. Any tag-automation call also
 *   unblocks a blocked subscriber, so gate it on the caller's own policy.
 *
 * @example
 * ```typescript
 * const result = convertBookVisitBooking(booking);
 * if (!result.ok) {
 *   logger.warn(result.error.message);
 * } else {
 *   await client.subscribers.sync(result.payload);
 *   // isNewStatusForBooking: the caller's own dedupe (bookingGuidId + status).
 *   // mayAutomate: the caller's policy check — automation calls unblock blocked subscribers.
 *   if (result.lifecycleTag && isNewStatusForBooking(booking) && (await mayAutomate(result.email))) {
 *     await client.subscribers.resetTagAutomation({ email: result.email }, result.lifecycleTag);
 *   }
 * }
 * ```
 */
export function convertBookVisitBooking(booking: BookVisitBooking): BookVisitConversionResult {
  const customer = booking.bookingCustomer ?? {};
  const data = booking.bookingData ?? {};
  const external = booking.externalBookingInfo ?? {};
  const email = customer.email?.trim();

  if (!email) return conversionFailure('missing-email', 'has no customer email', data);
  if (!isValidEmail(email)) return conversionFailure('invalid-email', 'has an invalid customer email', data);

  const isOta = data.pointOfSale === 'OTA' || !!external.externalReservationId;
  const relayEmail = isOtaRelayEmail(email);
  const lifecycleTag = data.bookingStatus ? LIFECYCLE_TAGS[data.bookingStatus] : undefined;

  const tags: string[] = [];

  if (lifecycleTag) tags.push(lifecycleTag);
  tags.push(isOta ? BOOKVISIT_TAGS.ota : BOOKVISIT_TAGS.direct);
  if (data.isConferenceBooking === true) tags.push(BOOKVISIT_TAGS.conference);
  if (!isOta && !relayEmail && customer.allowEmailAdvertising === true) tags.push(BOOKVISIT_TAGS.marketingConsent);

  const S = BOOKVISIT_SUBSCRIBER_FIELD_SCHEMA;
  const B = BOOKVISIT_BOOKING_FIELD_SCHEMA;
  const subscriberFields = compact({
    [S.guestFirstName.fieldName]: customer.firstName?.trim(),
    [S.guestLastName.fieldName]: customer.lastName?.trim(),
    [S.guestCity.fieldName]: customer.city?.trim(),
    [S.guestCountryCode.fieldName]: customer.countryCode?.trim(),
    [S.guestCustomerId.fieldName]: customer.customerId,
  });
  const bookingFields = compact({
    [B.bookingRef.fieldName]: data.bookingCode,
    [B.checkInDate.fieldName]: data.startDate?.slice(0, 10),
    [B.checkOutDate.fieldName]: data.endDate?.slice(0, 10),
    [B.nights.fieldName]: nightsBetween(data.startDate, data.endDate),
    [B.totalGuests.fieldName]: data.guests?.length,
    [B.totalPrice.fieldName]: data.totalPrice,
    [B.currency.fieldName]: data.currencyCode,
    [B.roomName.fieldName]: joinNames(data.roomDescriptions),
    [B.ratePlan.fieldName]: joinNames(data.ratePlanDescriptions),
    [B.status.fieldName]: data.bookingStatus,
    [B.source.fieldName]: isOta ? 'ota' : 'direct',
    [B.channel.fieldName]: (isOta ? external.externalChannelSource?.trim() : undefined) || data.pointOfSale,
  });
  const phoneNumber = toE164(customer.phoneNumber, customer.phoneCountryCode);

  return {
    ok: true,
    email,
    isOta,
    isOtaRelayEmail: relayEmail,
    ...(lifecycleTag ? { lifecycleTag } : {}),
    payload: {
      subscriber: { email, ...(phoneNumber ? { phoneNumber } : {}) },
      ...(Object.keys(subscriberFields).length > 0
        ? { customFieldData: { [S.guestFirstName.groupName]: subscriberFields } }
        : {}),
      historicalCustomFieldData: { [B.bookingRef.groupName]: bookingFields },
      tags,
    },
  };
}
