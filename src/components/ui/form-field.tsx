"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/** Visible label for marketing/auth/checkout forms. */
export const FORM_LABEL_CLASS = "mb-1 block font-open-sans text-sm font-medium text-[#3b5374]";

/** Base input styling — Figma gold focus, navy text. */
export const FORM_INPUT_CLASS =
  "w-full rounded border border-[#ced4da] bg-white px-3.5 py-[7px] font-open-sans text-base text-[#00204a] placeholder:text-[#6c757d] focus:border-[#9e6f21] focus:outline-none focus:ring-2 focus:ring-[#9e6f21]/30 disabled:cursor-not-allowed disabled:opacity-50";

export const FORM_ERROR_CLASS = "mt-1 text-xs text-[#dc3545]";

/** Auth forms use slightly different text colour — re-export for parity. */
export const FORM_INPUT_AUTH_CLASS = cn(FORM_INPUT_CLASS, "text-[#3b5374]");

/** GF/contact light-palette override (neutral tokens, pinned light). */
export const MARKETING_FIELD_CLASS =
  "bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-500";

export const MARKETING_LABEL_CLASS = "text-neutral-700";

export const formInputVariants = cva(FORM_INPUT_CLASS, {
  variants: {
    variant: {
      default: "",
      auth: "text-[#3b5374]",
      compact:
        "h-12 rounded-l border-[#ebedf1] px-[13px] py-[7px] placeholder:text-[#75879d] focus:ring-1",
    },
    hasError: {
      true: "border-[#dc3545] focus:border-[#dc3545] focus:ring-[#dc3545]/30",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    hasError: false,
  },
});

interface FormFieldProps {
  id?: string;
  label?: React.ReactNode;
  labelClassName?: string;
  labelExtra?: React.ReactNode;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  id,
  label,
  labelClassName,
  labelExtra,
  required,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      {(label || labelExtra) && (
        <div className={cn(labelExtra ? "mb-1 flex items-center justify-between" : undefined)}>
          {label ? (
            <label
              htmlFor={id}
              className={cn(FORM_LABEL_CLASS, labelClassName, labelExtra && "mb-0")}
            >
              {label}
              {required && <span className="text-[#dc3545]"> *</span>}
            </label>
          ) : null}
          {labelExtra}
        </div>
      )}
      {children}
      {error ? <p className={FORM_ERROR_CLASS}>{error}</p> : null}
    </div>
  );
}

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof formInputVariants>;

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, variant, hasError, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(formInputVariants({ variant, hasError: hasError ?? false }), className)}
      {...props}
    />
  ),
);
FormInput.displayName = "FormInput";

type FormSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> &
  Pick<VariantProps<typeof formInputVariants>, "hasError">;

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, hasError, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        formInputVariants({ hasError: hasError ?? false }),
        "cursor-pointer",
        className,
      )}
      {...props}
    />
  ),
);
FormSelect.displayName = "FormSelect";

type FormTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  Pick<VariantProps<typeof formInputVariants>, "hasError">;

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, hasError, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(formInputVariants({ hasError: hasError ?? false }), className)}
      {...props}
    />
  ),
);
FormTextarea.displayName = "FormTextarea";
