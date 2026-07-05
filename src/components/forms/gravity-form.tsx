"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { formsService, FormValidationError, type SubmitPayload } from "@/lib/services/forms";
import type {
  ConditionalLogic,
  FormValues,
  GravityField,
  GravityForm as GravityFormSchema,
} from "@/types/form";

import { MARKETING_FIELD_CLASS, MARKETING_LABEL_CLASS } from "@/components/ui/form-field";

const FIELD_CLASS = MARKETING_FIELD_CLASS;
const LABEL_CLASS = MARKETING_LABEL_CLASS;

/** Fields that render no input (display/structure only). */
const NON_INPUT_TYPES = new Set(["html", "section", "page"]);

/** GF field type → native HTML input type. */
function inputType(type: string): string {
  switch (type) {
    case "email":
      return "email";
    case "phone":
      return "tel";
    case "number":
    case "quantity":
      return "number";
    case "date":
      return "date";
    case "website":
      return "url";
    default:
      return "text";
  }
}

function requiredRule(field: GravityField): string | false {
  if (!field.isRequired) return false;
  return field.errorMessage || `${field.label || "This field"} is required.`;
}

function pageOf(field: GravityField): number {
  return field.pageNumber || 1;
}

/** All POST names a field contributes (composite fields have several). */
function fieldNames(field: GravityField): string[] {
  if (field.inputs?.length && field.type !== "checkbox") {
    return field.inputs.map((i) => i.name);
  }
  return [field.name];
}

// ─── Conditional logic ────────────────────────────────────────────────────────

function evaluateRule(operator: string, fieldValue: unknown, target: string): boolean {
  const a = String(fieldValue ?? "");
  switch (operator) {
    case "is":
      return a === target;
    case "isnot":
      return a !== target;
    case "contains":
      return a.includes(target);
    case "starts_with":
      return a.startsWith(target);
    case "ends_with":
      return a.endsWith(target);
    case "greater_than":
      return Number(a) > Number(target);
    case "less_than":
      return Number(a) < Number(target);
    default:
      return false;
  }
}

function logicMatches(
  logic: ConditionalLogic,
  getValue: (fieldId: string | number) => unknown,
): boolean {
  const results = logic.rules.map((r) => evaluateRule(r.operator, getValue(r.fieldId), r.value));
  return logic.logicType === "any" ? results.some(Boolean) : results.every(Boolean);
}

function isVisible(field: GravityField, getValue: (fieldId: string | number) => unknown): boolean {
  const logic = field.conditionalLogic;
  if (!logic || !logic.rules?.length) return true;
  const matched = logicMatches(logic, getValue);
  return logic.actionType === "hide" ? !matched : matched;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface GravityFormProps {
  form: GravityFormSchema;
  className?: string;
  /** Called after a successful, non-redirect submission. */
  onSuccess?: () => void;
  /** Seed field values (e.g. hidden issue_type from the support wizard). */
  prefillValues?: FormValues;
  /** Hide fields by GF field id (already captured in a prior wizard step). */
  hideFieldIds?: number[];
  /** When true, skip the built-in confirmation panel and rely on onSuccess. */
  suppressDefaultConfirmation?: boolean;
  /** Show privacy policy link above the submit button. */
  showPrivacyLink?: boolean;
  /** Admin email for submit-failure fallback (mailto). Falls back to /contact-us. */
  fallbackEmail?: string | null;
  /** Marketing-style field layout for cancellations / support forms. */
  variant?: "default" | "cancellations";
  /** Group fields into grids / stacks (refund form layout). */
  layoutGroups?: FormLayoutGroup[];
  /** Shown below the submit button (support trust line). */
  footerNote?: string;
  /** Background class for section dividers (match parent surface). */
  surfaceClass?: string;
}

export type FormLayoutGroup =
  | { type: "grid"; columns: 1 | 2; fieldIds: number[] }
  | { type: "divider"; label: string }
  | { type: "stack"; fieldIds: number[] }
  | { type: "remaining"; excludeFieldIds: number[] };

export function GravityForm({
  form,
  className,
  onSuccess,
  prefillValues,
  hideFieldIds = [],
  suppressDefaultConfirmation = false,
  showPrivacyLink = false,
  fallbackEmail = null,
  variant = "default",
  layoutGroups,
  footerNote,
  surfaceClass = "bg-white",
}: GravityFormProps) {
  const isCancellations = variant === "cancellations";
  const fieldClass = isCancellations
    ? "h-11 bg-white border-neutral-40 text-neutral-900 placeholder:text-neutral-100 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1"
    : FIELD_CLASS;
  const labelClass = isCancellations ? "text-sm font-semibold text-neutral-800" : LABEL_CLASS;
  const hiddenIds = useMemo(() => new Set(hideFieldIds.map(String)), [hideFieldIds]);
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const {
    register,
    handleSubmit,
    setError,
    trigger,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      ...buildDefaults(form.fields),
      ...prefillValues,
    },
  });

  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // useWatch (not watch()) subscribes in a React-Compiler-friendly way.
  const values = useWatch({ control }) as FormValues;
  const getValue = (fieldId: string | number) => values[`input_${fieldId}`];

  // field id → page, for jumping to the first page with a server error.
  const pageById = useMemo(() => new Map(form.fields.map((f) => [f.id, pageOf(f)])), [form.fields]);
  const nameById = useMemo(() => new Map(form.fields.map((f) => [f.id, f.name])), [form.fields]);

  const visibleFields = form.fields.filter((f) => !hiddenIds.has(f.id) && isVisible(f, getValue));
  const currentFields = form.isMultiPage
    ? visibleFields.filter((f) => pageOf(f) === page)
    : visibleFields;

  const fieldById = useMemo(
    () => new Map(currentFields.map((f) => [Number(f.id), f])),
    [currentFields],
  );

  const layoutFieldIds = useMemo(() => {
    if (!layoutGroups) return null;
    const ids = new Set<number>();
    for (const group of layoutGroups) {
      if (group.type === "grid" || group.type === "stack") {
        for (const id of group.fieldIds) ids.add(id);
      }
    }
    return ids;
  }, [layoutGroups]);

  const hiddenLayoutFields = layoutGroups ? currentFields.filter((f) => f.type === "hidden") : [];

  function renderFieldRow(field: GravityField) {
    return (
      <FieldRow
        key={field.id}
        field={field}
        register={register}
        errors={errors}
        maxDate={todayIso}
        fieldClass={fieldClass}
        labelClass={labelClass}
        isCancellations={isCancellations}
      />
    );
  }

  function renderLayoutGroups() {
    if (!layoutGroups) return null;

    return layoutGroups.map((group, index) => {
      if (group.type === "divider") {
        return (
          <div key={`divider-${group.label}`} className="relative py-3">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center">
              <span
                className={cn(
                  "px-3 font-open-sans text-[10px] font-semibold uppercase tracking-widest text-neutral-400",
                  surfaceClass,
                )}
              >
                {group.label}
              </span>
            </div>
          </div>
        );
      }

      let fields: GravityField[] = [];

      if (group.type === "remaining") {
        const excluded = new Set(group.excludeFieldIds);
        fields = currentFields.filter((f) => {
          const id = Number(f.id);
          if (f.type === "hidden") return false;
          if (excluded.has(id)) return false;
          if (layoutFieldIds?.has(id)) return false;
          return true;
        });
      } else {
        fields = group.fieldIds
          .map((id) => fieldById.get(id))
          .filter((f): f is GravityField => Boolean(f));
      }

      if (!fields.length) return null;

      if (group.type === "grid" && group.columns === 2) {
        return (
          <div key={`grid-${index}`} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => renderFieldRow(field))}
          </div>
        );
      }

      return (
        <div key={`stack-${index}`} className="space-y-4">
          {fields.map((field) => renderFieldRow(field))}
        </div>
      );
    });
  }

  const isLastPage = !form.isMultiPage || page >= form.pageCount;
  const nextLabel =
    form.fields.find((f) => f.type === "page" && f.pageNumber === page + 1)?.nextButton?.text ??
    "Next";
  const prevLabel =
    form.fields.find((f) => f.type === "page" && f.pageNumber === page)?.previousButton?.text ??
    "Previous";

  function applyFieldErrors(err: FormValidationError) {
    let firstPage = Infinity;
    for (const [fieldId, message] of Object.entries(err.fieldErrors)) {
      setError(nameById.get(fieldId) ?? `input_${fieldId}`, { type: "server", message });
      firstPage = Math.min(firstPage, pageById.get(fieldId) ?? 1);
    }
    if (form.isMultiPage && Number.isFinite(firstPage)) setPage(firstPage);
  }

  async function goNext() {
    const names = currentFields.flatMap(fieldNames);
    const ok = await trigger(names);
    if (ok) setPage((p) => p + 1);
  }

  async function onFinalSubmit(all: FormValues) {
    setSubmitError(null);
    try {
      const payload = buildPayload(form.fields, visibleFields, all, hiddenIds);
      const result = await formsService.submitForm(
        form.id,
        payload,
        form.isMultiPage ? { sourcePage: form.pageCount } : undefined,
      );

      if (result.confirmation_type === "redirect" && result.confirmation_redirect) {
        window.location.assign(result.confirmation_redirect);
        return;
      }
      if (suppressDefaultConfirmation) {
        onSuccess?.();
        return;
      }
      setConfirmation(result.confirmation_message ?? "Thank you. Your submission was received.");
      onSuccess?.();
    } catch (err) {
      if (err instanceof FormValidationError) {
        applyFieldErrors(err);
        toast.error(err.message);
        return;
      }
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    }
  }

  if (confirmation !== null) {
    return (
      <div
        className={cn(
          "rounded-lg border border-green-200 bg-green-50 p-8 text-center font-open-sans text-sm text-neutral-700",
          className,
        )}
        // Confirmation HTML is authored in GF admin (trusted).
        dangerouslySetInnerHTML={{ __html: confirmation }}
      />
    );
  }

  if (form.hasPayment) {
    return (
      <div
        className={cn(
          "rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800",
          className,
        )}
      >
        This form requires payment and can’t be completed here yet.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onFinalSubmit)}
      className={cn(isCancellations ? "space-y-6" : "space-y-5", className)}
      noValidate
    >
      {form.isMultiPage && (
        <p className="font-open-sans text-xs font-medium uppercase tracking-wide text-neutral-400">
          Step {page} of {form.pageCount}
        </p>
      )}

      {layoutGroups ? (
        <>
          {hiddenLayoutFields.map((field) => renderFieldRow(field))}
          {renderLayoutGroups()}
        </>
      ) : (
        currentFields.map((field) => renderFieldRow(field))
      )}

      {submitError ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 font-open-sans text-sm text-red-800"
        >
          {submitError}{" "}
          {fallbackEmail ? (
            <>
              Please try again or email us at{" "}
              <a href={`mailto:${fallbackEmail}`} className="font-semibold underline">
                {fallbackEmail}
              </a>
              .
            </>
          ) : (
            <>
              Please try again or{" "}
              <Link href="/contact-us" className="font-semibold underline">
                contact us
              </Link>
              .
            </>
          )}
        </div>
      ) : null}

      {showPrivacyLink ? (
        <p className="font-open-sans text-sm text-neutral-500">
          You agree to our{" "}
          <Link href="/privacy-policy" className="font-semibold text-secondary-500 underline">
            privacy policy
          </Link>
          .
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        {form.isMultiPage && page > 1 && (
          <Button type="button" variant="outline" onClick={() => setPage((p) => p - 1)}>
            {prevLabel}
          </Button>
        )}

        {isLastPage ? (
          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full sm:w-auto",
              isCancellations && "bg-secondary-500 text-white hover:bg-secondary-600",
            )}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {form.button.text || "Submit"}
          </Button>
        ) : (
          <Button type="button" onClick={goNext}>
            {nextLabel}
          </Button>
        )}
      </div>

      {footerNote ? <p className="font-open-sans text-xs text-neutral-500">{footerNote}</p> : null}
    </form>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDefaults(fields: GravityField[]): FormValues {
  const defaults: FormValues = {};
  for (const field of fields) {
    if (NON_INPUT_TYPES.has(field.type)) continue;
    if (field.inputs?.length && field.type !== "checkbox") {
      for (const input of field.inputs) defaults[input.name] = "";
    } else {
      const preselected = field.choices?.find((c) => c.isSelected)?.value;
      defaults[field.name] = preselected ?? field.defaultValue ?? "";
    }
  }
  return defaults;
}

/** Build a submit payload from visible fields plus any hidden pre-filled fields. */
function buildPayload(
  allFields: GravityField[],
  visibleFields: GravityField[],
  all: FormValues,
  hiddenIds: Set<string>,
): SubmitPayload {
  const hiddenPrefilled = allFields.filter((f) => hiddenIds.has(f.id) && f.type === "hidden");
  const inputFields = [...visibleFields, ...hiddenPrefilled].filter(
    (f) => !NON_INPUT_TYPES.has(f.type),
  );
  const hasFiles = inputFields.some((f) => f.type === "fileupload");
  const names = inputFields.flatMap(fieldNames);

  if (!hasFiles) {
    const json: FormValues = {};
    for (const name of names) json[name] = all[name];
    return json;
  }

  const fd = new FormData();
  for (const name of names) {
    const v = all[name];
    if (v instanceof FileList) {
      for (let i = 0; i < v.length; i++) {
        fd.append(name, v[i]);
      }
    } else if (v != null) {
      fd.append(name, String(v));
    }
  }
  return fd;
}

interface FieldRowProps {
  field: GravityField;
  register: ReturnType<typeof useForm<FormValues>>["register"];
  errors: ReturnType<typeof useForm<FormValues>>["formState"]["errors"];
  maxDate?: string;
  fieldClass?: string;
  labelClass?: string;
  isCancellations?: boolean;
}

function FieldRow({
  field,
  register,
  errors,
  maxDate,
  fieldClass = FIELD_CLASS,
  labelClass = LABEL_CLASS,
  isCancellations = false,
}: FieldRowProps) {
  if (field.type === "html") {
    return <div dangerouslySetInnerHTML={{ __html: field.content ?? "" }} />;
  }

  if (field.type === "section") {
    return (
      <div className="border-b border-neutral-200 pb-2">
        <h3 className="font-suse text-lg font-semibold text-neutral-900">{field.label}</h3>
        {field.description && (
          <p className="mt-1 font-open-sans text-sm text-neutral-500">{field.description}</p>
        )}
      </div>
    );
  }

  if (field.type === "page") return null;

  if (field.type === "hidden") {
    return <input type="hidden" {...register(field.name)} defaultValue={field.defaultValue} />;
  }

  const error = errors[field.name]?.message as string | undefined;
  const required = requiredRule(field);

  if (field.type === "consent" || (field.type === "checkbox" && field.choices?.length === 1)) {
    return (
      <div className="space-y-1.5">
        <label className="flex items-start gap-3 font-open-sans text-sm leading-relaxed text-neutral-700">
          <input
            type="checkbox"
            value="1"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            {...register(field.name, { required })}
          />
          <span>
            {field.choices?.[0]?.text ?? field.label}
            {field.isRequired && <span className="ml-0.5 text-red-500">*</span>}
          </span>
        </label>
        <FieldError message={error} />
      </div>
    );
  }

  // Composite fields (name / address): one labeled text input per sub-input.
  if (field.inputs?.length && field.type !== "checkbox") {
    return (
      <fieldset className="space-y-2">
        <legend className={cn("text-sm font-medium", labelClass)}>
          {field.label}
          {field.isRequired && <span className="ml-0.5 text-red-500">*</span>}
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field.inputs.map((input) => (
            <Input
              key={input.id}
              placeholder={input.placeholder || input.label}
              aria-label={input.label}
              className={fieldClass}
              {...register(input.name, { required: field.isRequired ? required : false })}
            />
          ))}
        </div>
        <FieldError message={error} />
      </fieldset>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`gf-${field.id}`} className={labelClass}>
        {field.label}
        {field.isRequired && <span className="ml-0.5 text-red-500">*</span>}
      </Label>

      <FieldControl
        field={field}
        register={register}
        required={required}
        maxDate={maxDate}
        fieldClass={fieldClass}
        isCancellations={isCancellations}
      />

      {field.description && (
        <p className="font-open-sans text-xs text-neutral-500">{field.description}</p>
      )}
      <FieldError message={error} />
    </div>
  );
}

function FieldControl({
  field,
  register,
  required,
  maxDate,
  fieldClass = FIELD_CLASS,
  isCancellations = false,
}: {
  field: GravityField;
  register: FieldRowProps["register"];
  required: string | false;
  maxDate?: string;
  fieldClass?: string;
  isCancellations?: boolean;
}) {
  const id = `gf-${field.id}`;

  const placeholders: Record<string, string> = {
    "Full name": "Jane Smith",
    "Email address": "jane@example.com",
    "Order number": "e.g. #149780",
    Product: "Type to search course or certificate…",
    "Additional details":
      "Briefly explain what happened and what outcome you are hoping for. This helps us review the request faster.",
  };

  const placeholder =
    field.placeholder || (isCancellations ? placeholders[field.label] : undefined);
  const selectPlaceholder =
    field.type === "select" && isCancellations
      ? field.isRequired
        ? "Select…"
        : field.label === "Your device"
          ? "Select device (optional)"
          : undefined
      : field.type === "select" && field.isRequired
        ? field.label === "Reason for refund"
          ? "Select a reason"
          : field.label === "Payment channel"
            ? "Select payment method"
            : `Select ${field.label.toLowerCase()}`
        : undefined;

  switch (field.type) {
    case "fileupload":
      return (
        <>
          <input
            id={id}
            type="file"
            multiple={field.multipleFiles === true}
            accept={
              field.allowedExtensions?.length
                ? field.allowedExtensions.map((e) => `.${e}`).join(",")
                : undefined
            }
            className="block w-full text-sm text-neutral-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
            {...register(field.name, {
              validate: (v) =>
                !field.isRequired ||
                (v instanceof FileList && v.length > 0) ||
                field.errorMessage ||
                `${field.label || "This field"} is required.`,
            })}
          />
          {field.allowedExtensions?.length ? (
            <p className="mt-1 font-open-sans text-xs text-neutral-400">
              Allowed: {field.allowedExtensions.join(", ")}
              {field.maxFileSize ? ` · max ${field.maxFileSize}MB` : ""}
            </p>
          ) : null}
        </>
      );

    case "textarea":
      return (
        <textarea
          id={id}
          rows={isCancellations ? 6 : 5}
          placeholder={placeholder}
          maxLength={field.maxLength}
          className={cn(
            "flex w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 disabled:opacity-50",
            fieldClass,
          )}
          {...register(field.name, { required })}
        />
      );

    case "select":
      return (
        <select
          id={id}
          defaultValue=""
          className={cn(
            "flex h-11 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1",
            fieldClass,
          )}
          {...register(field.name, { required })}
        >
          {selectPlaceholder ? (
            <option value="" disabled>
              {selectPlaceholder}
            </option>
          ) : null}
          {field.choices?.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.text}
            </option>
          ))}
        </select>
      );

    case "radio":
      return (
        <div className="space-y-2">
          {field.choices?.map((choice) => (
            <label
              key={choice.value}
              className="flex items-center gap-2 font-open-sans text-sm text-neutral-700"
            >
              <input
                type="radio"
                value={choice.value}
                className="h-4 w-4"
                {...register(field.name, { required })}
              />
              {choice.text}
            </label>
          ))}
        </div>
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-2 font-open-sans text-sm text-neutral-700">
          <input
            type="checkbox"
            value="1"
            className="h-4 w-4"
            {...register(field.name, { required })}
          />
          {field.choices?.[0]?.text ?? field.label}
        </label>
      );

    default:
      return (
        <Input
          id={id}
          type={inputType(field.type)}
          placeholder={placeholder}
          maxLength={field.maxLength}
          max={field.type === "date" ? maxDate : undefined}
          className={fieldClass}
          {...register(field.name, { required })}
        />
      );
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="font-open-sans text-xs text-red-600">{message}</p>;
}
