"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useForm, type RegisterOptions } from "react-hook-form";
import { COUNTRIES } from "@/lib/constants/countries";
import { useCheckoutFields } from "@/lib/hooks/useCheckoutFields";
import type { CheckoutField, CheckoutFieldOption } from "@/lib/services/checkout-fields";
import type { BillingDetails } from "@/lib/services/checkout";
import { FormField, FormInput, FormSelect, FormTextarea } from "@/components/ui/form-field";
import {
  checkoutFieldAutoComplete,
  checkoutFieldGridClass,
} from "@/lib/utils/checkout-field-layout";

export interface BillingFormHandle {
  getValues: () => BillingDetails;
  trigger: () => Promise<boolean>;
}

interface BillingFormProps {
  defaultValues?: Partial<BillingDetails>;
}

/** Used only if the checkout-fields endpoint fails, so checkout still works. */
const FALLBACK_FIELDS: CheckoutField[] = [
  {
    key: "first_name",
    label: "First name",
    type: "text",
    required: true,
    priority: 10,
    placeholder: "First Name *",
    class: ["form-row-first"],
    options: null,
  },
  {
    key: "last_name",
    label: "Last name",
    type: "text",
    required: true,
    priority: 20,
    placeholder: "Last Name *",
    class: ["form-row-last"],
    options: null,
  },
  {
    key: "country",
    label: "Country",
    type: "country",
    required: true,
    priority: 40,
    placeholder: "",
    class: ["form-row-wide"],
    options: null,
  },
  {
    key: "address_1",
    label: "Street address",
    type: "text",
    required: true,
    priority: 50,
    placeholder: "Street Address *",
    class: ["form-row-wide"],
    options: null,
  },
  {
    key: "city",
    label: "Town / City",
    type: "text",
    required: true,
    priority: 70,
    placeholder: "Town / City *",
    class: ["form-row-first"],
    options: null,
  },
  {
    key: "postcode",
    label: "Postcode",
    type: "text",
    required: true,
    priority: 90,
    placeholder: "Postcode *",
    class: ["form-row-last"],
    options: null,
  },
  {
    key: "email",
    label: "Email address",
    type: "email",
    required: true,
    priority: 100,
    placeholder: "Email Address *",
    class: ["form-row-wide"],
    options: null,
  },
  {
    key: "phone",
    label: "Phone",
    type: "tel",
    required: false,
    priority: 110,
    placeholder: "Phone (optional)",
    class: ["form-row-wide"],
    options: null,
  },
];

const COUNTRY_FALLBACK: CheckoutFieldOption[] = COUNTRIES.map((c) => ({
  value: c.code,
  label: c.name,
}));

const PLACEHOLDER_HINTS: Partial<Record<string, string>> = {
  email: "you@example.com",
  phone: "01912345678",
};

export const BillingForm = forwardRef<BillingFormHandle, BillingFormProps>(
  ({ defaultValues }, ref) => {
    const { data, isLoading, isError } = useCheckoutFields();
    const fields = data && data.length > 0 ? data : isError ? FALLBACK_FIELDS : [];

    const {
      register,
      getValues,
      trigger,
      reset,
      formState: { errors },
    } = useForm<BillingDetails>({
      defaultValues: { country: "GB", ...defaultValues },
    });

    useImperativeHandle(ref, () => ({ getValues, trigger }));

    const prefilled = useRef(false);
    useEffect(() => {
      if (prefilled.current || !defaultValues) return;
      const hasData = Object.values(defaultValues).some((v) => v);
      if (!hasData) return;
      reset({ country: "GB", ...defaultValues });
      prefilled.current = true;
    }, [defaultValues, reset]);

    if (isLoading && fields.length === 0) {
      return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[46px] animate-pulse rounded-[4.8px] bg-gray-100" />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {fields.map((field) => {
          const name = field.key as keyof BillingDetails;
          const placeholder =
            field.placeholder ||
            PLACEHOLDER_HINTS[field.key] ||
            (field.required ? `${field.label} *` : `${field.label} (optional)`);
          const rules: RegisterOptions<BillingDetails> = {
            required: field.required ? `${field.label} is required` : false,
            ...(field.type === "email"
              ? { pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email address" } }
              : {}),
          };
          const error = errors[name];
          const hasError = Boolean(error);
          const options = field.options ?? (field.type === "country" ? COUNTRY_FALLBACK : null);
          const autoComplete = checkoutFieldAutoComplete(field.key);

          return (
            <FormField
              key={field.key}
              id={field.key}
              label={field.label}
              required={field.required}
              error={error ? String(error.message) : undefined}
              className={checkoutFieldGridClass(field.class)}
            >
              {options && options.length > 0 ? (
                <FormSelect
                  id={field.key}
                  {...register(name, rules)}
                  hasError={hasError}
                  autoComplete={autoComplete}
                >
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </FormSelect>
              ) : field.type === "textarea" ? (
                <FormTextarea
                  id={field.key}
                  {...register(name, rules)}
                  placeholder={placeholder}
                  rows={3}
                  hasError={hasError}
                  autoComplete={autoComplete}
                />
              ) : (
                <FormInput
                  id={field.key}
                  {...register(name, rules)}
                  type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
                  placeholder={placeholder}
                  hasError={hasError}
                  autoComplete={autoComplete}
                />
              )}
            </FormField>
          );
        })}
      </div>
    );
  },
);

BillingForm.displayName = "BillingForm";
