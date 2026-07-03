"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useForm, type RegisterOptions } from "react-hook-form";
import { cn } from "@/lib/utils/cn";
import { COUNTRIES } from "@/lib/constants/countries";
import { useCheckoutFields } from "@/lib/hooks/useCheckoutFields";
import type { CheckoutField, CheckoutFieldOption } from "@/lib/services/checkout-fields";
import type { BillingDetails } from "@/lib/services/checkout";

export interface BillingFormHandle {
  getValues: () => BillingDetails;
  trigger: () => Promise<boolean>;
}

interface BillingFormProps {
  defaultValues?: Partial<BillingDetails>;
}

const inputClass =
  "w-full rounded-[4.8px] border border-[#ced4da] bg-white px-4 py-2.5 text-[#00204a] placeholder:text-[#6c757d] focus:border-[#9e6f21] focus:outline-none focus:ring-1 focus:ring-[#9e6f21] text-base";

const errorClass = "mt-1 text-xs text-[#dc3545]";

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

    // Prefill once when customer billing arrives (cart loads after mount).
    // Guard with a ref so later edits are never clobbered by a refetch.
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

          return (
            <div key={field.key}>
              {options && options.length > 0 ? (
                <select
                  {...register(name, rules)}
                  className={cn(inputClass, "cursor-pointer", hasError && "border-[#dc3545]")}
                  aria-label={field.label}
                >
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  {...register(name, rules)}
                  placeholder={placeholder}
                  rows={3}
                  className={cn(inputClass, hasError && "border-[#dc3545]")}
                />
              ) : (
                <input
                  {...register(name, rules)}
                  type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
                  placeholder={placeholder}
                  className={cn(inputClass, hasError && "border-[#dc3545]")}
                />
              )}
              {error && <p className={errorClass}>{String(error.message)}</p>}
            </div>
          );
        })}
      </div>
    );
  },
);

BillingForm.displayName = "BillingForm";
