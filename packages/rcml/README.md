# @rule/rcml

RCML (Rule Campaign Markup Language) template builders and type definitions. Use this package to compose email templates that you can send through the Rule.io API via `@rule/client` (or one of the vendor presets).

```ts
import {
  createRCMLDocument,
  createBrandTemplate,
} from '@rule/rcml';
```

## What's included

- **Primitives**: `createRCMLDocument`, `createSection`, `createHeading`, `createText`, `createButton`, `createImage`, `createLogo`, `createSpacer`, `createDivider`, `createLoop`, `createSwitch`/`createCase`, `createSocial`/`createSocialElement`, and related helpers
- **Brand-style helpers**: `createBrandTemplate`, `createBrandHead`, `createBrandLogo`, `createBrandHeading`, `createBrandText`, `createBrandButton`, `createContentSection`, `createFooterSection`, `createStatusTrackerSection`, `createAddressBlock`, `validateCustomFields`
- **Types**: full RCML structural type hierarchy (`RCMLDocument`, `RCMLSection`, `RCMLProseMirrorDoc`, etc.)
- **Automation config schema**: `AutomationConfigV2`, `TemplateConfigV2`, `getAutomationByIdV2`, `getAutomationByTriggerV2`

See the [main `@rule/sdk` README](../sdk/README.md) for end-to-end usage examples.
