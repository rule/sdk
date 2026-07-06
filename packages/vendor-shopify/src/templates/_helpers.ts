/**
 * Template context helpers for the shopify XML templates.
 *
 * `field(name)` emits a rule.io `::placeholder{…}` RFM atom for the given
 * logical field name; `loopValue(key)` emits a `::loop-value{…}` RFM
 * atom for a loop sub-field. Both are registered in the template
 * rendering context so templates can write `{{ field('firstName') }}`
 * inline inside text content and have the RFM parser pick up the emitted
 * atoms during `xmlToRcml`.
 *
 * Both helpers throw `VendorPresetError` (via the caller's validation
 * layer) when a logical name has no mapping; templates are expected to
 * gate references behind `*ngIf` checks against `fieldNames.X`, so
 * errors here only surface for unexpected config gaps.
 *
 * @internal
 */

import { VendorPresetError } from '@rule/vendor'
import type { CustomFieldMap } from '@rule/vendor'

export interface TemplateHelpers {
  field: (logicalName: string) => string
  loopValue: (key: string) => string
}

export function makeTemplateHelpers(
  customFields: CustomFieldMap,
  fieldNames: Readonly<Record<string, string | undefined>>,
): TemplateHelpers {
  function field(logicalName: string): string {
    const fieldName = fieldNames[logicalName]

    if (fieldName === undefined) {
      throw new VendorPresetError(
        `template references unknown field '${logicalName}' (not in fieldNames map)`,
      )
    }

    const id = customFields[fieldName]

    if (id === undefined) {
      throw new VendorPresetError(
        `template references field '${logicalName}' (mapped to '${fieldName}') but it is not in customFields`,
      )
    }

    return `::placeholder{type="CustomField" name="${fieldName}" value="${String(id)}" original="[CustomField:${String(id)}]"}`
  }

  function loopValue(key: string): string {
    return `::loop-value{original="[LoopValue:${key}]" value="${key}" index="${key}"}`
  }

  return { field, loopValue }
}
