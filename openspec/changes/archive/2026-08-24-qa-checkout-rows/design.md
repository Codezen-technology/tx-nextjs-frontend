## Context

See `proposal.md` — **Why**. The frame (`6239:134328`) holds Desktop, Laptop and Mobile,
and its payment block is `6239:134669`, read in full.

| Element          | Frame                                                                                      | Build before                                                  |
| ---------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Card marks       | `card-amex 1`, `card-discover 1`, `card-mastercard 1`, `card-visa 1` — each **43.08 × 28** | text in boxes: five labels in the badge, four in the selector |
| Card row         | radio + a 40×28 card-icon chip + "Credit/Debit Card", marks right-aligned                  | same shape, text marks                                        |
| PayPal row       | radio + PayPal mark + "PayPal" — **selectable, not dimmed, no badge**                      | dimmed placeholder with a "Coming soon" pill                  |
| Assurance        | "100% secure payment" + icon, right of the "Payment method" heading                        | "Guaranteed safe & secure checkout" inside the badge          |
| Under the button | `image 24`, 792 × 120                                                                      | nothing                                                       |

## Goals / Non-Goals

**Goals:**

- Show real brand marks, from one list
- Stop advertising a method the build cannot process
- Add the assurance line the frame specifies

**Non-Goals:**

- Implementing PayPal — product work
- `image 24` — an unnamed rectangle; its content cannot be read from geometry
- `D1`, the missing section

## Decisions

### D1 — Commit the frame's exported SVGs

The marks are downloaded from the frame's asset URLs and committed under
`public/icons/payment/`. Those URLs expire in about a week, so referencing them directly
would ship a checkout page whose payment marks vanish. Nor are they hand-drawn: brand marks
are trademarks with exact geometry, and an approximation is both wrong and a legal question.

The Visa asset arrives as artwork plus a mask; the artwork alone is the wordmark, so it is
committed on its own and given the frame's white chip and border in markup.

### D2 — One `CardBrandMarks` component

Two hard-coded lists is how they drifted — five brands in one place, four in the other, and
JCB in neither the frame nor the other list. One component, one array, both call sites.

### D3 — JCB comes off the list

It is in the report's prose ("VISA, JCB etc.") and in the build's badge, and in neither the
frame nor the selector. A card mark is a claim about what the gateway accepts, so the
design's list wins over the report's "etc.".

### D4 — Remove the PayPal placeholder rather than making it selectable

The frame shows PayPal working; the build has no PayPal integration. Two ways to reconcile:
implement it, or stop showing it. Implementing a payment method is not a QA row.

Shipping a dimmed "coming soon" row is the worst of the three: it takes space in the
decision moment, tells the buyer their preferred method is nearly here, and is the thing
the report asked to remove. Removed, with a note on the row that the frame's PayPal row is
the design for when it exists.

### D5 — The assurance line reuses the site's existing shield glyph

The frame has a 24×24 `Secure` icon; the build already uses lucide's `ShieldCheck` for
exactly this claim in `SecurePaymentBadge`. Reusing it keeps one glyph for one meaning. The
frame's own asset is not fetched for a glyph the codebase already renders in this role.

## Risks / Trade-offs

- **Removing PayPal removes a signal that it is coming** → it was a signal about the
  roadmap in the middle of a payment decision; the row records the frame's intent
- **The brand list changes what the page claims** → it now matches the design; if the
  gateway genuinely takes JCB, that is a data question and the list is in one place
- **`A5` closes on the line while `image 24` stays unread** → recorded on the row rather
  than guessed at

## Migration Plan

No data or API change. One commit; `git revert` restores the text labels and the placeholder.
