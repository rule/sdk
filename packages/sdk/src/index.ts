/**
 * @rule/sdk — meta-package re-exporting the Rule.io TypeScript SDK.
 *
 * This package is an umbrella over:
 * - `@rule/rcml`   — RCML email template builders and types
 * - `@rule/client` — HTTP API wrapper for the Rule.io endpoints
 *
 * Vendor presets (`@rule/vendor-shopify`, `@rule/vendor-bookzen`,
 * `@rule/vendor-samfora`) are under active development and will be
 * included in a future release.
 *
 * For smaller install footprints, import from the split packages directly.
 *
 * @packageDocumentation
 */

export * from '@rule/rcml';
export * from '@rule/client';
