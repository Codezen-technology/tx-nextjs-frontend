"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShareCertificate } from "@/lib/hooks/useStudentDashboard";
import type { Certificate } from "@/types/student-dashboard";

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
  const { mutate, isPending } = useShareCertificate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificate || !email.trim()) return;
    mutate(
      { courseId: certificate.course_id, email: email.trim() },
      {
        onSuccess: () => {
          toast.success("Certificate shared successfully");
          setEmail("");
          onClose();
        },
        onError: () => toast.error("Failed to share certificate"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Certificate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="share-email">Recipient email</Label>
            <Input
              id="share-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
