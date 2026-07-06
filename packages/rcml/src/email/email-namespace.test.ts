import { describe, it, expect } from 'vitest'
import { email } from './email-namespace.js'
import {
  createCustomField,
  createFont,
  createLink,
  createLoopValue,
} from './email-rfm-builders.js'

describe('email namespace identity', () => {
  it('exposes every builder as a property pointing at the underlying function', () => {
    expect(email.createCustomField).toBe(createCustomField)
    expect(email.createLoopValue).toBe(createLoopValue)
    expect(email.createLink).toBe(createLink)
    expect(email.createFont).toBe(createFont)
  })

  it('exposes exactly the documented set of keys', () => {
    expect(Object.keys(email).sort()).toEqual([
      'createCustomField',
      'createFont',
      'createLink',
      'createLoopValue',
    ])
  })

  it('produces strings byte-identical to the underlying functions', () => {
    expect(
      email.createCustomField({ group: 'Order', name: 'Total', id: 13 }),
    ).toBe(createCustomField({ group: 'Order', name: 'Total', id: 13 }))

    expect(
      email.createLink({ label: 'click', href: 'https://example.com' }),
    ).toBe(createLink({ label: 'click', href: 'https://example.com' }))
  })
})
