import type { EmailTheme, RcmlDocument } from '@rule/rcml';
import type { EmailTemplate } from '@rule/template-engine';

import {
  createReservationConfirmationTemplate
} from './templates/reservation-confirmation/reservation-confirmation.js';
import type {
  ReservationConfirmationTemplateContext,
  ReservationConfirmationTemplateCopy
} from './templates/reservation-confirmation/reservation-confirmation.js';
import type { BookzenFieldName } from './fields.js';
import type { ResolvedVendorField } from './types.js';
import { vendorToCustomFieldRef } from './utils.js';


export class ReservationConfirmationAutomationPreset {
  private readonly _template: EmailTemplate<ReservationConfirmationTemplateCopy, ReservationConfirmationTemplateContext>;
  private readonly _context: ReservationConfirmationTemplateContext;
  private readonly _email: RcmlDocument;

  get email(): RcmlDocument {
    return this._email;
  }

  constructor(context: {
    customFieldsMap: Map<BookzenFieldName, ResolvedVendorField>,
    websiteUrl: string,
    theme: EmailTheme
  }) {
    this._template = createReservationConfirmationTemplate();
    this._context = this._createTemplateContext(context.customFieldsMap, context.websiteUrl);
    this._email = this._template.render({
      context: this._context,
      theme: context.theme
    });
  }

  private _createTemplateContext(
    customFieldsMap: Map<BookzenFieldName, ResolvedVendorField>,
    websiteUrl: string
  ): ReservationConfirmationTemplateContext {
    const firstNameCustomField = customFieldsMap.get('guestFirstName') as ResolvedVendorField;
    const bookingRefCustomField = customFieldsMap.get('bookingRef') as ResolvedVendorField;
    const serviceTypeCustomField = customFieldsMap.get('serviceType') as ResolvedVendorField;
    const checkInDateCustomField = customFieldsMap.get('checkInDate') as ResolvedVendorField;
    const checkOutDateCustomField = customFieldsMap.get('checkOutDate') as ResolvedVendorField;
    const totalGuestsCustomField = customFieldsMap.get('totalGuests') as ResolvedVendorField;
    const totalPriceCustomField = customFieldsMap.get('totalPrice') as ResolvedVendorField;
    const roomNameCustomField = customFieldsMap.get('roomName') as ResolvedVendorField;

    return {
      recipient: {
        firstName: vendorToCustomFieldRef(firstNameCustomField)
      },
      reservation: {
        bookingRef: vendorToCustomFieldRef(bookingRefCustomField),
        serviceType: vendorToCustomFieldRef(serviceTypeCustomField),
        checkInDate: vendorToCustomFieldRef(checkInDateCustomField),
        checkOutDate: vendorToCustomFieldRef(checkOutDateCustomField),
        totalGuests: vendorToCustomFieldRef(totalGuestsCustomField),
        totalPrice: vendorToCustomFieldRef(totalPriceCustomField),
        roomName: vendorToCustomFieldRef(roomNameCustomField),
      },
      /** URL the CTA button links to. */
      websiteUrl,
      footer: {
        fontSize: '12px',
        textColor: '#000000'
      }
    }
  }
}
