"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MARKETING_FIELD_CLASS, MARKETING_LABEL_CLASS } from "@/components/ui/form-field";

const MESSAGE_MAX = 1000;

const FIELD_CLASS = MARKETING_FIELD_CLASS;
const LABEL_CLASS = MARKETING_LABEL_CLASS;

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          first_name: data.get("first_name"),
          last_name: data.get("last_name"),
          email: data.get("email"),
          phone: data.get("phone"),
          message: data.get("message"),
          website: data.get("website"),
        }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        error?: { message?: string } | string;
      };

      if (!res.ok) {
        const msg =
          typeof body.error === "string"
            ? body.error
            : (body.error?.message ?? "Could not send your message. Please try again.");
        throw new Error(msg);
      }

      setStatus("sent");
      form.reset();
      setMessage("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not send your message.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <h3 className="font-suse text-xl font-bold text-neutral-900">Message sent!</h3>
        <p className="mt-2 font-open-sans text-sm text-neutral-600">
          Thanks for getting in touch. Our team will get back to you promptly.
        </p>
        <Button type="button" variant="outline" className="mt-6" onClick={() => setStatus("idle")}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-first-name" className={LABEL_CLASS}>
            First name
          </Label>
          <Input
            id="contact-first-name"
            name="first_name"
            placeholder="First name"
            required
            autoComplete="given-name"
            className={FIELD_CLASS}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-last-name" className={LABEL_CLASS}>
            Last name
          </Label>
          <Input
            id="contact-last-name"
            name="last_name"
            placeholder="Last name"
            autoComplete="family-name"
            className={FIELD_CLASS}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-email" className={LABEL_CLASS}>
          Email
        </Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          placeholder="you@company.com"
          required
          autoComplete="email"
          className={FIELD_CLASS}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-phone" className={LABEL_CLASS}>
          Phone number
        </Label>
        <Input
          id="contact-phone"
          name="phone"
          type="tel"
          placeholder="Phone number"
          autoComplete="tel"
          className={FIELD_CLASS}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-message" className={LABEL_CLASS}>
          Message
        </Label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          maxLength={MESSAGE_MAX}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Leave us a message..."
          className="flex w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 ring-offset-background placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        />
        <p className="text-right font-open-sans text-xs text-neutral-400">
          {message.length} / {MESSAGE_MAX}
        </p>
      </div>

      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <p className="font-open-sans text-sm text-neutral-500">
        You agree to our friendly{" "}
        <Link href="/privacy-policy" className="font-semibold text-secondary-500 underline">
          privacy policy
        </Link>
        .
      </p>

      {error && (
        <p role="alert" className="font-open-sans text-sm text-red-600">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={status === "sending"}
        className="w-full bg-secondary-500 text-white hover:bg-secondary-600"
        size="lg"
      >
        {status === "sending" && <Loader2 className="animate-spin" />}
        Send message
      </Button>
    </form>
  );
}
