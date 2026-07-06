/**
 * Unit tests for {@link createReservationConfirmationTemplate}.
 */

import { describe, expect, it } from 'vitest'

import { customField } from '@rule/template-engine'

import {
  TEST_THEME,
  TEST_THEME_WITH_SOCIALS,
  assertValidRCMLDocument,
  docToString,
} from '../../test-fixtures.js'
import {
  createReservationConfirmationTemplate,
  type ReservationConfirmationTemplateContext,
} from './reservation-confirmation.js'

function fullContext(
  overrides: Partial<ReservationConfirmationTemplateContext> = {},
): ReservationConfirmationTemplateContext {
  return {
    recipient: {
      firstName: customField('Subscriber', 'FirstName', 200001),
    },
    reservation: {
      bookingRef: customField('Reservation', 'BookingRef', 200100),
      serviceType: customField('Reservation', 'ServiceType', 200101),
      roomName: customField('Reservation', 'RoomName', 200102),
      checkInDate: customField('Reservation', 'CheckInDate', 200103),
      checkOutDate: customField('Reservation', 'CheckOutDate', 200104),
      totalGuests: customField('Reservation', 'TotalGuests', 200105),
      totalPrice: customField('Reservation', 'TotalPrice', 200106),
    },
    websiteUrl: 'https://hotel.example.com',
    footer: { fontSize: '10px', textColor: '#666666' },
    ...overrides,
  }
}

describe('createReservationConfirmationTemplate', () => {
  it('renders a valid RCML document with all optional sections', () => {
    const doc = createReservationConfirmationTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).toContain('Reservation Details')
    expect(json).toContain('View Reservation')
    expect(json).toContain('[CustomField:200001]')
    expect(json).toContain('[CustomField:200100]')
    expect(json).toContain('[CustomField:200101]')
    expect(json).toContain('[CustomField:200102]') // room
    expect(json).toContain('[CustomField:200103]') // check-in
    expect(json).toContain('[CustomField:200104]') // check-out
    expect(json).toContain('[CustomField:200105]') // guests
    expect(json).toContain('[CustomField:200106]') // total
  })

  it('omits optional rows when their refs are absent', () => {
    const doc = createReservationConfirmationTemplate().render({
      context: fullContext({
        reservation: {
          bookingRef: customField('Reservation', 'BookingRef', 200100),
          serviceType: customField('Reservation', 'ServiceType', 200101),
          checkInDate: customField('Reservation', 'CheckInDate', 200103),
          totalGuests: customField('Reservation', 'TotalGuests', 200105),
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).not.toContain('Room:')
    expect(json).not.toContain('Check-out')
    expect(json).not.toContain('Total:')
  })

  it('applies a partial copy override', () => {
    const doc = createReservationConfirmationTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
      copy: { ctaButton: 'Manage booking' },
    })
    const json = docToString(doc)

    expect(json).toContain('Manage booking')
    expect(json).not.toContain('View Reservation')
  })

  it('renders the social section from theme.links', () => {
    const doc = createReservationConfirmationTemplate().render({
      context: fullContext(),
      theme: TEST_THEME_WITH_SOCIALS,
    })
    const json = docToString(doc)

    expect(json).toContain('rc-social')
    expect(json).toContain('facebook')
  })

  it('renders the logo from theme.images.logo', () => {
    const doc = createReservationConfirmationTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('https://example.com/logo.png')
  })
})
