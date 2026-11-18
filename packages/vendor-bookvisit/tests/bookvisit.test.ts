/**
 * BookVisit Vendor Preset + Converter Tests
 */

import { describe, it, expect } from 'vitest';
import { createEmailTheme, EmailThemeColorType } from '@rule/rcml';
import { VendorPresetError } from '@rule/vendor';
import type { CustomFieldMap, VendorConsumerConfig } from '@rule/vendor';
import {
  bookvisitPreset,
  convertBookVisitBooking,
  isOtaRelayEmail,
  BOOKVISIT_FIELD_SCHEMA,
  BOOKVISIT_TAGS,
} from '../src/index.js';
import type { BookVisitBooking, BookVisitConversionSuccess } from '../src/index.js';

// ============================================================================
// Shared fixtures
// ============================================================================

const TEST_CUSTOM_FIELDS: CustomFieldMap = {
  'Subscriber.FirstName': 100001,
  'Subscriber.LastName': 100002,
  'Subscriber.City': 100003,
  'Subscriber.CountryCode': 100004,
  'Subscriber.BookVisitCustomerId': 100005,
  'Booking.BookingRef': 100006,
  'Booking.CheckInDate': 100007,
  'Booking.CheckOutDate': 100008,
  'Booking.Nights': 100009,
  'Booking.TotalGuests': 100010,
  'Booking.TotalPrice': 100011,
  'Booking.Currency': 100012,
  'Booking.RoomName': 100013,
  'Booking.RatePlan': 100014,
  'Booking.Status': 100015,
  'Booking.Source': 100016,
  'Booking.Channel': 100017,
};

const TEST_CONFIG: VendorConsumerConfig = {
  theme: createEmailTheme({
    brandStyleId: 99999,
    colors: [{ type: EmailThemeColorType.Primary, hex: '#0066CC' }],
  }),
  customFields: TEST_CUSTOM_FIELDS,
  websiteUrl: 'https://myhotel.example.com',
};

/** A direct (online) booking with marketing consent. */
function directBooking(overrides: Partial<BookVisitBooking> = {}): BookVisitBooking {
  return {
    bookingCustomer: {
      email: 'anna.svensson@example.com',
      firstName: 'Anna',
      lastName: 'Svensson',
      phoneNumber: '070-123 45 67',
      phoneCountryCode: '+46',
      countryCode: 'SE',
      city: 'Göteborg',
      allowEmailAdvertising: true,
      customerId: '6f1c2a3b-0000-4000-8000-000000000001',
    },
    bookingData: {
      bookingCode: 'BV-1001',
      bookingGuidId: '6f1c2a3b-0000-4000-8000-0000000000aa',
      bookingDate: '2026-11-01T10:15:00Z',
      startDate: '2026-12-10',
      endDate: '2026-12-13',
      bookingStatus: 'New',
      pointOfSale: 'Online',
      totalPrice: 4500,
      currencyCode: 'SEK',
      guests: [{ guestId: 'g1' }, { guestId: 'g2' }],
      roomDescriptions: [{ id: 'r1', name: 'Double Room' }],
      ratePlanDescriptions: [{ id: 'p1', name: 'Flexible' }],
      isConferenceBooking: false,
      channelId: '6f1c2a3b-0000-4000-8000-0000000000cc',
    },
    externalBookingInfo: null,
    ...overrides,
  };
}

function convertOk(booking: BookVisitBooking): BookVisitConversionSuccess {
  const result = convertBookVisitBooking(booking);

  if (!result.ok) throw new Error(`expected ok, got ${result.error.message}`);

  return result;
}

// ============================================================================
// Preset
// ============================================================================

describe('bookvisitPreset', () => {
  it('has correct vendor metadata and schemas', () => {
    expect(bookvisitPreset.vendor).toBe('bookvisit');
    expect(bookvisitPreset.displayName).toBe('BookVisit');
    expect(bookvisitPreset.vertical).toBe('hospitality');
    expect(bookvisitPreset.fields).toBe(BOOKVISIT_FIELD_SCHEMA);
    expect(bookvisitPreset.tags).toBe(BOOKVISIT_TAGS);
  });

  it('validateConfig passes with all required fields', () => {
    expect(() => bookvisitPreset.validateConfig(TEST_CONFIG)).not.toThrow();
  });

  it('validateConfig throws VendorPresetError listing exactly the missing fields', () => {
    const { 'Booking.Source': _source, 'Subscriber.City': _city, ...rest } = TEST_CUSTOM_FIELDS;
    const config: VendorConsumerConfig = { ...TEST_CONFIG, customFields: rest };

    expect(() => bookvisitPreset.validateConfig(config)).toThrow(VendorPresetError);
    expect(() => bookvisitPreset.validateConfig(config)).toThrow(
      'bookvisitPreset: missing customFields entries for: guestCity ("Subscriber.City"), source ("Booking.Source")'
    );
  });

  it('getRequiredFields returns every field path once', () => {
    const paths = bookvisitPreset.getRequiredFields().map((f) => f.fieldName);

    expect(paths).toEqual(Object.keys(TEST_CUSTOM_FIELDS));
  });

  it('getAutomations returns an empty list and getAutomation undefined', () => {
    expect(bookvisitPreset.getAutomations(TEST_CONFIG)).toEqual([]);
    expect(bookvisitPreset.getAutomation('booking-confirmed', TEST_CONFIG)).toBeUndefined();
  });

  it('subscriber fields are flat and booking fields historical', () => {
    for (const def of Object.values(BOOKVISIT_FIELD_SCHEMA)) {
      expect(def.historical).toBe(def.groupName === 'Booking');
      expect(['Subscriber', 'Booking']).toContain(def.groupName);
    }
  });
});

// ============================================================================
// Converter
// ============================================================================

describe('convertBookVisitBooking', () => {
  it('direct booking with consent: full payload, consent tag', () => {
    const result = convertOk(directBooking());

    expect(result.isOta).toBe(false);
    expect(result.isOtaRelayEmail).toBe(false);
    expect(result.payload).toEqual({
      subscriber: { email: 'anna.svensson@example.com', phoneNumber: '+46701234567' },
      customFieldData: {
        Subscriber: {
          FirstName: 'Anna',
          LastName: 'Svensson',
          City: 'Göteborg',
          CountryCode: 'SE',
          BookVisitCustomerId: '6f1c2a3b-0000-4000-8000-000000000001',
        },
      },
      historicalCustomFieldData: {
        Booking: {
          BookingRef: 'BV-1001',
          CheckInDate: '2026-12-10',
          CheckOutDate: '2026-12-13',
          Nights: 3,
          TotalGuests: 2,
          TotalPrice: 4500,
          Currency: 'SEK',
          RoomName: 'Double Room',
          RatePlan: 'Flexible',
          Status: 'New',
          Source: 'direct',
          Channel: 'Online',
        },
      },
      tags: ['booking-confirmed', 'direct', 'marketing-consent'],
    });
  });

  it('direct booking without consent: no consent tag', () => {
    const booking = directBooking();

    booking.bookingCustomer = { ...booking.bookingCustomer, allowEmailAdvertising: false };

    expect(convertOk(booking).payload.tags).toEqual(['booking-confirmed', 'direct']);
  });

  it('OTA booking with allowEmailAdvertising: true never gets the consent tag', () => {
    const booking = directBooking({
      externalBookingInfo: { externalReservationId: '4711', externalChannelSource: 'Expedia' },
    });
    const result = convertOk(booking);

    expect(result.isOta).toBe(true);
    expect(result.payload.tags).toEqual(['booking-confirmed', 'ota']);
    expect(result.payload.historicalCustomFieldData?.Booking).toMatchObject({ Source: 'ota', Channel: 'Expedia' });
  });

  it('pointOfSale OTA alone marks the booking OTA', () => {
    const booking = directBooking();

    booking.bookingData = { ...booking.bookingData, pointOfSale: 'OTA' };
    const result = convertOk(booking);

    expect(result.isOta).toBe(true);
    expect(result.payload.tags).toEqual(['booking-confirmed', 'ota']);
    expect(result.payload.historicalCustomFieldData?.Booking).toMatchObject({ Source: 'ota', Channel: 'OTA' });
  });

  it('Booking.com relay email is synced and flagged', () => {
    const booking = directBooking({
      bookingCustomer: { email: 'asvens.123456@guest.booking.com', allowEmailAdvertising: true },
      externalBookingInfo: { externalReservationId: '9988776655', externalChannelSource: 'Booking.com' },
    });

    booking.bookingData = { ...booking.bookingData, pointOfSale: 'OTA' };
    const result = convertOk(booking);

    expect(result.isOta).toBe(true);
    expect(result.isOtaRelayEmail).toBe(true);
    expect(result.payload.subscriber).toEqual({ email: 'asvens.123456@guest.booking.com' });
    expect(result.payload.customFieldData).toBeUndefined();
    expect(result.payload.tags).toEqual(['booking-confirmed', 'ota']);
    expect(result.payload.historicalCustomFieldData?.Booking).toMatchObject({ Channel: 'Booking.com' });
  });

  it('relay email blocks consent even when the booking is not marked OTA', () => {
    const booking = directBooking();

    booking.bookingCustomer = { ...booking.bookingCustomer, email: 'x.1@GUEST.BOOKING.COM' };
    const result = convertOk(booking);

    expect(result.isOtaRelayEmail).toBe(true);
    expect(result.payload.tags).toEqual(['booking-confirmed', 'direct']);
  });

  it.each([
    ['New', 'booking-confirmed', ['booking-confirmed', 'direct', 'marketing-consent']],
    ['Changed', 'booking-changed', ['booking-changed', 'direct', 'marketing-consent']],
    ['Cancelled', 'booking-cancelled', ['booking-cancelled', 'direct', 'marketing-consent']],
    ['NoShow', 'booking-no-show', ['booking-no-show', 'direct', 'marketing-consent']],
    ['Unknown', undefined, ['direct', 'marketing-consent']],
  ] as const)('status %s → lifecycleTag %s, tags %j', (status, lifecycleTag, expected) => {
    const booking = directBooking();

    booking.bookingData = { ...booking.bookingData, bookingStatus: status };
    const result = convertOk(booking);

    expect(result.lifecycleTag).toBe(lifecycleTag);
    expect(result.payload.tags).toEqual(expected);
    expect(result.payload.historicalCustomFieldData?.Booking).toMatchObject({ Status: status });
  });

  it('conference booking gets the conference tag', () => {
    const booking = directBooking();

    booking.bookingData = { ...booking.bookingData, isConferenceBooking: true };

    expect(convertOk(booking).payload.tags).toEqual(['booking-confirmed', 'direct', 'conference', 'marketing-consent']);
  });

  it('joins multiple distinct room and rate plan names', () => {
    const booking = directBooking();

    booking.bookingData = {
      ...booking.bookingData,
      roomDescriptions: [{ name: 'Double Room' }, { name: 'Suite' }, { name: 'Double Room' }],
      ratePlanDescriptions: [{ name: 'Flexible' }, { name: null }],
    };

    expect(convertOk(booking).payload.historicalCustomFieldData?.Booking).toMatchObject({
      RoomName: 'Double Room, Suite',
      RatePlan: 'Flexible',
    });
  });

  it.each([
    ['0701234567', '46', '+46701234567'],
    ['+44 20 7946 0958', '44', '+442079460958'],
    ['0046701234567', '46', '+46701234567'],
    ['+46 (0)70-123 45 67', '46', '+46701234567'],
    ['+46 070-123 45 67', '+46', '+46701234567'],
    ['701234567', '+46', '+46701234567'],
    ['+39 (0)6 1234 5678', '39', '+390612345678'],
    ['06 1234 5678', '39', '+390612345678'],
    ['22 12 34 56', '47', '+4722123456'],
  ])('phone %s with country code %s becomes %s', (phoneNumber, phoneCountryCode, expected) => {
    const booking = directBooking();

    booking.bookingCustomer = { ...booking.bookingCustomer, phoneNumber, phoneCountryCode };

    expect(convertOk(booking).payload.subscriber).toEqual({ email: 'anna.svensson@example.com', phoneNumber: expected });
  });

  it.each([
    ['0701234567', 'SE', 'country code is not numeric'],
    ['46701234567', '46', 'number may already include the country code'],
    ['8 (912) 345-67-89', '7', 'Russian trunk prefix 8'],
    ['+7 8 912 345-67-89', '7', 'unlisted numbering plan, international form'],
    ['+36 06 30 123 4567', '36', 'unlisted numbering plan, written trunk prefix'],
    ['+1 212 555 0100', '1', 'unlisted numbering plan'],
    ['+46 00 70 123 45 67', '46', 'leading 0 left after the trunk 0'],
    ['022 12 34 56', '47', 'leading 0 in a no-trunk plan'],
    ['06 30 123 4567', '36', 'Hungarian trunk prefix 06'],
    ['+44 20 7946 0958', '46', 'international number does not start with the country code'],
    ['+44 20 7946 0958', null, 'no country code'],
  ])('omits phone %s (code %s): %s', (phoneNumber, phoneCountryCode) => {
    const booking = directBooking();

    booking.bookingCustomer = { ...booking.bookingCustomer, phoneNumber, phoneCountryCode };

    expect(convertOk(booking).payload.subscriber).toEqual({ email: 'anna.svensson@example.com' });
  });

  it.each([
    'n/a',
    'guest.booking.com',
    'a b@example.com',
    'anna@localhost',
    'anna@example.com.',
    'anna@.example.com',
    'anna@example..com',
    'anna@exa,mple.com',
    '<anna@example.com>',
    'mailto:anna@example.com',
    'anna@example.com\u200B',
    '.anna@example.com',
    'anna..svensson@example.com',
    'anna.@example.com',
    'anna@exa;mple.com',
    'anna@-example.com',
  ])(
    'malformed email %j returns an invalid-email error',
    (email) => {
      const booking = directBooking();

      booking.bookingCustomer = { ...booking.bookingCustomer, email };

      expect(convertBookVisitBooking(booking)).toEqual({
        ok: false,
        error: {
          code: 'invalid-email',
          message: 'BookVisit booking BV-1001 has an invalid customer email',
          bookingGuidId: '6f1c2a3b-0000-4000-8000-0000000000aa',
        },
      });
    }
  );

  it('OTA booking with an empty channel source falls back to pointOfSale', () => {
    const booking = directBooking({ externalBookingInfo: { externalReservationId: '123', externalChannelSource: '' } });

    booking.bookingData = { ...booking.bookingData, pointOfSale: 'OTA' };

    expect(convertOk(booking).payload.historicalCustomFieldData?.Booking).toMatchObject({ Channel: 'OTA' });
  });

  it.each([undefined, null, '', '   '])('missing email (%j) returns a missing-email error', (email) => {
    const booking = directBooking();

    booking.bookingCustomer = { ...booking.bookingCustomer, email };

    expect(convertBookVisitBooking(booking)).toEqual({
      ok: false,
      error: {
        code: 'missing-email',
        message: 'BookVisit booking BV-1001 has no customer email',
        bookingGuidId: '6f1c2a3b-0000-4000-8000-0000000000aa',
      },
    });
  });

  it('booking with no customer and no data returns a missing-email error', () => {
    expect(convertBookVisitBooking({})).toEqual({
      ok: false,
      error: { code: 'missing-email', message: 'BookVisit booking (unknown) has no customer email' },
    });
  });

  it.each([
    'anna.svensson+hotel@example.co.uk',
    "o'brien@mail.example.se",
    'x.1@eu.guest.booking.com',
    'åsa@åre.se',
    'anna@bücher.de',
    'Anna@Example.SE',
    'a\u030Asa@a\u030Are.se',
    'anna@example.xn--p1ai',
  ])('valid email %j is accepted', (email) => {
    const booking = directBooking();

    booking.bookingCustomer = { ...booking.bookingCustomer, email };
    const result = convertOk(booking);

    expect(result.email).toBe(email);
    expect(result.payload.subscriber.email).toBe(email);
  });

  it.each([
    'anna@example.com/x',
    'anna@exa mple.com',
    'anna@[127.0.0.1]',
    'anna@example.com:80',
    'a@1.2.3.4',
    'a@0x7f.1',
    'a@127.1',
    'a@example\uFF0Ecom',
    'a@example\u3002com',
    'a@exa%6Dple.com',
    'a@a.com\u0000',
    'a@\u2460.com',
    'a@1.2.3.4.\uFE0F\uFE0F',
    'a@127.0.0.1.\u034F\u034F',
    'a@exam\uFE0Fple.com',
    'a\uFE0F@example.com',
    'a@exam\uFF11ple.com',
    'a@\uFF11.\uFF12.\uFF13.com',
    'a@exam\u{1D7CF}ple.com',
    'a@b.xn--abc-',
    'a@b.xn---',
  ])(
    'email %j with an IP, normalisable or control character domain is rejected',
    (email) => {
      const booking = directBooking();

      booking.bookingCustomer = { ...booking.bookingCustomer, email };

      expect(convertBookVisitBooking(booking)).toMatchObject({ ok: false, error: { code: 'invalid-email' } });
    }
  );

  it('a booking with no status gets no lifecycle tag', () => {
    const booking = directBooking();

    booking.bookingData = { ...booking.bookingData, bookingStatus: undefined };
    const result = convertOk(booking);

    expect(result.lifecycleTag).toBeUndefined();
    expect(result.payload.tags).toEqual(['direct', 'marketing-consent']);
  });
});

describe('isOtaRelayEmail', () => {
  it.each([
    ['a.1@guest.booking.com', true],
    ['a.1@eu.guest.booking.com', true],
    ['a@booking.com', false],
    ['a@notguest.booking.com', false],
    ['a@example.com', false],
  ])('%s → %s', (email, expected) => {
    expect(isOtaRelayEmail(email)).toBe(expected);
  });
});
