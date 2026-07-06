# @rule/vendor

> **Under Development** — This package is not yet published to npm. It is under active development and will be included in a future release of the Rule.io SDK. The API is unstable and may change without notice.

---

Shared vendor-preset infrastructure for the Rule.io SDK. Provides the `VendorPreset` interface, `VendorPresetError`, and common types (`CustomFieldMap`, `VendorConsumerConfig`, etc.) used by `@rule/vendor-shopify`, `@rule/vendor-bookzen`, and `@rule/vendor-samfora`.

This is an infrastructure package — it is not intended to be installed directly by SDK consumers. It arrives as a transitive dependency of the vendor preset packages.
