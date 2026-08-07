import Link from "next/link";

interface FormUnavailableMessageProps {
  supportEmail?: string | null;
  formLabel: string;
}

/** Shown when a GF form id is missing or the schema cannot be loaded. */
export function FormUnavailableMessage({ supportEmail, formLabel }: FormUnavailableMessageProps) {
  return (
    <div className="font-open-sans rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      The {formLabel} is not configured yet. Please{" "}
      {supportEmail ? (
        <>
          email us at{" "}
          <a href={`mailto:${supportEmail}`} className="font-semibold underline">
            {supportEmail}
          </a>
        </>
      ) : (
        <Link href="/contact-us" className="font-semibold underline">
          contact us
        </Link>
      )}{" "}
      and we will help you directly.
    </div>
  );
}
