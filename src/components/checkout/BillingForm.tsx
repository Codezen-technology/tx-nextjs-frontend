"use client";

import { forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils/cn";
import type { BillingDetails } from "@/lib/services/checkout";

export interface BillingFormHandle {
  getValues: () => BillingDetails;
  trigger: () => Promise<boolean>;
}

interface BillingFormProps {
  defaultValues?: Partial<BillingDetails>;
}

const COUNTRIES = [
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "IE", name: "Ireland" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "IN", name: "India" },
];

const inputClass =
  "w-full rounded-[4.8px] border border-[#ced4da] bg-white px-4 py-2.5 text-[#00204a] placeholder:text-[#6c757d] focus:border-[#9e6f21] focus:outline-none focus:ring-1 focus:ring-[#9e6f21] text-base";

const errorClass = "mt-1 text-xs text-[#dc3545]";

export const BillingForm = forwardRef<BillingFormHandle, BillingFormProps>(
  ({ defaultValues }, ref) => {
    const {
      register,
      getValues,
      trigger,
      formState: { errors },
    } = useForm<BillingDetails>({
      defaultValues: { country: "GB", ...defaultValues },
    });

    useImperativeHandle(ref, () => ({ getValues, trigger }));

    return (
      <div className="space-y-6">
        {/* Name row */}
        <div className="flex gap-6">
          <div className="flex-1">
            <input
              {...register("first_name", { required: "First name is required" })}
              placeholder="First Name *"
              className={cn(inputClass, errors.first_name && "border-[#dc3545]")}
            />
            {errors.first_name && <p className={errorClass}>{errors.first_name.message}</p>}
          </div>
          <div className="flex-1">
            <input
              {...register("last_name", { required: "Last name is required" })}
              placeholder="Last Name *"
              className={cn(inputClass, errors.last_name && "border-[#dc3545]")}
            />
            {errors.last_name && <p className={errorClass}>{errors.last_name.message}</p>}
          </div>
        </div>

        {/* Company (optional) */}
        <div>
          <input
            {...register("company")}
            placeholder="Company (optional)"
            className={inputClass}
          />
        </div>

        {/* Address row */}
        <div>
          <input
            {...register("address_1", { required: "Address is required" })}
            placeholder="Street Address *"
            className={cn(inputClass, errors.address_1 && "border-[#dc3545]")}
          />
          {errors.address_1 && <p className={errorClass}>{errors.address_1.message}</p>}
        </div>
        <div>
          <input
            {...register("address_2")}
            placeholder="Apartment, suite, etc. (optional)"
            className={inputClass}
          />
        </div>

        {/* City + Postcode */}
        <div className="flex gap-6">
          <div className="flex-1">
            <input
              {...register("city", { required: "City is required" })}
              placeholder="City *"
              className={cn(inputClass, errors.city && "border-[#dc3545]")}
            />
            {errors.city && <p className={errorClass}>{errors.city.message}</p>}
          </div>
          <div className="flex-1">
            <input
              {...register("postcode", { required: "Postcode is required" })}
              placeholder="Postcode *"
              className={cn(inputClass, errors.postcode && "border-[#dc3545]")}
            />
            {errors.postcode && <p className={errorClass}>{errors.postcode.message}</p>}
          </div>
        </div>

        {/* Country + State */}
        <div className="flex gap-6">
          <div className="flex-1">
            <select
              {...register("country", { required: "Country is required" })}
              className={cn(inputClass, "cursor-pointer", errors.country && "border-[#dc3545]")}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.country && <p className={errorClass}>{errors.country.message}</p>}
          </div>
          <div className="flex-1">
            <input
              {...register("state")}
              placeholder="State / County (optional)"
              className={inputClass}
            />
          </div>
        </div>

        {/* Email + Phone */}
        <div className="flex gap-6">
          <div className="flex-1">
            <input
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email address" },
              })}
              type="email"
              placeholder="Email Address *"
              className={cn(inputClass, errors.email && "border-[#dc3545]")}
            />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>
          <div className="flex-1">
            <input
              {...register("phone")}
              type="tel"
              placeholder="Phone (optional)"
              className={inputClass}
            />
          </div>
        </div>
      </div>
    );
  },
);

BillingForm.displayName = "BillingForm";
