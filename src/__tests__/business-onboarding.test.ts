import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_DEFAULTS,
  initialAnswers,
  looksLikeEmail,
  sizeBandLabel,
  toCompletionPayload,
  type Answers,
} from "@/components/business/onboarding/answers";
import { NAV_STEPS, STEPS } from "@/components/business/onboarding/steps";
import type { BusinessSettings } from "@/types/business-dashboard";
import type { AuthUser } from "@/types/user";

const settings = (over: Partial<BusinessSettings> = {}): BusinessSettings =>
  ({
    business_id: 1,
    passing_mark: 80,
    certificate_self_download: true,
    certificate_self_download_locked: false,
    email_certificate_on_completion: true,
    onboarding_complete: false,
    platform_subdomain: "",
    mfa_enabled: false,
    integration_slack: false,
    integration_teams: false,
    integration_genai: false,
    company_name: "",
    company_size: 0,
    company_sector: "",
    phone: "",
    job_title: "",
    ...NOTIFICATION_DEFAULTS,
    ...over,
  }) as BusinessSettings;

const user: AuthUser = { email: "sal@sunrise.test", displayName: "Salvador", nicename: "sal" };

const SECTORS = ["Adult Social Care", "Construction"];

const answered = (over: Partial<Answers> = {}): Answers => ({
  fullName: "Salvador",
  email: "sal@sunrise.test",
  phone: "",
  jobTitle: "Training Manager",
  companyName: "Sunrise Care Ltd",
  companySector: "Adult Social Care",
  companySize: 49,
  passingMark: 80,
  selfDownload: true,
  notifications: { ...NOTIFICATION_DEFAULTS },
  ...over,
});

const step = (id: string) => STEPS.find((s) => s.id === id)!;

describe("size bands", () => {
  it("reads a stored size back by range, not exact match", () => {
    // The four bands this list replaced had tops 10/49/199/200, none of which
    // is a band top now — containment is what keeps them resolving.
    expect(sizeBandLabel(199)).toBe("100 – 249 employees");
    expect(sizeBandLabel(1)).toBe("1 – 10 employees");
    expect(sizeBandLabel(250)).toBe("250+ employees");
    expect(sizeBandLabel(5000)).toBe("250+ employees");
  });

  it("treats an unrecorded size as unset rather than the smallest band", () => {
    expect(sizeBandLabel(0)).toBeNull();
    expect(sizeBandLabel(null)).toBeNull();
    expect(sizeBandLabel(undefined)).toBeNull();
  });
});

describe("initialAnswers", () => {
  it("prefills the person from the account and the org from settings", () => {
    const a = initialAnswers(settings({ company_name: "Sunrise", company_size: 60 }), user);

    expect(a.fullName).toBe("Salvador");
    expect(a.email).toBe("sal@sunrise.test");
    expect(a.companyName).toBe("Sunrise");
    expect(a.companySize).toBe(99);
  });

  it("leaves the size unselected when the business has never recorded one", () => {
    expect(initialAnswers(settings({ company_size: 0 }), user).companySize).toBeNull();
  });

  it("falls back to the documented preference defaults", () => {
    const a = initialAnswers(settings(), null);

    expect(a.notifications.notify_course_completed).toBe(true);
    expect(a.notifications.notify_new_user).toBe(false);
    expect(a.fullName).toBe("");
  });
});

describe("step gates", () => {
  it("requires a name, a job title and an email-shaped address", () => {
    const manager = step("manager");

    expect(manager.isValid(answered(), SECTORS)).toBe(true);
    expect(manager.isValid(answered({ fullName: "  " }), SECTORS)).toBe(false);
    expect(manager.isValid(answered({ jobTitle: "" }), SECTORS)).toBe(false);
    expect(manager.isValid(answered({ email: "not-an-address" }), SECTORS)).toBe(false);
  });

  it("does not require a phone number", () => {
    expect(step("manager").isValid(answered({ phone: "" }), SECTORS)).toBe(true);
  });

  it("accepts only a sector the backend's vocabulary recognises", () => {
    const org = step("organisation");

    expect(org.isValid(answered(), SECTORS)).toBe(true);
    expect(org.isValid(answered({ companySector: "Underwater Basket Weaving" }), SECTORS)).toBe(
      false,
    );
    // While the vocabulary is still loading there is nothing to match, so the
    // gate holds rather than letting through a value the API would reject.
    expect(org.isValid(answered(), [])).toBe(false);
  });

  it("requires a chosen team size", () => {
    expect(step("organisation").isValid(answered({ companySize: null }), SECTORS)).toBe(false);
  });

  it("always lets the preferences step advance, even with every preference off", () => {
    const off = Object.fromEntries(
      Object.keys(NOTIFICATION_DEFAULTS).map((k) => [k, false]),
    ) as Answers["notifications"];

    expect(step("preferences").isValid(answered({ notifications: off }), SECTORS)).toBe(true);
  });
});

describe("step list", () => {
  it("has seven steps, six of them in the navigation", () => {
    expect(STEPS).toHaveLength(7);
    expect(NAV_STEPS).toHaveLength(6);
    expect(STEPS[0].standalone).toBe(true);
  });

  it("gives every navigable step a label, so no rail row can be blank", () => {
    for (const s of NAV_STEPS) expect(s.navLabel).toBeTruthy();
  });
});

describe("toCompletionPayload", () => {
  it("sends every answer in one body", () => {
    const payload = toCompletionPayload(answered({ phone: " 01234 567890 " }));

    expect(payload).toMatchObject({
      display_name: "Salvador",
      email: "sal@sunrise.test",
      phone: "01234 567890",
      job_title: "Training Manager",
      company_name: "Sunrise Care Ltd",
      company_sector: "Adult Social Care",
      company_size: 49,
      passing_mark: 80,
      certificate_self_download: true,
      notify_course_completed: true,
      notify_new_user: false,
    });
  });

  it("omits an optional name and email rather than sending empty strings", () => {
    const payload = toCompletionPayload(answered({ fullName: "   ", email: "" }));

    expect(payload.display_name).toBeUndefined();
    expect(payload.email).toBeUndefined();
  });
});

describe("looksLikeEmail", () => {
  it("separates blank and obviously-wrong from plausible", () => {
    expect(looksLikeEmail("sal@sunrise.test")).toBe(true);
    expect(looksLikeEmail("")).toBe(false);
    expect(looksLikeEmail("sal@sunrise")).toBe(false);
    expect(looksLikeEmail("sunrise.test")).toBe(false);
  });
});
