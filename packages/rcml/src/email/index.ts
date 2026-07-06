/**
 * Barrel for the `packages/rcml/src/email/` public surface.
 *
 * Every file re-exported here contains **only public symbols**, each marked
 * `@public` in its JSDoc. Internal helpers live under `./content/`,
 * `./validator/`, `./schema/`, and `./builders/` and are not exported from
 * this barrel.
 */

export * from './rcml-types.js'
export * from './validate-email-template.js'
export * from './validate-rcml-json.js'
export * from './email-rfm-to-json.js'
export * from './json-to-email-rfm.js'
export * from './rcml-to-xml.js'
export * from './xml-to-rcml.js'
export * from './create-rcml-element.js'
// Email RFM string builders are reached via the `email.` namespace below;
// the underlying functions are intentionally not flat-exported.
export { email } from './email-namespace.js'
export * from './theme-types.js'
export * from './theme-defaults.js'
export * from './create-theme.js'
export * from './apply-theme.js'
export * from './get-theme.js'
export * from './rcml-spec.js'
export * from './email-rfm-spec.js'
export * from './placeholder-spec.js'
