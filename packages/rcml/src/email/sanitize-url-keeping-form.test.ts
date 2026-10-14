import { sanitizeUrl } from '@braintree/sanitize-url'
import { describe, expect, it } from 'vitest'

import { DEFAULT_LINKS_MAP } from './theme-defaults.js'
import { sanitizeUrlKeepingForm } from './sanitize-url-keeping-form.js'

describe('sanitizeUrlKeepingForm', () => {
  describe('returns a URL that is already fine as given', () => {
    it.each([
      ['a bare origin', 'https://acme.example'],
      ['a bare origin with a slash', 'https://acme.example/'],
      ['a path', 'https://acme.example/brand/page'],
      ['an upper-case host', 'https://Acme.Example'],
      ['an upper-case scheme', 'HTTPS://acme.example'],
      ['a query', 'https://acme.example?ref=1'],
      ['a fragment', 'https://acme.example#x'],
      ['a port', 'https://acme.example:8080'],
      ['a non-ASCII host', 'https://ÅÄÖ.se'],
      ['http', 'http://acme.example'],
      ['mailto', 'mailto:hi@acme.example'],
    ])('%s', (_label, url) => {
      expect(sanitizeUrlKeepingForm(url)).toBe(url)
    })

    it('every editor default social URL', () => {
      for (const { url } of Object.values(DEFAULT_LINKS_MAP)) {
        expect(sanitizeUrlKeepingForm(url)).toBe(url)
      }
    })

    it('trims surrounding whitespace', () => {
      expect(sanitizeUrlKeepingForm('  https://acme.example  ')).toBe('https://acme.example')
    })
  })

  describe('rejects what sanitizeUrl rejects', () => {
    it.each([
      ['javascript:', 'javascript:alert(1)'],
      ['an upper-case javascript:', 'JAVASCRIPT:alert(1)'],
      ['an entity-encoded javascript:', '&#106;avascript:alert(1)'],
      ['an empty string', ''],
      ['whitespace only', '   '],
    ])('%s', (_label, url) => {
      expect(sanitizeUrlKeepingForm(url)).toBe('about:blank')
    })
  })

  describe('falls back to the sanitised URL when the given one is not the same URL', () => {
    it.each([
      ['a control character', 'https://acme.example/a\u0000b'],
      ['whitespace inside', 'https://acme.example/a b'],
      ['a zero-width character', 'https://acme.example/\u200Bpath'],
      ['a trailing control character', 'https://acme.example/x\u0000'],
    ])('%s', (_label, url) => {
      expect(sanitizeUrlKeepingForm(url)).toBe(sanitizeUrl(url))
    })

    it('never returns a control character', () => {
      expect(sanitizeUrlKeepingForm('https://acme.example/x\u0000')).not.toMatch(/[\u0000-\u001F]/)
    })
  })

  it('passes a string that is not an absolute URL through like sanitizeUrl', () => {
    for (const url of ['not-a-url', '/relative/path', '//acme.example']) {
      expect(sanitizeUrlKeepingForm(url)).toBe(sanitizeUrl(url))
    }
  })
})
