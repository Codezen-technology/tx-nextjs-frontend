"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShareCertificate } from "@/lib/hooks/useStudentDashboard";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useSiteSettings } from "@/components/providers/site-settings-provider";
import type { Certificate } from "@/types/student-dashboard";

// ── Social sharing ────────────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = ["Linkedin", "Facebook", "X", "Instagram"] as const;
type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

function buildShareUrl(platform: SocialPlatform, certUrl: string, title: string): string | null {
  const url = encodeURIComponent(certUrl);
  const text = encodeURIComponent(`I earned a certificate for "${title}"!`);
  switch (platform) {
    case "Linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    case "Facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    case "X":
      return `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    case "Instagram":
      return null;
  }
}

// ── Email preview ─────────────────────────────────────────────────────────────

interface EmailPreviewProps {
  certificate: Certificate;
  recipientEmail: string;
  message: string;
  studentName: string;
  siteName: string;
  sending: boolean;
  onClose: () => void;
  onConfirmSend: () => void;
}

function EmailPreviewDialog({
  certificate,
  recipientEmail,
  message,
  studentName,
  siteName,
  sending,
  onClose,
  onConfirmSend,
}: EmailPreviewProps) {
  const certUrl = certificate.certificate_url || certificate.course_permalink;
  const subject = `${studentName} shared a certificate with you: ${certificate.title}`;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md overflow-hidden rounded-2xl p-0">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-[#eaecee] px-6 py-4">
          <DialogTitle className="text-[20px] font-semibold text-[#2e4450]">
            Email Preview
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-[#586973] hover:bg-[#f0f1f5]"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        {/* To / Subject */}
        <div className="space-y-1 border-b border-[#eaecee] px-6 py-3 text-sm">
          <div className="flex gap-2">
            <span className="w-16 shrink-0 font-semibold text-[#2e4450]">To:</span>
            <span className="text-[#586973]">{recipientEmail}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-16 shrink-0 font-semibold text-[#2e4450]">Subject:</span>
            <span className="text-[#586973]">{subject}</span>
          </div>
        </div>

        {/* Rendered email preview */}
        <div className="mx-4 my-3 overflow-hidden rounded-xl border border-[#eaecf0] text-sm">
          {/* Header band */}
          <div className="bg-[#3f4d97] py-4 text-center">
            <span className="text-lg font-bold text-white">{siteName}</span>
          </div>
          {/* Body */}
          <div className="space-y-2 p-4">
            {certificate.featured_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={certificate.featured_image as string}
                alt={certificate.title}
                className="max-h-36 w-full rounded-lg object-cover"
              />
            )}
            <p className="text-[17px] font-bold text-[#2e4450]">Certificate Shared</p>
            <p className="text-[#586973]">
              Course: <strong>{certificate.title}</strong>
            </p>
            <p className="text-[#586973]">
              Shared by: <strong>{studentName}</strong>
            </p>
            {message && (
              <div>
                <p className="text-[12px] text-[#586973]">Personal message:</p>
                <p className="whitespace-pre-line italic text-[#2e4450]">{message}</p>
              </div>
            )}
            <a
              href={certUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-[#3f4d97] px-6 py-2 text-sm font-semibold text-white hover:bg-[#2e3a7a]"
            >
              View Certificate
            </a>
          </div>
          {/* Footer */}
          <div className="bg-[#f6f6fa] px-4 py-2 text-center">
            <span className="text-[11px] text-[#73828a]">Sent via {siteName}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#eaecee] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-lg border-[#d0d5dd] text-[#344054]"
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={onConfirmSend}
            disabled={sending}
            className="rounded-lg bg-[#3f4d97] text-white hover:bg-[#2e3a7a]"
          >
            {sending ? "Sending..." : "Confirm & Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main share dialog ─────────────────────────────────────────────────────────

interface CertificateShareDialogProps {
  certificate: Certificate | null;
  open: boolean;
  onClose: () => void;
}

export function CertificateShareDialog({
  certificate,
  open,
  onClose,
}: CertificateShareDialogProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const { mutate, isPending, reset } = useShareCertificate();
  const user = useAuthStore((s) => s.user);
  const settings = useSiteSettings();

  const studentName = user?.displayName || "Student";
  const siteName = settings.site_name;
  const certUrl = certificate ? certificate.certificate_url || certificate.course_permalink : "";

  const handleSocialClick = (platform: SocialPlatform) => {
    if (!certificate) return;
    if (platform === "Instagram") {
      navigator.clipboard
        ?.writeText(certUrl)
        .then(() => toast.info("Link copied! Paste it in your Instagram post or story."));
      return;
    }
    const url = buildShareUrl(platform, certUrl, certificate.title);
    if (url) window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(certUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const handleSendEmail = () => {
    if (!certificate || !email.trim()) return;
    mutate(
      { courseId: certificate.course_id, email: email.trim(), message: message || undefined },
      {
        onSuccess: () => {
          toast.success("Email sent successfully!");
          setEmail("");
          setMessage("");
          setPreviewOpen(false);
        },
        onError: (err: unknown) => {
          const msg =
            err instanceof Error ? err.message : "Failed to send email. Please try again.";
          toast.error(msg);
        },
      },
    );
  };

  const handleClose = () => {
    setEmail("");
    setMessage("");
    reset();
    onClose();
  };

  if (!certificate) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-3xl gap-0 overflow-hidden rounded-2xl p-0 shadow-[0_4px_60px_rgba(0,0,0,0.3)]">
          {/* Header */}
          <div className="flex items-center justify-between px-8 pb-0 pt-8">
            <h2 className="text-[32px] font-semibold leading-tight text-[#2e4450]">
              Share your certificate
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded text-[#586973] hover:bg-[#f0f1f5]"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-8 px-8 py-8 md:flex-row">
            {/* Left: Social */}
            <div className="shrink-0 md:w-[420px]">
              <p className="mb-4 text-[20px] font-bold text-[#2e4450]">Share on Social Media</p>

              {/* Platform buttons */}
              <div className="mb-6 flex flex-wrap gap-2">
                {SOCIAL_PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSocialClick(p)}
                    className="h-10 rounded bg-[#f6f6fa] px-5 text-[18px] font-medium text-[#3f4d97] transition hover:bg-[#ededf5]"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Copy link bar */}
              <div className="flex h-14 items-center gap-1 rounded bg-[#f6f6fa] px-2">
                <div className="flex h-10 flex-1 items-center overflow-hidden rounded bg-white/70 px-2">
                  <span className="truncate text-sm font-medium text-[#2e4450]">{certUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex h-10 shrink-0 items-center gap-1.5 rounded bg-[#3f4d97] px-3 text-sm font-semibold text-white transition hover:bg-[#2e3a7a]"
                >
                  <Copy className="h-4 w-4" />
                  Copy Link
                </button>
              </div>
            </div>

            {/* Right: Email */}
            <div className="flex-1 rounded-lg border border-[#f6f6fa] p-6 shadow-[0_4px_6px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.1)]">
              <p className="text-[18px] font-bold text-[#2e4450]">Share via Email</p>
              <p className="mb-4 text-[18px] text-[#586973]">
                Send your certificate to an employer.
              </p>
              <hr className="mb-5 border-[#eaecee]" />

              <Label
                htmlFor="share-email"
                className="mb-1.5 block text-sm font-semibold text-[#2e4450]"
              >
                Email address
              </Label>
              <Input
                id="share-email"
                type="email"
                placeholder="employer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-5 rounded-lg border-[#bec5c9] focus:border-[#3f4d97] focus-visible:ring-[#3f4d97]"
              />

              <Label
                htmlFor="share-message"
                className="mb-1.5 block text-sm font-semibold text-[#2e4450]"
              >
                Optional message
              </Label>
              <textarea
                id="share-message"
                rows={4}
                placeholder="Type something..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mb-5 w-full resize-none rounded-lg border border-[#bec5c9] px-3 py-2 text-base text-[#2e4450] placeholder:text-[#667085] focus:border-[#3f4d97] focus:outline-none focus:ring-1 focus:ring-[#3f4d97]"
              />

              <hr className="mb-5 border-[#eaecee]" />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!email}
                  onClick={() => {
                    if (email) setPreviewOpen(true);
                  }}
                  className="rounded-lg border-[#d0d5dd] text-[18px] text-[#344054] shadow-sm"
                >
                  Preview
                </Button>
                <Button
                  type="button"
                  disabled={!email || isPending}
                  onClick={handleSendEmail}
                  className="rounded-lg bg-[#3f4d97] text-[18px] text-white shadow-sm hover:bg-[#2e3a7a]"
                >
                  {isPending ? "Sending..." : "Send Email"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {previewOpen && (
        <EmailPreviewDialog
          certificate={certificate}
          recipientEmail={email}
          message={message}
          studentName={studentName}
          siteName={siteName}
          sending={isPending}
          onClose={() => setPreviewOpen(false)}
          onConfirmSend={handleSendEmail}
        />
      )}
    </>
  );
}
