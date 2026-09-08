## Context

See `proposal.md — Why` for motivation.

Verified facts about the two WordPress pages (probed against the local WP mirror
`tx-local-site.test`, 2026-09-08):

|                      | `/certificate/`                                                  | `/hardcopy-certificate/`                                                 |
| -------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| WP page id           | 71362                                                            | 128785                                                                   |
| Gravity Form         | **23**                                                           | **22**                                                                   |
| First product group  | 51 "Digital Version (PDF)" — 5 choices incl. opt-out             | 69 "Hardcopy CPD Certificate" — 3 choices, **no opt-out, required**      |
| Second product group | 69 "Hardcopy (Officially Printed)" — 4 choices incl. opt-out     | 51 "Digital Transcript" — 2 choices (Official Transcript £9.99, opt-out) |
| Quantity fields      | 50 (for 51), 70 (for 69)                                         | 70 (for 69), 50 (for 51)                                                 |
| Shipping             | 68 — UK £2.99 / Intl Tracked £20 / DHL £50                       | 68 — identical                                                           |
| Address field        | **78**                                                           | **44**                                                                   |
| Sections             | 12 Personal Details, 49 Course Details                           | 12, 49, **43 Payments**                                                  |
| Other                | 75 HTML accreditation banner, 73 coupon, 36 total, 21/6/66/74/64 | same set                                                                 |

Two consequences drive the whole design:

1. **Field ids collide but do not mean the same thing.** Field 51 is a 5-choice digital
   product on form 23 and a 2-choice transcript-only product on form 22. Field 78 vs 44 for
   the address means input names (`input_78_1` vs `input_44_1`) differ. Nothing about the
   hardcopy form can be derived from form 23's config — it must be fetched separately.
2. **The deployed backend is form-23-hardcoded**, but the plugin repo already implements the
   fix. `wp-lms-backend-rest-api` branch `hardcopy-certificate-api-proposal` (change
   `add-hardcopy-certificate-api`, uncommitted) adds **product-scoped** routes
   `/certificate/{product}/{config,quote,record}` with slugs `default` (GF 23) and `hardcopy`
   (GF 22), keeping the unscoped routes as `default` aliases. This design follows that
   contract rather than inventing a second one.

   Local probe against the deployed build (2026-09-08): `/certificate/config` → `form_id: 23`;
   `/certificate/hardcopy/config` → 404 `rest_no_route`. So the scoped routes are not live yet.

The `CertificateForm` component is already fully schema-driven (products, quantity, shipping,
and non-pricing fields all render from the config), so it needs no per-product rendering
logic — only a product-scoped data source.

## Goals / Non-Goals

**Goals:**

- One `/hardcopy-certificate` page and one shared, product-parameterised order pipeline.
- `/certificate` byte-for-byte unchanged in behaviour after the refactor.
- Match the plugin's contract exactly — same slugs, same metadata key, same paths.
- The product slug travels server-side through pricing → PaymentIntent → recording, so a
  charged order cannot be recorded against the wrong form.
- Record the remaining backend gaps; the frontend fails safe until they land.

**Non-Goals:**

- Implementing the WordPress plugin changes (separate repo — see
  `[[project_b2b_backend_split]]` precedent: the user implements backend, this repo specs it).
- Merging the two pages, or building a CMS-driven "any product" page factory. The plugin's
  registry is site-configurable, but this repo only has routes for two; a closed union
  matching the two known slugs is the right shape here.
- Coupon field (GF 73) — not wired on `/certificate` today, stays unwired.
- Migrating the "Power up your skills for a better career!" CTA band and footer seen on the
  WP page; those come from the shared site shell.

## Decisions

### 1. Adopt the plugin's product slug, do not invent a parallel concept

`type CertProductSlug = "default" | "hardcopy"` in `src/types/certificate.ts`, default
`"default"` — the plugin's `Certificate_Products::DEFAULT_SLUG`.

Named "slug" because `CertProduct` in the same file already means a _product group within a
form_ (field 69, field 51). Two different things called "product" in one module would be a
standing trap.

The slug is a **route-level constant**, not user input: each page passes its own literal.
The BFF routes still re-validate against the allowlist, because the browser can call
`/api/certificate/config?product=…` directly.

_Alternative rejected:_ the `variant` / `certificate` naming an earlier draft of this change
used. It described the same concept but disagreed with the backend on every name, which is
exactly how the `cert_variant` / `cert_product` metadata mismatch below happened.

### 2. Path segment, not a query parameter

`/certificate/hardcopy/config`, not `/certificate/config?variant=hardcopy`. This is the
plugin's shape, and it is the better one: the plugin registers the slug pattern at the
routing layer, so a malformed or unknown slug 404s **before any handler runs**.

The unscoped `/certificate/{config,quote,record}` routes stay as `default` aliases, so the
frontend emits the bare path for `default`. `/certificate` is therefore byte-identical to
before products existed and keeps working against plugin builds that predate the change.

### 3. The 404 replaces the response echo

An earlier draft required the backend to echo the resolved slug in every response, so the
page could detect "the backend ignored my scoping" and refuse to render a wrong-priced form.

Path scoping makes that unnecessary. A plugin that does not serve `/certificate/hardcopy/config`
answers **404**, which surfaces as a rejected query and renders "ordering unavailable" — the
same fail-closed outcome, with no extra field and no extra backend requirement. A response
can only come back for the product that was asked for.

So the echo requirement is dropped, and `CertConfig` has no `variant`/`product` field.

### 4. `cert_product` in PaymentIntent metadata — the plugin's key, exactly

`/api/certificate/intent` writes `cert_product` into the Stripe PaymentIntent metadata
alongside the existing `cert_selection` / `cert_total_minor`. Both `/api/certificate/confirm`
and the Stripe webhook read it back off the **retrieved** PaymentIntent — never from a request
body — and post to `/certificate/{product}/record`.

The plugin independently does the same thing from its side: `post_record()` re-reads
`metadata['cert_product']` and prefers it over the request path, precisely so a quote and its
record cannot diverge onto different forms.

**The exact key name is load-bearing.** This change originally wrote `cert_variant`. The
plugin would not have found it, fallen back to the path, and recorded a £19.99 hardcopy order
against form 23 — the exact failure both designs were built to prevent, caused only by two
correct-in-isolation designs naming the same concept differently.

### 5. Query keys move to `query-keys.ts`, scoped by product

`certificate-form.tsx` currently inlines `queryKey: ["certificate", "config"]`, against the repo
convention. Both products share the component, so an unscoped key would serve form 23's config
to the hardcopy page from cache. Add `queryKeys.certificate.config(product)` /
`.quote(product, selection)` and use them. This is a correctness fix, not cleanup.

### 6. Page composition: extract a shared layout, keep two page files

`/certificate/page.tsx`'s hero + order card + promo sidebar becomes
`src/components/certificate/certificate-page-shell.tsx`, taking content + product slug. Each route
file keeps its own `generateMetadata`, defaults, and `revalidate`.

_Alternative rejected:_ a single `[product]` dynamic route. The two URL slugs are unrelated words,
both need distinct SEO and distinct static defaults, and a dynamic segment would need a
whitelist guard plus `generateStaticParams` — more machinery than two small files.

### 7. Consume `products[].required`; never infer a shippable product from array position

The plugin already sends `required` per product group, computed from "the group offers no
zero-priced choice". The frontend uses it to decide which groups may be defaulted to their £0
opt-out and which must be left unselected, re-deriving the same rule only when the field is
absent (older builds).

This replaces two positional assumptions the shared form carried, both of which were correct
on form 23 and wrong on form 22:

- `config.products[1]` was taken to be the hardcopy group for the purpose of showing shipping.
  On form 22 the hardcopy group is `products[0]`, so shipping would have keyed off the _digital
  transcript_. Resolution order is now `shipping.appliesTo` (requested, gap 2) → product label
  match → the old positional rule as a last resort.
- Defaulting a group fell through to `choices.at(-1)` when it had no £0 option. On form 22 that
  **pre-selects "Both … £19.99"**, silently adding £19.99 to every order. Required groups are now
  left unselected and validated on submit.

Neither was reachable before this change, since only form 23 was ever served.

### 8. Removing the redirect is part of this change, gated on the page existing

`next.config.mjs` line 87 (`"/hardcopy-certificate": "/certificate"`) is deleted in the same
commit that adds the route. Removing it earlier produces a 404 on a URL that currently works.

## Risks / Trade-offs

- **Hardcopy page prices against form 23** → structurally prevented by Decision 2: the scoped
  path either returns the hardcopy product or 404s. There is no response that could be the
  wrong product.
- **A charged order is recorded against the wrong form** → Decision 4: the slug travels in the
  signed PaymentIntent metadata under the plugin's own key, and both recording paths read it
  from Stripe rather than from a request body.
- **Refactoring the shared form regresses the live `/certificate` payment path** → the
  `certificate-page-content` delta spec pins `/certificate`'s behaviour; tasks include a
  before/after snapshot of the rendered `/certificate` form and an end-to-end order in Stripe
  test mode on `/certificate` _before_ the hardcopy page is wired.
- **Stripe metadata limits (50 keys, 500 chars each)** → `cert_product` is one short key added
  to an envelope that already carries `f_<inputname>` per dynamic field. Measured: a full form-22
  order produces 16 keys.
- **Shared cache poisoning between products** → Decisions 2 and 5 scope both the Next.js cache
  tag and the TanStack Query key by product slug.
- **Backend work is out of this repo's control** → the frontend is shippable independently: with
  the plugin unchanged, `/hardcopy-certificate` renders hero, content, and an "ordering
  temporarily unavailable" order area. The redirect removal is the only user-visible regression
  risk, and an unavailable-but-correct page beats a redirect to the wrong offer.
- **Taking a payment that cannot be recorded** → the plugin ships `hardcopy` with `record`/`txn`
  = 0 until an operator clones form 22 without the Stripe field, so recording returns
  `lms_cert_record_unconfigured`. The 503 is transient and Stripe retries for ~3 days, but the
  page must not go live before that is configured. Tracked as gap 3 in
  `docs/HARDCOPY_CERTIFICATE_API.md`.

## Migration Plan

1. Land the frontend refactor (product plumbing, shared shell) with `/certificate` still the only
   consumer — verifiable as a pure no-op refactor.
2. Land the hardcopy page + redirect removal. Against the deployed plugin the scoped routes 404,
   so the page shows hero and content with an "ordering unavailable" order area.
3. Plugin side: merge and deploy `add-hardcopy-certificate-api`, then close its tasks 6.1/6.2
   (clone form 22 into a record form, set `lms_certificate_products`) — **required before the
   page can take money** — plus the two gaps this design depends on
   (`/certificate/{product}/page`, `shipping.appliesTo`).
4. The page's order area activates with no further frontend deploy.
5. **Rollback:** re-add the `next.config.mjs` redirect line. That fully restores today's
   behaviour regardless of what state the backend is in.
