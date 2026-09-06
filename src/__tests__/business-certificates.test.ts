import { describe, it, expect } from "vitest";
import {
  canGenerateCertificate,
  certificateBlockedReason,
} from "@/lib/utils/business-certificates";

describe("canGenerateCertificate", () => {
  it("allows a finished course with a passing score", () => {
    expect(canGenerateCertificate({ progress: 100, quiz_scores: { percentage: 85 } }, 80)).toBe(
      true,
    );
  });

  it("allows a score exactly on the pass mark", () => {
    expect(canGenerateCertificate({ progress: 100, quiz_scores: { percentage: 80 } }, 80)).toBe(
      true,
    );
  });

  it("refuses a finished course whose score is below the pass mark", () => {
    expect(canGenerateCertificate({ progress: 100, quiz_scores: { percentage: 79 } }, 80)).toBe(
      false,
    );
  });

  it("refuses a finished course with no score yet — unchecked is not passed", () => {
    expect(canGenerateCertificate({ progress: 100 }, 80)).toBe(false);
  });

  it("refuses an unfinished course even with a passing score", () => {
    expect(canGenerateCertificate({ progress: 60, quiz_scores: { percentage: 95 } }, 80)).toBe(
      false,
    );
  });

  it("treats missing progress as zero", () => {
    expect(canGenerateCertificate({ quiz_scores: { percentage: 95 } }, 80)).toBe(false);
  });

  it("honours a pass mark of 0, where any recorded score counts", () => {
    expect(canGenerateCertificate({ progress: 100, quiz_scores: { percentage: 0 } }, 0)).toBe(true);
  });
});

describe("certificateBlockedReason", () => {
  it("distinguishes a missing score from a failing one", () => {
    expect(certificateBlockedReason({}, 80)).toBe("Awaiting score");
    expect(certificateBlockedReason({ quiz_scores: { percentage: 40 } }, 80)).toBe(
      "Below 80% pass mark",
    );
  });

  it("reports a zero score as failing rather than missing", () => {
    expect(certificateBlockedReason({ quiz_scores: { percentage: 0 } }, 80)).toBe(
      "Below 80% pass mark",
    );
  });
});
