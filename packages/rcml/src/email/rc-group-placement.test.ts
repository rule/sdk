/**
 * Acceptance tests locking rc-group to its production placement:
 *
 *   rc-section
 *   ├── rc-column[]                — Vertical (columns stack on mobile)
 *   OR
 *   rc-section
 *   └── rc-group > rc-column[]     — Horizontal (columns stay side-by-side)
 *
 * Two exclusive states. rc-group is always a direct child of rc-section
 * (never nested inside rc-column), and when present it must be the
 * section's only child — columns live inside the group, not alongside it.
 *
 * Backend PHP contract (RCMLSection::getPossibleChildren returns
 * [group, column]; RCMLColumn::getPossibleChildren has no group) confirms
 * the placement rule. The one-group-per-section-only cardinality is a UI
 * convention from the editor's Responsive control (Vertical/Horizontal
 * switch); the SDK enforces it to keep templates round-trippable through
 * the editor. The limit will be lifted once the editor supports
 * multi-group grouping.
 */
import { describe, expect, it } from 'vitest'

import {
  RcmlElementBuildError,
  RcmlElementBuildErrorCodes,
  createBodyElement,
  createColumnElement,
  createGroupElement,
  createHeadElement,
  createRcmlDocumentElement,
  createSectionElement,
  createTextElement,
} from './create-rcml-element.js'
import { safeValidateEmailTemplate } from './validate-email-template.js'
import type { RcmlSection } from './rcml-types.js'

const text = () => createTextElement({ content: 'x' })
const column = () => createColumnElement({ children: [text()] })

const wrapInDoc = (section: RcmlSection) =>
  createRcmlDocumentElement({
    head: createHeadElement({ children: [] }),
    body: createBodyElement({ children: [section] }),
  })

describe('rc-group placement — positive cases', () => {
  it('accepts rc-section > rc-column[] (Vertical baseline)', () => {
    const section = createSectionElement({ children: [column(), column()] })
    const result = safeValidateEmailTemplate(wrapInDoc(section))

    expect(result.success).toBe(true)
  })

  it('accepts rc-section > rc-group > rc-column[] (Horizontal)', () => {
    const group = createGroupElement({ children: [column(), column()] })
    const section = createSectionElement({ children: [group] })
    const result = safeValidateEmailTemplate(wrapInDoc(section))

    expect(result.success).toBe(true)
  })
})

describe('rc-group placement — negative cases', () => {
  it('rejects rc-column > rc-group (old invalid shape)', () => {
    const group = createGroupElement({ children: [column()] })

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createColumnElement({ children: [group as any] })
      expect.fail('createColumnElement should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(RcmlElementBuildError)
      expect((e as RcmlElementBuildError).issues[0]).toMatchObject({
        code: RcmlElementBuildErrorCodes.CHILD_INVALID,
        message: expect.stringContaining('<rc-column> does not accept <rc-group>'),
      })
    }
  })

  it('rejects rc-section > rc-column + rc-group (group must be the only child)', () => {
    const group = createGroupElement({ children: [column()] })

    try {
      createSectionElement({ children: [column(), group] })
      expect.fail('createSectionElement should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(RcmlElementBuildError)
      expect((e as RcmlElementBuildError).issues[0]).toMatchObject({
        code: RcmlElementBuildErrorCodes.CHILD_INVALID,
        message: expect.stringContaining(
          '<rc-section> using <rc-group> must have it as the only child',
        ),
      })
    }
  })

  it('rejects rc-section > rc-group + rc-group (at most one group)', () => {
    const groupA = createGroupElement({ children: [column()] })
    const groupB = createGroupElement({ children: [column()] })

    try {
      createSectionElement({ children: [groupA, groupB] })
      expect.fail('createSectionElement should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(RcmlElementBuildError)
      expect((e as RcmlElementBuildError).issues[0]).toMatchObject({
        code: RcmlElementBuildErrorCodes.CHILD_INVALID,
        message: expect.stringContaining(
          '<rc-section> accepts at most one <rc-group> child',
        ),
      })
    }
  })

  it('rejects rc-group > rc-section (nonsensical nesting)', () => {
    const section = createSectionElement({ children: [column()] })

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createGroupElement({ children: [section as any] })
      expect.fail('createGroupElement should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(RcmlElementBuildError)
      expect((e as RcmlElementBuildError).issues[0]).toMatchObject({
        code: RcmlElementBuildErrorCodes.CHILD_INVALID,
        message: expect.stringContaining('<rc-group> does not accept <rc-section>'),
      })
    }
  })
})
