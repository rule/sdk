/**
 * BookVisit booking types — hand-written subset of the BookVisit REST API
 * (OpenAPI 3.0.4, https://restapi.bookvisit.com/swagger/v1/swagger.json).
 *
 * Covers only the fields `convertBookVisitBooking` reads from
 * `GET /bookings/booking-v1?BookingGuidId=…&FetchExternalBooking=true`
 * (schema `EasyAccessHotels.RESTAPI.Models.EditReservation.Booking`). Fields
 * the spec marks nullable are typed `| null`; all are optional because the
 * converter must tolerate partial responses.
 */

/** `EasyAccessHotels.SearchClient.Search.BookingStatus` */
export type BookVisitBookingStatus = 'Unknown' | 'New' | 'Changed' | 'Cancelled' | 'NoShow';

/** `EasyAccessHotels.SearchClient.Search.PointOfSale` */
export type BookVisitPointOfSale =
  | 'BackOffice'
  | 'Online'
  | 'Mobile'
  | 'Facebook'
  | 'OTA'
  | 'GDS'
  | 'Citybreak'
  | 'TripAdvisorInstantBooking';

/** `EasyAccessHotels.RESTAPI.Models.Booking.BookingCustomer` (subset). */
export interface BookVisitBookingCustomer {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  phoneCountryCode?: string | null;
  countryCode?: string | null;
  city?: string | null;
  /** Consent captured in BookVisit's own booking flow only — meaningless for OTA bookings. */
  allowEmailAdvertising?: boolean;
  /** UUID */
  customerId?: string | null;
}

/** `EasyAccessHotels.RESTAPI.Models.Booking.Guest` (subset). */
export interface BookVisitGuest {
  /** UUID */
  guestId?: string;
  firstName?: string | null;
  lastName?: string | null;
  isChild?: boolean;
}

/** `RoomDescription` / `RatePlanDescription` (subset). */
export interface BookVisitNamedDescription {
  /** UUID */
  id?: string;
  name?: string | null;
}

/** `EasyAccessHotels.RESTAPI.Models.Booking.BookingData` (subset). */
export interface BookVisitBookingData {
  bookingCode?: string | null;
  /** UUID */
  bookingGuidId?: string;
  /** ISO date-time */
  bookingDate?: string;
  /** ISO date (`YYYY-MM-DD`), check-in */
  startDate?: string;
  /** ISO date (`YYYY-MM-DD`), check-out */
  endDate?: string;
  bookingStatus?: BookVisitBookingStatus;
  pointOfSale?: BookVisitPointOfSale | null;
  totalPrice?: number;
  currencyCode?: string | null;
  guests?: BookVisitGuest[] | null;
  roomDescriptions?: BookVisitNamedDescription[] | null;
  ratePlanDescriptions?: BookVisitNamedDescription[] | null;
  isConferenceBooking?: boolean;
  /** UUID of the BookVisit channel (hotel) the booking belongs to. */
  channelId?: string | null;
}

/** `EasyAccessHotels.RESTAPI.Models.EditReservation.ExternalBookingInfo` */
export interface BookVisitExternalBookingInfo {
  externalReservationId?: string | null;
  /** OTA name, e.g. `"Booking.com"`. */
  externalChannelSource?: string | null;
}

/** `EasyAccessHotels.RESTAPI.Models.EditReservation.Booking` (subset). */
export interface BookVisitBooking {
  bookingCustomer?: BookVisitBookingCustomer | null;
  bookingData?: BookVisitBookingData | null;
  externalBookingInfo?: BookVisitExternalBookingInfo | null;
}
