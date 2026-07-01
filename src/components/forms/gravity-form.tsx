"use client";

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

// Marketing pages pin a light palette; the shared Input/Label read theme tokens
// that flip under dark mode. Pin explicit light styles so forms stay readable.
const FIELD_CLASS =
  "bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-primary-500";
const LABEL_CLASS = "text-neutral-700";

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
}

export function GravityForm({ form, className, onSuccess }: GravityFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    trigger,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: buildDefaults(form.fields) });

  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // useWatch (not watch()) subscribes in a React-Compiler-friendly way.
  const values = useWatch({ control }) as FormValues;
  const getValue = (fieldId: string | number) => values[`input_${fieldId}`];

  // field id → page, for jumping to the first page with a server error.
  const pageById = useMemo(() => new Map(form.fields.map((f) => [f.id, pageOf(f)])), [form.fields]);
  const nameById = useMemo(() => new Map(form.fields.map((f) => [f.id, f.name])), [form.fields]);

  const visibleFields = form.fields.filter((f) => isVisible(f, getValue));
  const currentFields = form.isMultiPage
    ? visibleFields.filter((f) => pageOf(f) === page)
    : visibleFields;

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
    try {
      const payload = buildPayload(visibleFields, all);
      const result = await formsService.submitForm(
        form.id,
        payload,
        form.isMultiPage ? { sourcePage: form.pageCount } : undefined,
      );

      if (result.confirmation_type === "redirect" && result.confirmation_redirect) {
        window.location.assign(result.confirmation_redirect);
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
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
    <form onSubmit={handleSubmit(onFinalSubmit)} className={cn("space-y-5", className)} noValidate>
      {form.isMultiPage && (
        <p className="font-open-sans text-xs font-medium uppercase tracking-wide text-neutral-400">
          Step {page} of {form.pageCount}
        </p>
      )}

      {currentFields.map((field) => (
        <FieldRow key={field.id} field={field} register={register} errors={errors} />
      ))}

      <div className="flex items-center gap-3">
        {form.isMultiPage && page > 1 && (
          <Button type="button" variant="outline" onClick={() => setPage((p) => p - 1)}>
            {prevLabel}
          </Button>
        )}

        {isLastPage ? (
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {form.button.text || "Submit"}
          </Button>
        ) : (
          <Button type="button" onClick={goNext}>
            {nextLabel}
          </Button>
        )}
      </div>
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

/** Build a submit payload from the currently-visible fields. */
function buildPayload(visibleFields: GravityField[], all: FormValues): SubmitPayload {
  const inputFields = visibleFields.filter((f) => !NON_INPUT_TYPES.has(f.type));
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
      if (v.length > 0) fd.append(name, v[0]); // single-file (P2); multi-file deferred
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
}

function FieldRow({ field, register, errors }: FieldRowProps) {
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

  // Composite fields (name / address): one labeled text input per sub-input.
  if (field.inputs?.length && field.type !== "checkbox") {
    return (
      <fieldset className="space-y-2">
        <legend className={cn("text-sm font-medium", LABEL_CLASS)}>
          {field.label}
          {field.isRequired && <span className="ml-0.5 text-red-500">*</span>}
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field.inputs.map((input) => (
            <Input
              key={input.id}
              placeholder={input.placeholder || input.label}
              aria-label={input.label}
              className={FIELD_CLASS}
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
      <Label htmlFor={`gf-${field.id}`} className={LABEL_CLASS}>
        {field.label}
        {field.isRequired && <span className="ml-0.5 text-red-500">*</span>}
      </Label>

      <FieldControl field={field} register={register} required={required} />

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
}: {
  field: GravityField;
  register: FieldRowProps["register"];
  required: string | false;
}) {
  const id = `gf-${field.id}`;

  switch (field.type) {
    case "fileupload":
      return (
        <>
          <input
            id={id}
            type="file"
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
          rows={5}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          className={cn(
            "flex w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 disabled:opacity-50",
            FIELD_CLASS,
          )}
          {...register(field.name, { required })}
        />
      );

    case "select":
      return (
        <select
          id={id}
          className={cn(
            "flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1",
            FIELD_CLASS,
          )}
          {...register(field.name, { required })}
        >
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

    case "consent":
    case "checkbox":
      // Single consent / simple checkbox. Multi-choice checkbox groups
      // (separate inputs[]) are handled in a later phase.
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
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          className={FIELD_CLASS}
          {...register(field.name, { required })}
        />
      );
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="font-open-sans text-xs text-red-600">{message}</p>;
}
