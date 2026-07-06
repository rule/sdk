/**
 * Unit tests for {@link createReservationRequestTemplate}.
 */

import { describe, expect, it } from 'vitest'

import { customField } from '@rule/template-engine'

import {
  TEST_THEME,
  assertValidRCMLDocument,
  docToString,
} from '../../test-fixtures.js'
import {
  createReservationRequestTemplate,
  type ReservationRequestTemplateContext,
} from './reservation-request.js'

function fullContext(
  overrides: Partial<ReservationRequestTemplateContext> = {},
): ReservationRequestTemplateContext {
  return {
    recipient: {
      firstName: customField('Subscriber', 'FirstName', 200001),
    },
    reservation: {
      bookingRef: customField('Reservation', 'BookingRef', 200100),
      checkInDate: customField('Reservation', 'CheckInDate', 200103),
      checkOutDate: customField('Reservation', 'CheckOutDate', 200104),
      totalGuests: customField('Reservation', 'TotalGuests', 200105),
    },
    footer: { fontSize: '10px', textColor: '#666666' },
    ...overrides,
  }
}

describe('createReservationRequestTemplate', () => {
  it('renders a valid RCML document with default copy and full date range', () => {
    const doc = createReservationRequestTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).toContain('Request Details')
    expect(json).toContain('[CustomField:200001]')
    expect(json).toContain('[CustomField:200100]')
    expect(json).toContain('[CustomField:200103]')
    expect(json).toContain('[CustomField:200104]')
    expect(json).toContain('[CustomField:200105]')
  })

  it('renders a single-date row when checkOutDate is absent', () => {
    const doc = createReservationRequestTemplate().render({
      context: fullContext({
        reservation: {
          bookingRef: customField('Reservation', 'BookingRef', 200100),
          checkInDate: customField('Reservation', 'CheckInDate', 200103),
          totalGuests: customField('Reservation', 'TotalGuests', 200105),
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[CustomField:200103]')
    expect(json).not.toContain('[CustomField:200104]')
    expect(json).not.toContain('Dates:')
  })
})
