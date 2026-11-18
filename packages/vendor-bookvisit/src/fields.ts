/**
 * BookVisit Custom Field Definitions
 *
 * Field names written by `convertBookVisitBooking` for BookVisit hotel
 * bookings. Consumers provide the numeric IDs from their Rule.io account.
 */

import type { VendorFieldSchema } from './types.js';

/** Subscriber group fields — flat, overwritten on each sync. */
export const BOOKVISIT_SUBSCRIBER_FIELD_SCHEMA = {
  guestFirstName: {
    groupName: 'Subscriber',
    fieldName: 'FirstName',
    historical: false,
    description: 'Guest first name',
  },
  guestLastName: {
    groupName: 'Subscriber',
    fieldName: 'LastName',
    historical: false,
    description: 'Guest last name',
  },
  guestCity: {
    groupName: 'Subscriber',
    fieldName: 'City',
    historical: false,
    description: 'Guest city',
  },
  guestCountryCode: {
    groupName: 'Subscriber',
    fieldName: 'CountryCode',
    historical: false,
    description: 'Guest country code',
  },
  guestCustomerId: {
    groupName: 'Subscriber',
    fieldName: 'BookVisitCustomerId',
    historical: false,
    description: 'BookVisit customer ID (UUID)',
  },
} as const satisfies VendorFieldSchema;

/** Booking group fields — historical, a new record is appended on each sync. */
export const BOOKVISIT_BOOKING_FIELD_SCHEMA = {
  bookingRef: {
    groupName: 'Booking',
    fieldName: 'BookingRef',
    historical: true,
    description: 'BookVisit booking code',
  },
  checkInDate: {
    groupName: 'Booking',
    fieldName: 'CheckInDate',
    historical: true,
    description: 'Check-in date (YYYY-MM-DD)',
  },
  checkOutDate: {
    groupName: 'Booking',
    fieldName: 'CheckOutDate',
    historical: true,
    description: 'Check-out date (YYYY-MM-DD)',
  },
  nights: {
    groupName: 'Booking',
    fieldName: 'Nights',
    historical: true,
    description: 'Number of nights between check-in and check-out',
  },
  totalGuests: {
    groupName: 'Booking',
    fieldName: 'TotalGuests',
    historical: true,
    description: 'Total number of guests',
  },
  totalPrice: {
    groupName: 'Booking',
    fieldName: 'TotalPrice',
    historical: true,
    description: 'Total booking price',
  },
  currency: {
    groupName: 'Booking',
    fieldName: 'Currency',
    historical: true,
    description: 'Currency code of the total price (e.g. SEK)',
  },
  roomName: {
    groupName: 'Booking',
    fieldName: 'RoomName',
    historical: true,
    description: 'Booked room name(s), comma-separated',
  },
  ratePlan: {
    groupName: 'Booking',
    fieldName: 'RatePlan',
    historical: true,
    description: 'Booked rate plan name(s), comma-separated',
  },
  status: {
    groupName: 'Booking',
    fieldName: 'Status',
    historical: true,
    description: 'BookVisit booking status (New, Changed, Cancelled, NoShow, Unknown)',
  },
  source: {
    groupName: 'Booking',
    fieldName: 'Source',
    historical: true,
    description: 'Booking source: "direct" or "ota"',
  },
  channel: {
    groupName: 'Booking',
    fieldName: 'Channel',
    historical: true,
    description: 'Sales channel: the OTA name (e.g. Booking.com) for OTA bookings, otherwise the BookVisit point of sale',
  },
} as const satisfies VendorFieldSchema;

/**
 * All BookVisit fields for Rule.io custom fields.
 *
 * - **Subscriber group (flat)** — guest identity fields that get
 *   overwritten on each sync (e.g. `Subscriber.FirstName`).
 * - **Booking group (historical)** — per-booking event data that
 *   appends a new record on each sync (`Booking.BookingRef`,
 *   `Booking.CheckInDate`, `Booking.Source`, etc.).
 */
export const BOOKVISIT_FIELD_SCHEMA = {
  ...BOOKVISIT_SUBSCRIBER_FIELD_SCHEMA,
  ...BOOKVISIT_BOOKING_FIELD_SCHEMA,
} as const satisfies VendorFieldSchema;

/** Object type of the BookVisit field schema. */
export type BookVisitFieldSchema = typeof BOOKVISIT_FIELD_SCHEMA;

/** Union of logical BookVisit field name keys. */
export type BookVisitFieldName = keyof BookVisitFieldSchema;

/** Union of BookVisit subscriber field name keys. */
export type BookVisitSubscriberFieldName = keyof typeof BOOKVISIT_SUBSCRIBER_FIELD_SCHEMA;

/** Union of BookVisit booking field name keys. */
export type BookVisitBookingFieldName = keyof typeof BOOKVISIT_BOOKING_FIELD_SCHEMA;
