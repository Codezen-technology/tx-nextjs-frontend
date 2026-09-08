import { describe, expect, it } from "vitest";
import { endpoints } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/utils/query-keys";
import { shippableChosen, shippableProductIds } from "@/components/certificate/certificate-form";
import { CERT_CONFIG_22, CERT_CONFIG_23 } from "@/__tests__/fixtures/certificate-config";
import { isCertProductSlug, type CertConfig } from "@/types/certificate";

/** The default choice the form derives for a product: its £0 opt-out, or none. */
function defaultChoices(config: CertConfig) {
  const out: Record<string, { choice: string; qty: number }> = {};
  for (const product of config.products) {
    const zero = product.choices.find((c) => c.price === 0);
    if (zero) out[product.fieldId] = { choice: zero.value, qty: 1 };
  }
  return out;
}

describe("cert product — endpoint builders", () => {
  it("emits the plugin's unscoped alias for the default product", () => {
    // Unchanged from before products existed, so `/certificate` keeps working
    // against plugin builds that predate the scoped routes.
    expect(endpoints.certificate.config()).toMatch(/\/certificate\/config$/);
    expect(endpoints.certificate.page()).toMatch(/\/certificate\/page$/);
    expect(endpoints.certificate.quote()).toMatch(/\/certificate\/quote$/);
    expect(endpoints.certificate.record()).toMatch(/\/certificate\/record$/);
  });

  it("treats an explicit default the same as omitting it", () => {
    expect(endpoints.certificate.page("default")).toBe(endpoints.certificate.page());
    expect(endpoints.certificate.config("default")).toBe(endpoints.certificate.config());
    expect(endpoints.certificate.quote("default")).toBe(endpoints.certificate.quote());
    expect(endpoints.certificate.record("default")).toBe(endpoints.certificate.record());
  });

  it("scopes a non-default product by path segment", () => {
    expect(endpoints.certificate.config("hardcopy")).toMatch(/\/certificate\/hardcopy\/config$/);
    expect(endpoints.certificate.page("hardcopy")).toMatch(/\/certificate\/hardcopy\/page$/);
    expect(endpoints.certificate.quote("hardcopy")).toMatch(/\/certificate\/hardcopy\/quote$/);
    expect(endpoints.certificate.record("hardcopy")).toMatch(/\/certificate\/hardcopy\/record$/);
  });

  it("never emits a query parameter", () => {
    // Scoping is a path segment; a `?product=` would silently be ignored by the
    // plugin and return the default product's prices.
    for (const slug of ["default", "hardcopy"] as const) {
      expect(endpoints.certificate.config(slug)).not.toContain("?");
      expect(endpoints.certificate.page(slug)).not.toContain("?");
    }
  });
});

describe("cert product — allowlist", () => {
  it.each(["default", "hardcopy"])("accepts %s", (v) => {
    expect(isCertProductSlug(v)).toBe(true);
  });

  it.each(["", "Hardcopy", "hardcopy ", "22", "certificate", "digital", null, undefined, 22, {}])(
    "rejects %o",
    (v) => {
      expect(isCertProductSlug(v)).toBe(false);
    },
  );
});

describe("cert product — query keys", () => {
  it("scopes the config key so one page cannot serve the other's prices", () => {
    expect(queryKeys.certificate.config("default")).not.toEqual(
      queryKeys.certificate.config("hardcopy"),
    );
  });

  it("defaults the config key to the default product", () => {
    expect(queryKeys.certificate.config()).toEqual(queryKeys.certificate.config("default"));
  });

  it("scopes the quote key by product even for an identical selection", () => {
    const selection = { products: { "69": { choice: "x", qty: 1 } }, shipping: null };
    expect(queryKeys.certificate.quote("default", selection)).not.toEqual(
      queryKeys.certificate.quote("hardcopy", selection),
    );
  });
});

describe("shipping applicability", () => {
  it("resolves the hardcopy product on form 23, where it is products[1]", () => {
    expect(CERT_CONFIG_23.products[1]?.fieldId).toBe(69);
    expect(shippableProductIds(CERT_CONFIG_23)).toEqual([69]);
  });

  it("resolves the hardcopy product on form 22, where it is products[0]", () => {
    expect(CERT_CONFIG_22.products[0]?.fieldId).toBe(69);
    expect(shippableProductIds(CERT_CONFIG_22)).toEqual([69]);
  });

  it("prefers the backend's appliesTo over the label heuristic", () => {
    const config: CertConfig = {
      ...CERT_CONFIG_22,
      shipping: { ...CERT_CONFIG_22.shipping!, appliesTo: [51] },
    };
    expect(shippableProductIds(config)).toEqual([51]);
  });

  it("does not offer shipping for a digital-only selection on form 22", () => {
    // Form 22's digital transcript is priced but not shippable. Position-based
    // logic would have treated it as the hardcopy product and shown shipping.
    const digitalOnly = { "51": { choice: "Official Transcript for £9.99", qty: 1 } };
    expect(shippableChosen(CERT_CONFIG_22, [69], digitalOnly)).toBe(false);
  });

  it("offers shipping once a priced hardcopy option is chosen on form 22", () => {
    const withHardcopy = {
      "69": { choice: "CPD Accredited Certificate for £14.99", qty: 1 },
    };
    expect(shippableChosen(CERT_CONFIG_22, [69], withHardcopy)).toBe(true);
  });

  it("does not offer shipping for form 23's £0 hardcopy opt-out", () => {
    expect(shippableChosen(CERT_CONFIG_23, [69], defaultChoices(CERT_CONFIG_23))).toBe(false);
  });
});

describe("product defaults — no priced option is ever pre-selected", () => {
  it("defaults both of form 23's products to their £0 opt-out", () => {
    const defaults = defaultChoices(CERT_CONFIG_23);
    expect(Object.keys(defaults).sort()).toEqual(["51", "69"]);
    for (const product of CERT_CONFIG_23.products) {
      const chosen = product.choices.find((c) => c.value === defaults[product.fieldId]?.choice);
      expect(chosen?.price).toBe(0);
    }
  });

  it("leaves form 22's hardcopy product unselected — it has no £0 option", () => {
    const defaults = defaultChoices(CERT_CONFIG_22);
    expect(defaults["69"]).toBeUndefined();
    expect(defaults["51"]?.choice).toBe("I don't need digital Transcript");
  });

  it("would otherwise have pre-selected £19.99 on form 22", () => {
    // Guards the old `?? choices.at(-1)` fallback from coming back.
    const hardcopy = CERT_CONFIG_22.products[0]!;
    expect(hardcopy.choices.some((c) => c.price === 0)).toBe(false);
    expect(hardcopy.choices.at(-1)?.price).toBe(19.99);
  });
});

describe("form 23 is unchanged by the refactor", () => {
  it("still exposes the same products, prices and address inputs", () => {
    expect(CERT_CONFIG_23.form_id).toBe(23);
    expect(CERT_CONFIG_23.products.map((p) => p.fieldId)).toEqual([51, 69]);
    expect(CERT_CONFIG_23.shipping?.fieldId).toBe(68);
    const address = CERT_CONFIG_23.fields.find((f) => f.type === "address");
    expect(address?.inputs?.map((i) => i.name)).toContain("input_78_1");
  });

  it("uses different address input names from form 22", () => {
    const a23 = CERT_CONFIG_23.fields.find((f) => f.type === "address");
    const a22 = CERT_CONFIG_22.fields.find((f) => f.type === "address");
    expect(a22?.inputs?.map((i) => i.name)).toContain("input_44_1");
    expect(a22?.inputs?.map((i) => i.name)).not.toEqual(a23?.inputs?.map((i) => i.name));
  });
});
