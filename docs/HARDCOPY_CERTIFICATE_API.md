# Hardcopy Certificate — backend REST contract

**Consumer:** `/hardcopy-certificate` (this repo, `openspec/changes/add-hardcopy-certificate-page`).
**Provider:** `wp-lms-backend-rest-api`, change `add-hardcopy-certificate-api`
(branch `hardcopy-certificate-api-proposal`, **not yet merged or deployed**).
**Namespace:** `lms-backend/v1`.

The plugin already implements the ordering contract this page needs. This document
records what the frontend depends on, plus the **four gaps** the plugin change does
not yet cover.

**Verified end-to-end on `tx-local-site.test` (2026-09-08)** by copying the branch's
three PHP files into the site's plugin checkout: config, quote and the full page render
all work, and `/hardcopy-certificate` prices a "Both £19.99 + UK delivery" order at
**£22.98** through the BFF and in the browser. §5 records what passed.

---

## 1. Product slugs

A "product" is one certificate order flow: a display Gravity Form (whose fields define
the schema and the authoritative prices), a record form, and a txn field.

| Slug       | Display GF | WP page                              | Frontend route          |
| ---------- | ---------- | ------------------------------------ | ----------------------- |
| `default`  | 23         | `/certificate/` (id 71362)           | `/certificate`          |
| `hardcopy` | 22         | `/hardcopy-certificate/` (id 128785) | `/hardcopy-certificate` |

Properties the frontend relies on, all already implemented:

1. **Path-scoped, not a query parameter** — `/certificate/{product}/config` etc.
2. **Unscoped routes are aliases for `default`.** `/certificate` keeps emitting the
   bare path, so it is unchanged and still works against older plugin builds.
3. **No fallback between products.** An unknown slug is a 404, never another product's
   prices. This is what makes the response trustworthy _without_ a product echo: a
   plugin build that does not serve `/certificate/hardcopy/config` answers 404, which
   the page renders as "ordering unavailable".
4. **Slug, never a raw form id**, so a caller cannot point pricing at an arbitrary form.

The frontend mirrors the allowlist in `src/types/certificate.ts` (`CERT_PRODUCT_SLUGS`)
and re-validates it in the BFF routes, since the browser can call those directly.

---

## 2. What the frontend calls

| Frontend                                 | Upstream (`default`)       | Upstream (`hardcopy`)                        |
| ---------------------------------------- | -------------------------- | -------------------------------------------- |
| `GET /api/certificate/config?product=`   | `GET /certificate/config`  | `GET /certificate/hardcopy/config`           |
| `POST /api/certificate/quote`            | `POST /certificate/quote`  | `POST /certificate/hardcopy/quote`           |
| `POST /api/certificate/intent` → quote   | `POST /certificate/quote`  | `POST /certificate/hardcopy/quote`           |
| `POST /api/certificate/confirm` → record | `POST /certificate/record` | `POST /certificate/hardcopy/record`          |
| Stripe webhook → record                  | `POST /certificate/record` | `POST /certificate/hardcopy/record`          |
| Server Component page content            | `GET /certificate/page`    | `GET /certificate/hardcopy/page` ← **gap 1** |

The slug is a **path segment only** — it is stripped from request bodies, since the
plugin's documented selection shape has no product key.

### `cert_product` in PaymentIntent metadata

`/api/certificate/intent` writes the resolved slug into the Stripe PaymentIntent as
`cert_product`. Both recording paths (client confirm and the Stripe webhook) read it
back off the **retrieved** PaymentIntent — never off a request body — and forward the
metadata to `/certificate/{product}/record`.

This matches the plugin, which re-reads `cert_product` out of the forwarded metadata and
treats it as authoritative over the request path. Both sides independently arrived at the
same rule: the product that priced an order must be the product it is recorded against,
so it travels in the same signed envelope as the amount.

**The key name is load-bearing.** An earlier draft of this frontend wrote `cert_variant`;
the plugin would not have found it, fallen back to the path, and recorded a £19.99
hardcopy order against form 23.

---

## 3. Fields the frontend consumes

From `GET /certificate/{product}/config`:

- `form_id`, `record_form_id`, `currency`
- `products[]` — `fieldId`, `name`, `label`, `choices[]`, `quantity`, **`required`**
- `shipping` — `fieldId`, `name`, `label`, `choices[]`, **`appliesTo`** ← **gap 2**
- `fields[]` — the non-pricing GF fields, rendered dynamically

`products[].required` is the plugin's own "group offers no zero-priced choice" rule. The
frontend uses it to decide which groups may be defaulted to their £0 opt-out and which
must be left unselected — form 22's hardcopy group has no opt-out, so defaulting it would
silently pre-add £19.99. The frontend re-derives the same rule when the field is absent.

---

## 4. Gaps

### Gap 1 — `GET /certificate/{product}/page` is not registered

`Certificate_Controller::get_page()` ignores the product and there is no scoped route, so
`/certificate/hardcopy/page` 404s. Verified against the local mirror on 2026-09-08:
the unscoped endpoint returns `/certificate`'s `hero.images` and `promoBanner.image`.

The frontend requests the scoped path, so today it gets a 404 and falls back to its static
defaults — correct, but it means **ACF content configured for page 128785 cannot appear on
the page** until the route exists.

Needed: a `{product}`-scoped `page` route resolving to that product's ACF record, returning
the same shape (and the same documented empty-fallback shape when nothing is configured).

### Gap 2 — `shipping.appliesTo` is not exposed

The GF shipping field is conditional on a physical product being chosen, but the config
does not expose that conditional logic. The frontend previously inferred it from **array
position** (`products[1]`), which is correct on form 23 and **wrong on form 22**, where the
hardcopy group is `products[0]` — shipping would have keyed off the digital transcript.

It currently falls back to matching the product label against `/hard\s*copy|printed/i`. That
works for both forms but breaks silently if a product is renamed in the GF admin.

Needed: `shipping.appliesTo: number[]` — the product field ids the shipping field's
conditional logic depends on. `[69]` for both current forms.

### Gap 4 — form 22's field 63 "Payment Method" radio is not stripped

`Certificate_Pricing::input_fields()` strips the pricing and payment field types the
certificate flow handles itself (including `stripe_creditcard`, field 71), but form 22's
field **63 "Payment Method"** — a `radio` with the single pre-selected choice "Debit or
Credit Card" — comes through in `fields[]`. Form 23 has no such field, so this never
surfaced before.

Observed on the rendered page: a redundant "Payment Method / ○ Debit or Credit Card"
radio sits directly above the frontend's own Stripe Elements card section.

Cosmetic, not a correctness or money bug. It belongs in the plugin rather than the
frontend, because "which GF fields the certificate flow owns" is the plugin's decision and
the frontend spec forbids hardcoding field ids. Suggested: strip field 63 the same way 71
is stripped, or exclude payment-method radios by type.

### Gap 3 — the `hardcopy` record form does not exist yet

`Certificate_Products` ships `hardcopy` with `record`/`txn` = 0 on purpose, so
`/certificate/hardcopy/record` returns `lms_cert_record_unconfigured` until an operator
clones form 22 without the Stripe field and sets `lms_certificate_products`.

**Consequence for this page: it can take a payment it cannot record.** The intent and
confirm paths succeed, then recording 503s — money captured in Stripe with no GF entry. The
503 is transient so Stripe retries for ~3 days and it self-heals if the form is configured
inside that window, but `/hardcopy-certificate` **must not go live** before the plugin
change's tasks 6.1 and 6.2 are done.

---

## 5. Acceptance checks

Verified against `tx-local-site.test` on 2026-09-08 with the branch deployed:

- [x] `GET /certificate/config` → `form_id: 23`, groups `[51, 69]` (unchanged, unscoped alias)
- [x] `GET /certificate/default/config` → `form_id: 23`
- [x] `GET /certificate/hardcopy/config` → `form_id: 22`, group **69 first** with `required: true`, group 51 second
- [x] `GET /certificate/bogus/config` → 404 `lms_cert_unknown_product`
- [x] `POST /certificate/hardcopy/quote`, field 69 = "Both … £19.99 (Save 33%)" qty 1, shipping UK → `total: 22.98`
- [x] `POST /certificate/hardcopy/quote` omitting the required group 69 → 400 `lms_cert_invalid_selection`
- [x] Rendered `/hardcopy-certificate`: hardcopy group first and unselected, digital opt-out pre-checked, shipping appears only after a hardcopy choice, Pay button reads **£22.98**
- [x] Rendered `/certificate` unchanged: digital group first, both defaulted to £0, no Payment Method radio, all six field-78 address inputs

Still failing / pending:

- [ ] Both configs return `shipping.appliesTo: [69]` — **absent** _(gap 2)_
- [ ] `GET /certificate/hardcopy/page` → **404** _(gap 1)_
- [ ] `GET /certificate/hardcopy/config` omits field 63 — **present** _(gap 4)_
- [ ] `POST /certificate/hardcopy/record` with `metadata.cert_product = "hardcopy"` → entry in form 22 — blocked, `record_form_id: 0` _(gap 3)_
- [ ] Same `payment_intent_id` twice → one entry _(blocked on gap 3)_

**Choice values include their suffix.** Group 69's "Both" choice has
`value === label === "Both CPD Accredited Certificate & Official Transcript for £19.99 (Save 33%)"`.
Quoting with the suffix stripped returns 400 — the frontend passes values through verbatim,
so this only matters for hand-written requests and fixtures.

---

## 6. Form 22 vs form 23 — verified probe

Probed against the local mirror `tx-local-site.test` on 2026-09-08. Field ids **collide
across the two forms with different meanings**, which is why nothing about form 22 can be
derived from form 23's config.

|                      | Form 23 (`default`)                                             | Form 22 (`hardcopy`)                                                    |
| -------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| First product group  | **51** "Digital Version (PDF)" — 5 choices, has opt-out         | **69** "Hardcopy CPD Certificate" — 3 choices, **no opt-out, required** |
| Second product group | **69** "Hardcopy (Officially Printed)" — 4 choices, has opt-out | **51** "Digital Transcript" — 2 choices                                 |
| Quantity fields      | 50 (→51), 70 (→69)                                              | 70 (→69), 50 (→51)                                                      |
| Shipping             | 68                                                              | 68 (identical choices)                                                  |
| Address              | **78** (`input_78_*`)                                           | **44** (`input_44_*`)                                                   |
| Sections             | 12 Personal Details, 49 Course Details                          | 12, 49, **43 Payments**                                                 |
| Text/email/phone     | 21 / 6 / 66                                                     | identical                                                               |
| Course names / notes | 74 / 64                                                         | identical                                                               |
| Accreditation HTML   | 75                                                              | identical                                                               |
| Coupon / Total       | 73 / 36                                                         | identical (neither consumed by the frontend)                            |

**Form 22 choices and prices (GBP):**

- Field 69 _Hardcopy CPD Certificate_ (required): CPD Accredited Certificate — 14.99 ·
  Official Transcript — 14.99 · Both — 19.99 _(labelled "Save 33%")_
- Field 51 _Digital Transcript_: Official Transcript — 9.99 · I don't need digital Transcript — 0
- Field 68 _Shipping_: UK Delivery — 2.99 · International Tracking and Signed — 20 · International DHL Express — 50
- Fields 70 and 50 _How many_: options 1–10, conditional

Field 51's opt-out label differs between the forms ("I don't need digital Certificate &
Transcript" on 23, "I don't need digital Transcript" on 22). The frontend renders labels
verbatim, so no normalisation is wanted.

Stripe credit-card (71) and payment-method radio (63) must continue to be stripped from
`fields`, as they are for form 23 — the frontend renders Stripe Elements itself.
