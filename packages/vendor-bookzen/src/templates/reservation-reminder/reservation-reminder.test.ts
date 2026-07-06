/**
 * Unit tests for {@link createReservationReminderTemplate}.
 */

import { describe, expect, it } from 'vitest'

import { customField } from '@rule/template-engine'

import {
  TEST_THEME,
  assertValidRCMLDocument,
  docToString,
} from '../../test-fixtures.js'
import {
  createReservationReminderTemplate,
  type ReservationReminderTemplateContext,
} from './reservation-reminder.js'

function fullContext(
  overrides: Partial<ReservationReminderTemplateContext> = {},
): ReservationReminderTemplateContext {
  return {
    recipient: {
      firstName: customField('Subscriber', 'FirstName', 200001),
    },
    reservation: {
      checkInDate: customField('Reservation', 'CheckInDate', 200103),
      checkOutDate: customField('Reservation', 'CheckOutDate', 200104),
      roomName: customField('Reservation', 'RoomName', 200102),
    },
    practicalInfo: 'Check-in is from 15:00. If you need anything before your arrival, just let us know.',
    websiteUrl: 'https://hotel.example.com',
    footer: { fontSize: '10px', textColor: '#666666' },
    ...overrides,
  }
}

describe('createReservationReminderTemplate', () => {
  it('renders a valid RCML document with all optional sections', () => {
    const doc = createReservationReminderTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).toContain('Your Stay')
    expect(json).toContain('View Details')
    expect(json).toContain('[CustomField:200103]')
    expect(json).toContain('[CustomField:200104]') // check-out range
    expect(json).toContain('[CustomField:200102]') // room
    expect(json).toContain('Check-in is from 15:00')
  })

  it('renders a single-date row when checkOutDate is absent', () => {
    const doc = createReservationReminderTemplate().render({
      context: fullContext({
        reservation: {
          checkInDate: customField('Reservation', 'CheckInDate', 200103),
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[CustomField:200103]')
    expect(json).not.toContain('[CustomField:200104]')
    expect(json).not.toContain('Dates:')
  })

  it('omits the practical-info section when absent', () => {
    const doc = createReservationReminderTemplate().render({
      context: fullContext({ practicalInfo: undefined }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).not.toContain('Good to Know')
    expect(json).not.toContain('Check-in is from')
  })

  it('omits the room row when roomName is absent', () => {
    const doc = createReservationReminderTemplate().render({
      context: fullContext({
        reservation: {
          checkInDate: customField('Reservation', 'CheckInDate', 200103),
          checkOutDate: customField('Reservation', 'CheckOutDate', 200104),
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).not.toContain('[CustomField:200102]')
    expect(json).not.toContain('Room:')
  })
})
