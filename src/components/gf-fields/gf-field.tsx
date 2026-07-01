"use client";

import type { GfFieldProps } from "./shared";
import { TextField } from "./text-field";
import { EmailField } from "./email-field";
import { PhoneField } from "./phone-field";
import { NumberField } from "./number-field";
import { DateField } from "./date-field";
import { TextareaField } from "./textarea-field";
import { SelectField } from "./select-field";
import { RadioField } from "./radio-field";
import { CheckboxField } from "./checkbox-field";
import { AddressField } from "./address-field";
import { HtmlField } from "./html-field";
import { SectionField } from "./section-field";

/**
 * Renders one Gravity Forms field by type. Controlled + uniform props — see
 * `GfFieldProps`. Unknown scalar types fall back to a text input; unknown
 * composite fields (with `inputs[]`) render as an address-style group.
 */
export function GfField(props: GfFieldProps) {
  switch (props.field.type) {
    case "html":
      return <HtmlField {...props} />;
    case "section":
      return <SectionField {...props} />;
    case "email":
      return <EmailField {...props} />;
    case "phone":
      return <PhoneField {...props} />;
    case "number":
      return <NumberField {...props} />;
    case "date":
      return <DateField {...props} />;
    case "textarea":
      return <TextareaField {...props} />;
    case "select":
      return <SelectField {...props} />;
    case "radio":
      return <RadioField {...props} />;
    case "checkbox":
    case "consent":
      return <CheckboxField {...props} />;
    case "name":
    case "address":
      return <AddressField {...props} />;
    default:
      if (props.field.inputs?.length) return <AddressField {...props} />;
      return <TextField {...props} />;
  }
}
