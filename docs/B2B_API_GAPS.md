# B2B API Gaps — `lms-b2b/v1` vs the legacy business dashboard

**Audience:** maintainers of `wp-lms-b2b-rest-api` (the headless facade).
**Date:** 2026-09-04
**Status:** **Closed.** All 13 clusters and defects D1–D9 landed across Tiers A, B and C
(2026-09-04), and the frontend consumes every route. Kept as the record of what was specified,
what was built, and where the implementation deliberately differs from the original proposal.

**Backend verified live** (`5639578`, 2026-09-04): contract 179/179, write suite clean, golden
capture 39 routes all 200, the three Tier C tables created by activation, and departments / saved
views / bulk import exercised end to end. Two defects only a live run could find were fixed there —
see "Found by running it" below. The **frontend has still not been exercised against a real site**.

---

## Why this document exists

The Next.js headless frontend renders the business dashboard at `/business-dashboard`. It reaches
WordPress only through its own BFF (`/api/business/*`), which proxies to the **`lms-b2b/v1`**
namespace served by `wp-lms-b2b-rest-api`.

The behavioural source of truth is the legacy React SPA in
`wplms-business-dashboard/src/business`, which talks to **`b2b-dashboard/v1`** and is served at
`https://lms-site.test/business-dashboard/`.

Comparing the two:

|                                                     | Routes         |
| --------------------------------------------------- | -------------- |
| `b2b-dashboard/v1` (legacy plugin, `includes/api/`) | 132            |
| `lms-b2b/v1` (facade, `src/Api/Controllers/`)       | 59 + 2 utility |
| Distinct endpoints the legacy SPA actually calls    | 92             |
| …of those, served by the facade today               | 55             |
| **…of those, missing from the facade**              | **37**         |

Those 37 gaps cluster into **11 features**. Six of them block an entire page of the dashboard.
Until they land, the Next.js port cannot reach parity — the frontend work is otherwise complete
or in progress.

## Design principles for the new routes

These are **not** copies of the `b2b-dashboard/v1` contracts. The facade is JWT-first and headless;
the legacy layer is cookie+nonce and assumes a browser inside wp-admin. Apply consistently:

1. **Envelope everything.** `{"success": true, "data": <payload>}` on success, `WP_Error` on
   failure. Today `/status` and `/health` return raw arrays — the only two exceptions; either
   envelope them or document them as deliberately raw.
2. **Pagination totals go in the body, never in headers.** The legacy
   `/reports/learner-courses`, `/activity` and `/certificate/register` return a bare array with
   `X-WP-Total` / `X-WP-TotalPages`. A BFF proxy has to special-case header forwarding for exactly
   three routes. Use the shape the rest of the facade already uses:
   `{ items: [...], total, pages, page, per_page }`.
3. **Declare every parameter in `args`.** Several existing facade routes read `page`, `per_page`,
   `search`, `status` straight off the request without declaring them, so they arrive
   un-defaulted and unvalidated. New routes must declare, type, default, bound and enum.
4. **No `per_page: -1`.** The legacy Overview and Reports landing pages fetch the entire team and
   assignment set unbounded. `per_page` is capped at 100 everywhere in the facade and should stay
   capped. Where the client needs a whole-population number, give it a **stats/aggregate endpoint**
   that returns counts, not rows.
5. **Correct HTTP verbs.** Legacy overloads `POST` for updates (`POST /departments/{id}`,
   `POST /team/{id}/archive`). Use `PATCH` for partial update, `PUT` for replace, `DELETE` for
   removal. Model state transitions as a field on the resource, not as an RPC sub-route.
6. **No implicit identity coercion.** `GET /businesses/{id}` currently resolves `{id}` as the
   owner's _user_ id, not the `b2b_businesses.id` it returned in `items[].id`. New routes must
   never silently reinterpret an identifier.
7. **`business_id` is optional and admin-only.** Every legacy controller scopes a manager to their
   own business and lets `manage_options` target another via `?business_id=`. Keep that shape.

For reference, the current machine-readable facade surface is
`wp-lms-b2b-rest-api/tests/contract/contract-test.php:62-120`. Note that `ARCHITECTURE.md`
("42 routes") and `docs/api-migration-tracking.md` are both stale.

---

## Found by running it (2026-09-04)

Three things a static check could not have caught, all fixed backend-side:

- **`Certificate_Controller::require_business_scope()` was private** and collided with the public
  method of the same name added to `Abstract_B2B_Controller` in Tier B — a PHP fatal on plugin
  load. Every file lints clean alone; the conflict only exists once both are loaded. Renamed to
  `require_certificate_scope()`.
- **`GET /team/stats` returned all zeros on every site.** The query joined `wp_usermeta` and tested
  `lm.meta_id`, but usermeta's primary key is `umeta_id` — `meta_id` belongs to postmeta and
  termmeta. MySQL rejected it, `get_row()` returned null, and the service turned that into a
  well-formed `{total: 0, …}`. A silent wrong answer rather than an error, and it rendered as
  "0 enrolled · 0 unassigned · 0 pending" on the Overview.
- **`POST /team/bulk` echoed the sanitised email** in an error row, so an invalid address came back
  as `""` and the CSV importer could not tell the user which cell was wrong. It now echoes what the
  client submitted.

The second is the one worth remembering: a query that fails and a population that is genuinely
empty produced identical output. Neither the contract test nor the golden capture would have
flagged it, because the response shape was correct throughout.

---

## Tier C — landed (2026-09-04)

The three clusters needing new tables. `b2b_departments` + `b2b_department_members`
(`B2B_Department_Schema`) and `b2b_saved_reports` (`B2B_Saved_Reports_Schema`), created on
activation and re-created idempotently on `init@26` so an upgrade that never re-activates still
gets them.

| Route                                                                  | Frontend consumer                                                                          |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `GET` / `POST /departments` · `PATCH` / `DELETE /departments/{id}`     | `DepartmentsSection` in Settings — tree with inline rename, reparent and confirmed removal |
| `GET` / `PUT /departments/members/{user_id}`                           | department checkboxes on the learner options rail                                          |
| `GET` / `POST /reports/saved` · `PATCH` / `DELETE /reports/saved/{id}` | `SavedViews` on the status report                                                          |
| `POST /team/bulk`                                                      | CSV import — one request replaces the per-row loop                                         |
| `department_id` on 8 existing routes                                   | learner list, status report, and the report/activity/certificate listings                  |

Backend decisions worth carrying forward:

- **Deleting a department detaches its members and reparents its children.** A department is a
  label; removing a label must not remove the people wearing it. The confirmation dialog says so
  explicitly.
- **`department_id` filters with `EXISTS`, never a `JOIN`**, in one shared fragment
  (`B2B_Department_Repository::membership_exists_sql()`). Membership is one row per learner per
  department, so a join would list and count a learner in two departments twice.
- **Saved-view `filters` is stored verbatim**, against the legacy whitelist. Under a whitelist, a
  dashboard that adds a filter has it silently discarded until the backend is taught about it —
  a failure with no error message. Only encoded size is bounded (16 KB). Accepted consequence: a
  `course_id` naming a deleted course stays in the view where legacy pruned it on read.
- **`POST /team/bulk` reports a created-but-unassigned row as `added` with a
  `no_licence_available` code**, not `skipped` — the learner exists, and calling it skipped would
  send a manager looking for someone already on the team. The importer surfaces those separately
  from genuine skips. Licence availability is deliberately not pre-checked, because an assignment
  can also be funded by a subscription seat.
- **Verbs are the honest ones**: `PATCH /departments/{id}` for a partial update, `PUT` on the
  membership route because it replaces the whole set.

Frontend note: the CSV importer's `dept` column is live again — it was parsed but discarded while
there was nowhere to send it. Department names are matched case-insensitively against the flat
list. Because the bulk route takes ids, the backend never sees an unmatched name — the importer
reports those itself in the results panel, per name with a row count. General rule: when the
client resolves human-entered values to ids before a bulk call, the client owns the not-found
reporting; the backend can only ever validate ids.

---

## Tier B — landed (2026-09-04)

Nine clusters that needed a service ported from `wplms-business-dashboard` but no new tables.

| Route                                              | Frontend consumer                                                             |
| -------------------------------------------------- | ----------------------------------------------------------------------------- |
| `GET` / `PATCH /settings` · `POST /settings/reset` | new `/business-dashboard/settings` page                                       |
| `POST /settings/onboarding`                        | new `OnboardingWizard`, gating the dashboard via `OnboardingGate`             |
| `GET /activity`                                    | `ActivityFeed` on the Overview                                                |
| `GET /reports/learner-courses`                     | new `/analytics/reports` — five status views, URL-driven filters, CSV export  |
| `GET /reports/matrix`                              | new `/analytics/matrix` — sticky-column grid, label/colour toggle, CSV export |
| `GET /reports/courses/options`                     | course `<select>` on the status report and certificate register               |
| `GET /team/stats`                                  | Overview Team KPI — replaced a one-page sample that had to be suppressed      |
| `POST /team/{id}/invite` · `/password-reset`       | learner options rail                                                          |
| `POST /courses/{id}/remind`                        | per-course Remind button on Assigned Courses                                  |
| `POST /courses/remind-behind`                      | "Remind all behind" on the Overview                                           |
| `GET /businesses/subscriptions/seat-roster`        | Assigned Learners table on Subscriptions                                      |
| `PATCH /team/{id}` widened                         | (name/email editing not yet surfaced)                                         |
| `/certificates` course + date filters              | certificate register filters                                                  |
| `/reports/summary` new fields                      | Reports landing KPIs                                                          |
| `/businesses/orders` new fields                    | invoice download, paid pill, billed-to                                        |

Backend decisions worth carrying forward:

- **Pagination totals moved into the body** on all three routes that used `X-WP-Total` headers, as
  this document asked. The BFF needs no header special-casing.
- **`learners` in the reminder result counts the population selected**, not the successes, so
  `learners: 0` means nobody was behind — distinct from every mail failing. The Overview branches on
  exactly that. Rate limiting is per action, not per business: the sweep allows one run per business
  per five minutes, and the per-course Remind button one run per course per five minutes. Both
  surface as a 429 the client renders as "try again in a few minutes". (They shared one key at
  first, which made reminding course A 429 course B.)
- **"Behind" is wider than the legacy rule, deliberately.** This document described legacy as
  _assigned, not completed, and either no progress or past an expected-pace threshold_. The
  implementation is **assigned and not completed** — no pace threshold. A course with no due date
  has no pace to be behind on, and inventing one would send mail nobody could act on. The practical
  consequence, which the Overview copy should reflect: **"Remind all behind" mails every learner who
  has not completed**, including one who started yesterday.
- **`/reports/summary` adds `enrolments_completed` rather than overwriting `total_completed`.** The
  two count different things — the shipped field reads the stored status column and is not pass-mark
  aware. The Reports landing uses the new one; nothing that consumed the old one changed meaning.
- **`wp_login` now stamps `b2b_last_login`.** Without it "has never signed in" is unanswerable. Note
  every member who has not signed in since that release reads as `pending` until they do — expected,
  and it resolves itself.
- **No `/team/{id}/archive` or `/restore`**, as recommended here; both are `PATCH /team/{id}`.

Superseded by the implementation:

- `POST /settings` in cluster 1 is **`PATCH /settings`** — it is a partial update.
- Cluster 4's `GET /reports/matrix` is joined by **`GET /reports/courses/options`**, the cheap
  `[{course_id, title}]` list this document suggested as an alternative to pulling the whole grid
  just to fill a `<select>`. Two pages use it.

Frontend note: `partitionLearners` was deleted when `GET /team/stats` landed. Keeping a client-side
version would have been a second, divergent definition of "enrolled" that could only ever see one
page.

---

## Tier A — landed (2026-09-04)

Implemented in `wp-lms-b2b-rest-api` and wired in the frontend.

| Route                                                                               | Frontend consumer                                        |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `POST` / `DELETE /businesses/{business_id}/logo`                                    | `BusinessLogo` on `/profile`                             |
| `GET /courses/{course_id}/learner/{user_id}/quiz-scores`                            | `QuizScoresDialog` on `/certificates/[courseId]`         |
| `GET /certificates/{user_id}/{course_id}` · `DELETE /certificates/{certificate_id}` | not yet consumed                                         |
| `POST /licences/assign` · `POST /licences/revoke`                                   | Revoke action on `/learners/assignments`                 |
| `GET /businesses/subscriptions/active`                                              | Overview renewal date; replaced a capped client-side sum |
| `GET /course-categories`                                                            | Category filter on the catalogue                         |
| `GET /courses` — `orderby` + `taxonomy` args                                        | Sort + category filter on the catalogue                  |

Defects **D1–D9** all resolved (D9 turned out to be already fixed). Four things were resolved
differently from this document's first suggestion. Each is correct; the clusters below are
superseded accordingly.

- **D6** — the path variable was renamed `{id}` → `{owner_user_id}` rather than changing which id
  the route accepts. URL and payload unchanged. This surfaced a **live frontend bug**: the profile
  page passed `Business.id` (the `b2b_businesses` row id) into a segment that has always been read
  as the owner's user id, so saves targeted the wrong record. Fixed on the client.
- **D8** — `/status` and `/health` stay un-enveloped, now documented as the two deliberate
  exceptions. Enveloping them would break probes already parsing them.
- **quiz-scores** returns no `passed` or `attempted_at`. WPLMS stores marks as post meta keyed by
  user id and records neither a per-quiz pass mark nor an attempt date, so those fields would have
  been invented. Pass/fail is the overall `percentage` against the business passing mark.
  **Supersedes the shape proposed in cluster 8.**
- **Single certificate** returns the nested list-item shape (`{id, course:{}, user:{}, …}`), not the
  flat shape proposed in cluster 8 — `/certificates` is frozen, and two shapes for one resource is
  the exact problem this document complains about elsewhere. The frontend flattens both through one
  mapper in `business-dashboard.ts`.
- **`orderby` has no default.** The service reads an absent `orderby` as `menu_order DESC, date
DESC`; defaulting to `newest` would silently re-sort every existing caller. Cluster 12's
  "default `newest`" is withdrawn — the client sends no `orderby` for its "Default order" option.

Bugs found and fixed en route, worth knowing about downstream:

- `GET /courses` ignored `per_page` and `search` entirely (the service read `posts_per_page` / `s`).
- A category filter was silently overwritten by the excluded-category `tax_query`; now merged.
- `/reports/certificates` counted rows with a query that had no joins while the item query did, so
  `total` could exceed the rows returned. Now consistent — **`total` may drop** on data with
  orphaned course or user rows.
- That report's cache key ignored its filters.

Newly enforced, and able to 400 what previously passed: `per_page` bounded 1–100 on the course,
manager and subscription listings; `status` enums on the manager routes; `industry` / `status`
enums and `email` format on `PATCH /businesses/{owner_user_id}`. Checked against the frontend — no
call site exceeds these bounds.

**Not verified live.** Everything lints and a static check confirms every contract-test path is
registered, but the suites could not be run: `~/Sites/tx-local-site` loads the main checkout, not
the Tier A worktree. Write-path integration tests for the three new mutations (logo, licence
assign/revoke, certificate delete) are outstanding.

---

## Cluster index

| #                                  | Cluster                 | Missing                                        | Blocks |
| ---------------------------------- | ----------------------- | ---------------------------------------------- | ------ |
| [1](#1--business-settings)         | Business settings       | ✅ done `/settings` page                       |
| [2](#2--onboarding)                | Onboarding              | ✅ done First-run wizard                       |
| [3](#3--departments)               | Departments             | ✅ done Departments UI, every learner filter   |
| [4](#4--reporting-depth)           | Reporting depth         | ✅ done                                        |
| [5](#5--activity-feed)             | Activity feed           | ✅ done Overview activity feed                 |
| [6](#6--learner-lifecycle)         | Learner lifecycle       | ✅ done                                        |
| [7](#7--reminders)                 | Reminders               | ✅ done "Remind all behind", per-course remind |
| [8](#8--certificates)              | Certificates            | ✅ done                                        |
| [9](#9--business-identity)         | Business identity       | ✅ done Logo upload on `/profile`              |
| [10](#10--licence-pool-operations) | Licence pool operations | ✅ done Direct pool assign/revoke              |
| [11](#11--subscriptions)           | Subscriptions           | ✅ done                                        |
| [12](#12--course-catalogue)        | Course catalogue        | ✅ done Catalogue sort + category filter       |
| [13](#13--orders)                  | Orders                  | ✅ done Invoice download                       |

---

## 1 — Business settings

Legacy: `includes/api/class-b2b-settings-controller.php`, service
`includes/services/class-b2b-settings-service.php`.
Blocks: the entire `/settings` page (appearance, passing mark, certificate download control,
security + integrations toggles, reset).

### `GET /lms-b2b/v1/settings`

|            |                                                        |
| ---------- | ------------------------------------------------------ |
| Permission | `manage_team`; `manage_options` may pass `business_id` |
| Args       | `business_id` _(int, optional, admin-only)_            |

Response `data`:

```jsonc
{
  "business_id": 12,
  "passing_mark": 80, // int, 50–100
  "certificate_self_download": true, // bool
  "certificate_self_download_locked": true, // bool, read-only; true once turned off
  "email_certificate_on_completion": true, // bool
  "onboarding_complete": true, // bool
  "platform_subdomain": "acme", // string
  "mfa_enabled": false, // bool — stored, inert
  "integration_slack": false, // bool — stored, inert
  "integration_teams": false, // bool — stored, inert
  "integration_genai": false, // bool — stored, inert
  "company_name": "Acme Ltd", // from the business row, not the settings JSON
  "company_size": 120, // from the business row
}
```

`certificate_self_download` is a **one-way switch**: once disabled it can never be re-enabled, and
the payload must expose `certificate_self_download_locked` so the UI can render the "Locked" chip
instead of an editable toggle. The legacy service enforces this; the facade must not weaken it.

To be precise about what throws the switch, because the first implementation got this backwards:
the lock is keyed on the **value**, not on `onboarding_complete`. `locked` is true once the value is
`false`. A tenant that finished onboarding with self-download still enabled can disable it later,
once; a tenant that has disabled it cannot re-enable it. Site administrators (`manage_options`) are
exempt — the decision is permanent for the tenant, not for the platform owner. Inside the onboarding
wizard the field is freely writable in both directions, since nothing is committed until the wizard
finishes.

### `PATCH /lms-b2b/v1/settings`

Legacy is `POST /settings` (`WP_REST_Server::EDITABLE`). Use `PATCH` — this is a partial update.

Args (all optional; only keys present are written):
`passing_mark` _(int 50–100)_, `certificate_self_download` _(bool)_,
`email_certificate_on_completion` _(bool)_, `platform_subdomain` _(string)_, `mfa_enabled` _(bool)_,
`integration_slack` _(bool)_, `integration_teams` _(bool)_, `integration_genai` _(bool)_,
`company_name` _(string)_, `company_size` _(int)_, `business_id` _(int, admin-only)_.

Response: the full `GET /settings` payload. Validation must be **all-or-nothing** — the legacy
service validates the profile half and the settings half before writing either, so a request that
fails on the pass mark has not already renamed the company. Preserve that.

Errors: `rest_not_logged_in`/401, `rest_forbidden`/403, `invalid_passing_mark`/400.

### `POST /lms-b2b/v1/settings/reset`

Args: `business_id` _(int, admin-only)_. Restores defaults and sets `onboarding_complete: false`
so the wizard reopens. **Only the settings record is rewritten** — learners, assignments and issued
certificates are untouched. Response: the full settings payload.

---

## 2 — Onboarding

### `POST /lms-b2b/v1/settings/onboarding`

Blocks: the 6-step first-run wizard (`components/onboarding/OnboardingWizard.tsx`), which gates the
entire dashboard when `onboarding_complete === false`.

Args: everything `PATCH /settings` accepts, plus `display_name` _(string)_ — the wizard also sets
the current user's display name.

One request writes the business fields, the settings, **and** the onboarding flag, in that order.
Nothing is persisted until this call, so abandoning the wizard leaves the tenant untouched. Note
the ordering matters: `certificate_self_download` is still writable here because the lock only
engages once `onboarding_complete` is set.

Response: the full settings payload.

---

## 3 — Departments

Legacy: `includes/api/class-b2b-departments-controller.php`, tables `b2b_departments` and
`b2b_department_members`.
Blocks: Settings › Departments (full tree CRUD), the department filter on the Learners table, the
Overview filter panel, the Assign Course drawer, and Add Learner.

Departments are a **tree** (`parent_id`), scoped per business, with many-to-many membership.

### `GET /lms-b2b/v1/departments`

Args: `business_id` _(int, admin-only)_.

```jsonc
{
  "departments": [
    {
      "id": 3,
      "name": "Engineering",
      "parent_id": 0,
      "children": [{ "id": 7, "name": "Platform", "parent_id": 3, "children": [] }],
    },
  ],
  "flat": [{ "id": 3, "name": "Engineering", "parent_id": 0, "member_count": 41 }],
}
```

Return both shapes in one call, as legacy does — the tree drives the Settings UI, the flat list
drives every `<select>`.

### `POST /lms-b2b/v1/departments`

Args: `name` _(string, required)_, `parent_id` _(int, optional, default 0)_, `business_id`
_(admin-only)_. → the created department. Errors: `duplicate_name`/409, `invalid_parent`/400
(parent must belong to the same business), `max_depth`/400 if you enforce one.

### `PATCH /lms-b2b/v1/departments/{id}`

Legacy is `POST /departments/{id}`. Args: `name` _(string)_, `parent_id` _(int)_ — rename and
reparent. Must reject a `parent_id` that would create a cycle. → the updated department.

### `DELETE /lms-b2b/v1/departments/{id}`

→ `{ "deleted": true }`. **Members are detached, not deleted** — the legacy confirmation dialog
promises this explicitly. Decide and document what happens to child departments (legacy reparents
to the deleted node's parent).

### `GET /lms-b2b/v1/departments/members/{user_id}`

→ `{ "departments": [ { "id": 3, "name": "Engineering" } ] }`

### `PUT /lms-b2b/v1/departments/members/{user_id}`

Legacy is `POST`. This **replaces** the whole membership set, so `PUT` is the honest verb.
Args: `department_ids` _(array of int, required — empty array clears all)_.
→ the same shape as the `GET`. Must reject ids belonging to another business.

### Filter parameter to add across existing routes

Once departments exist, add `department_id` _(int, optional)_ to:

- `GET /team`
- `GET /courses/{id}/available-learners`
- `GET /reports/certificates`
- `GET /reports/learner-courses` _(cluster 4)_
- `GET /reports/matrix` _(cluster 4)_
- `GET /activity` _(cluster 5)_
- `POST /courses/remind-behind` _(cluster 7)_

Filter with `EXISTS`, not a `JOIN` — membership is one row per learner per department and a join
multiplies the result set. The legacy activity controller documents this exact trap.

---

## 4 — Reporting depth

Legacy: `includes/api/class-b2b-reports-controller.php` (1035 lines) and
`class-b2b-saved-reports-controller.php`.
Blocks: `/analytics?report=…` (five status views), `/analytics/matrix` (Training Matrix), Saved
Views, the Trainee Spreadsheet and Training Record CSV exports, and the Overview course roster.

This is the **single largest gap**. The facade has `/reports/{summary,courses,members,certificates}`
— four coarse aggregates. The legacy dashboard is built on two fine-grained endpoints the facade
does not have at all.

### `GET /lms-b2b/v1/reports/learner-courses`

The flat learner × course row set behind all five status reports, the Overview roster, and both
CSV exports.

| Arg             | Type                                                                   | Notes                                                           |
| --------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `page`          | int, default 1, min 1                                                  |                                                                 |
| `per_page`      | int, default 10, 1–100                                                 |                                                                 |
| `search`        | string                                                                 | matches learner name **or** email                               |
| `status`        | enum `all\|completed\|in_progress\|not_started\|failed`, default `all` | derived, not stored                                             |
| `course_id`     | int                                                                    |                                                                 |
| `learner_id`    | int                                                                    |                                                                 |
| `department_id` | int                                                                    | _(cluster 3)_                                                   |
| `pass_mark`     | int 0–100, **no default**                                              | omitted ⇒ fall back to the business's configured `passing_mark` |
| `business_id`   | int, admin-only                                                        |                                                                 |

`pass_mark` deliberately has no default: declaring `80` would make "omitted" indistinguishable from
an explicit 80, and the fallback to the tenant's setting is the whole point.

**Response — change from legacy.** Legacy returns a bare array with `X-WP-Total` headers. Return
the standard envelope instead:

```jsonc
{
  "items": [
    {
      "learner_id": 42,
      "learner_name": "Jane Doe",
      "learner_email": "jane@acme.test",
      "course_id": 900,
      "course_title": "Fire Safety",
      "status": "completed", // completed | in_progress | not_started | failed
      "progress": 100, // int 0–100; forced to 100 when completed
      "score": 87, // int|null — quiz percentage
      "completion_date": "2026-08-01T10:00:00+00:00", // RFC3339|null
      "enrolled_at": "2026-07-01T09:00:00+00:00", // RFC3339|null
      "last_accessed": "2026-08-01T09:40:00+00:00", // RFC3339|null
    },
  ],
  "total": 137,
  "pages": 14,
  "page": 1,
  "per_page": 10,
  "pass_mark": 80, // echo the effective pass mark back
}
```

**Status derivation** (must match legacy exactly, or the two dashboards disagree):
`completed` if there is a completion date; else `in_progress` if progress > 0; else `not_started`.
Then a `completed` row **downgrades to `failed`** when a score exists and is below `pass_mark`.
Echoing `pass_mark` back matters because the client renders "at or above N% counts as passed".

Note the legacy implementation filters and paginates **in PHP** after loading the whole record set.
At scale that is a problem — push `status`, `search` and pagination into SQL in the facade.

### `GET /lms-b2b/v1/reports/matrix`

The whole learner × course compliance grid in one call. Not paginated (it is a grid).

Args: `pass_mark`, `course_id`, `learner_id`, `department_id`, `business_id` — same semantics as
above, no pagination args.

```jsonc
{
  "pass_mark": 80,
  "learners": [{ "id": 42, "name": "Jane Doe", "email": "jane@acme.test" }],
  "courses": [{ "course_id": 900, "title": "Fire Safety" }],
  "cells": [
    /* same row shape as /reports/learner-courses items */
  ],
  "course_totals": [{ "course_id": 900, "enrolled": 40, "completed": 31, "completion_rate": 78 }],
}
```

`cells` is sparse — a learner with no assignment for a course simply has no cell. The client
renders those as "not enrolled". `completion_rate` is an integer percent, rounded.

The frontend also uses this endpoint purely to populate course `<select>` options on two other
pages. If the grid is expensive, consider a cheap `GET /reports/courses/options` returning just
`[{course_id, title}]`, so those pages stop paying for the full matrix.

### `GET /lms-b2b/v1/reports/saved` · `POST` · `PATCH /{id}` · `DELETE /{id}`

Saved filter sets, **shared per business** (not per user) — a manager saves "Overdue fire safety"
and every manager on the tenant sees it.

- `GET` — args `report_type` _(string, default `learner-courses`)_, `business_id`.
  → `{ "saved_reports": [ { "id", "name", "report_type", "filters": {…}, "created_at", "created_by" } ] }`
- `POST` — args `name` _(string, required)_, `filters` _(object, default `{}`)_, `report_type`.
  → the created record.
- `PATCH /{id}` — args `name` _(string)_, `filters` _(object)_. → the updated record.
- `DELETE /{id}` — → `{ "deleted": true }`.

`filters` is an opaque JSON blob owned by the client (currently `{report, course_id, learner_id,
search, per_page}`). Store and return it verbatim; do not validate its interior.

### Extend `GET /reports/certificates`

Add `course_id`, `learner_id`, `department_id`, `date_from`, `date_to` _(ISO date strings)_.
Today it accepts only `page` and `per_page` — the controller declares `search`, `status`, `orderby`
and `order` in `collection_args()` but **passes only `page` and `per_page` through** to the service.
That is a live bug, not just a gap.

### Extend `GET /reports/summary`

Currently returns `{total_courses, total_members, total_certificates, total_active,
total_completed}`. The legacy Reports landing needs two more:

```jsonc
{ "total_enrolments": 412, "total_completed": 310, "total_in_progress": 74, "compliance_rate": 75 } // int percent = completed / enrolments
```

Add `total_in_progress` and `compliance_rate` alongside the existing keys (do not rename the
existing ones — the facade already has consumers).

---

## 5 — Activity feed

Legacy: `includes/api/class-b2b-activity-controller.php`.
Blocks: the Overview "Recent activity" feed.

### `GET /lms-b2b/v1/activity`

| Arg             | Type                         |
| --------------- | ---------------------------- |
| `page`          | int, default 1, min 1        |
| `per_page`      | int, default 10, 1–50        |
| `course_id`     | int, default 0               |
| `learner_id`    | int, default 0               |
| `department_id` | int, default 0 _(cluster 3)_ |
| `business_id`   | int, admin-only              |

The filters exist because the Overview filters every section at once — an unfiltered feed sitting
under filtered KPI numbers is a feed that contradicts them.

**Response — change from legacy** (legacy returns a bare array + `X-WP-Total`):

```jsonc
{
  "items": [
    {
      "learner_id": 42,
      "learner_name": "Jane Doe",
      "course_id": 900,
      "course_title": "Fire Safety",
      "type": "completed", // completed | progress
      "progress": 100, // forced to 100 when completed
      "event_time": "2026-08-01T10:00:00+00:00", // RFC3339
    },
  ],
  "total": 210,
  "pages": 21,
  "page": 1,
  "per_page": 10,
}
```

An assignment produces an event once the learner has done anything: `completion_date` set →
`completed`, else `progress > 0` → `progress`. Order by event time descending.

Carry over the legacy `EXISTS` guard on the user row: an assignment whose learner was deleted must
produce **no** event. Without it the feed renders "Unknown learner completed …" — a line naming
nobody, which also makes the feed disagree with the counts above it.

---

## 6 — Learner lifecycle

Legacy: `includes/api/class-b2b-team-controller.php`.
Blocks: the learner profile options rail, CSV bulk import, and the Overview Team KPI breakdown.

### `POST /lms-b2b/v1/team/{id}/invite`

Sends the login invitation. Args: `id` _(int)_. → `{ "sent": true, "email": "jane@acme.test", "action": "invite" }`.

### `POST /lms-b2b/v1/team/{id}/password-reset`

→ same shape with `"action": "password-reset"`.

Both ride core `retrieve_password()` — one mail path, no custom tokens, and **no credentials in any
response**. An invitation leaves the member `pending` until they first sign in.
Errors: `account_email_failed`/500.

### Archive / restore — do **not** add sub-routes

Legacy has `POST /team/{id}/archive` and `POST /team/{id}/restore`. Both are just
`status = inactive|active`. The facade already has `PATCH /team/{id}` with a `status` enum of
`active|inactive` — that is sufficient and is the correct modelling. **No new routes needed here;**
this is noted so the two APIs are not accidentally made symmetric.

### Widen `PATCH /lms-b2b/v1/team/{id}`

Today `status` is the only accepted field (`active|inactive`, required). The learner profile's
"Edit details" dialog also changes name and email. Add, all optional:

`first_name` _(string)_, `last_name` _(string)_, `email` _(string, format `email`)_,
`role` _(enum `learner|manager`)_ — and make `status` optional. Reject an empty body with
`no_fields`/400. Changing `email` must check uniqueness across WP users and return
`email_exists`/409.

### `POST /lms-b2b/v1/team/bulk`

New. The CSV import currently runs **one `POST /team` per row from the browser** — the legacy code
carries an explicit `// TODO: replace with POST /team/bulk`. A 500-row import is 500 round trips
that partially succeeds when a connection drops and can report no honest total.

```jsonc
// request
{ "members": [ { "email": "a@x.test", "first_name": "A", "last_name": "One",
                 "department_ids": [3], "course_ids": [900] } ],   // max 500
  "business_id": 12 }

// response — 207-style per-row result, HTTP 200
{ "added": 480, "skipped": 20,
  "results": [ { "row": 0, "email": "a@x.test", "status": "added", "user_id": 55 },
               { "row": 1, "email": "b@x.test", "status": "skipped",
                 "code": "already_member", "message": "Already on this team" } ] }
```

Per-row `code` values the client renders distinctly: `already_member`, `invalid_email`,
`no_licence_available`, `department_not_found`. The whole request must not fail because one row is
bad. Wrap each row in its own transaction.

### Extend `GET /lms-b2b/v1/team`

Add `role` _(enum `learner|manager|all`, default `all`)_ and `department_id` _(int)_ _(cluster 3)_.
The legacy SPA also passes `for_subscription_assignment=1` to exclude learners who already hold a
subscription seat — either add that flag or express it as `has_subscription` _(bool)_.

### `GET /lms-b2b/v1/team/stats`

New. The Overview "Team Overview" KPI partitions the team into
**enrolled / unassigned / pending / archived**. Legacy computes this client-side from
`GET /team?per_page=-1`, which the facade rightly refuses to serve.

```jsonc
{ "total": 412, "enrolled": 300, "unassigned": 80, "pending": 22, "archived": 10 }
```

Definitions, matching the legacy `deriveLearnerStatus` rule: `archived` = `status === 'inactive'`;
`pending` = active with no `last_login`; `enrolled` = active with ≥1 course assignment;
`unassigned` = active, has logged in, no assignment. Args: `business_id`, `department_id`.

`department_id` was missed on the first pass and landed 2026-09-06. Without it the KPI card
described a different population than the department-filtered table beside it — the contradiction
cluster 5 warns about.

---

## 7 — Reminders

Legacy: `includes/api/class-b2b-course-controller.php`.
Blocks: the Overview "Remind all behind" bulk action and the per-course Remind button on
Assigned Courses.

### `POST /lms-b2b/v1/courses/{id}/remind`

Emails every learner on that course who is behind. Args: `id` _(int, required)_,
`business_id` _(admin-only)_.
→ `{ "course_id": 900, "sent": 12, "failed": 1 }`

### `POST /lms-b2b/v1/courses/remind-behind`

The sweep. Args: `course_id` _(int, optional)_, `department_id` _(int, optional)_,
`learner_id` _(int, optional)_, `business_id` _(admin-only)_ — the Overview passes whatever filters
are active.
→ `{ "sent": 47, "failed": 2, "learners": 49, "courses": 6 }`

Deliberately a **server-side pass**, not the client looping the per-course route: a client loop
partially succeeds when a connection drops and can report no honest total. The client uses the
returned counts to distinguish "nobody was behind" (`learners: 0`) from "all failed"
(`sent: 0, failed: n`) from a partial success — so all four counts must be accurate, not estimated.

Define and document the "behind" rule (legacy: assigned, not completed, and either no progress or
past an expected-pace threshold). Rate-limit or queue this — it can send hundreds of emails.

---

## 8 — Certificates

Legacy: `includes/api/class-b2b-certificate-controller.php`.
Blocks: the certificate register's course and date filters, and per-course learner quiz scores.

### Extend `GET /lms-b2b/v1/certificates`

The facade route exists and is the right shape. Add `course_id` _(int)_, `learner_id` _(int)_,
`date_from` _(ISO date)_, `date_to` _(ISO date)_, `department_id` _(int)_.

Ensure each item carries what the register table renders:

```jsonc
{
  "certificate_id": "900_42",
  "user_id": 42,
  "user_name": "Jane Doe",
  "user_email": "jane@acme.test",
  "course_id": 900,
  "course_name": "Fire Safety",
  "issued_date": "2026-08-01T10:00:00+00:00",
  "certificate_url": "https://…/cert.pdf",
  "status": "active",
}
```

`certificate_url` must be present for the download/preview actions to work at all.

### `GET /lms-b2b/v1/certificates/{user_id}/{course_id}`

Fetch one certificate. Legacy is `GET /certificate/get?user_id=&course_id=` — a query-param read of
a specific resource. → the item shape above, or 404 `certificate_not_found`.

### `DELETE /lms-b2b/v1/certificates/{certificate_id}`

Legacy is `POST /certificate/delete`. → `{ "deleted": true }`. Gate on `manage_team`.

### `GET /lms-b2b/v1/courses/{course_id}/learner/{user_id}/quiz-scores`

→ `{ "quiz_scores": [ { "quiz_id", "quiz_name", "score", "percentage", "passed": bool,
"attempted_at" } ], "percentage": 87 }`

Used by the per-course certificate learners table to show the Score column and to decide whether
the Generate button is enabled. Today the facade's `/courses/{id}/learners` returns a `quiz_scores`
field on some rows and not others — worth confirming which is authoritative.

### Naming note

The facade currently mixes `/certificates` (plural, list) with `/certificate/generate` (singular).
Move generate to `POST /certificates/generate` and keep the old path as an alias for one release.

**Landed 2026-09-06.** `POST /lms-b2b/v1/certificates/generate` is the canonical path;
`/certificate/generate` is registered as an alias against the same callback and the same arg
schema, and should be dropped one release after the frontend stops calling it.

---

## 9 — Business identity

### `POST /lms-b2b/v1/businesses/{id}/logo`

`multipart/form-data`, field `file`. → `{ "logo_id": 3312, "logo_url": "https://…/logo.png" }`
Validate MIME (`image/png|jpeg|svg+xml|webp`) and cap size. Blocks the logo control on `/profile`.

### `DELETE /lms-b2b/v1/businesses/{id}/logo`

→ `{ "deleted": true }`. Detach the attachment; deleting the media item itself is optional but
should be documented either way.

Note `API_REFERENCE.md` in the frontend repo already documents both of these as existing. They do
not exist in `lms-b2b/v1`. The frontend removed its `businessLogo` endpoint constant in `366bf53`
for exactly this reason.

### Fix — `GET /businesses/{id}` reinterprets `{id}`

`Business_Controller.php:182` resolves `{id}` via `get_business_by_user_id($id)` — so the `id` it
returned in `GET /businesses` → `items[].id` is **not** the id this route accepts. It is documented
in-code as "frozen legacy behaviour", but it is a live trap for any new client.

Either accept the business row id (correct) and add `GET /businesses/by-owner/{user_id}` for the
old behaviour, or rename the route parameter to `{owner_user_id}` so the contract stops lying.

### Fix — `PATCH /businesses/{id}` declares no body args

Only `id` is declared. `company_name`, `business_email`, `phone`, `address`, `tax_id`, `industry`,
`company_size`, `status` are read straight off the request and hand-sanitized in
`prepare_update_data()`. Declare them so WP validates types and the route is self-describing.
`status` must stay admin-only. `industry` should carry an `enum` — the frontend renders an
8-option `<select>` and a free string breaks its label map.

---

## 10 — Licence pool operations

Legacy: `includes/api/class-b2b-licence-controller.php`.

### `POST /lms-b2b/v1/licences/assign`

Args: `course_id` _(int, required)_, `user_ids` _(array of int, required)_.
→ `{ "assigned": 4, "failed": 0, "assignments": [ { "assignment_id", "user_id", "pool_id" } ] }`
Errors: `no_licence_available`/409.

### `POST /lms-b2b/v1/licences/revoke`

Args: `assignment_id` _(int, required)_.
→ `{ "revoked": true, "message": "Licence returned to pool" }`

These sit alongside `POST /courses/assign` (which the facade has). `courses/assign` consumes a
licence implicitly; `licences/assign` and `licences/revoke` operate on the pool directly and are
what lets a manager reclaim a seat. Without `revoke` a licence spent on the wrong learner is
unrecoverable through the UI.

**Explicitly out of scope for the headless frontend** (admin-only, wp-admin serves them):
`/licences/pools/{id}/status`, `/licences/admin/settings`, `/licences/admin/tiers*`,
`/licences/admin/pools`, and the whole `b2b-dashboard/v1/admin/*` namespace.

---

## 11 — Subscriptions

### `GET /lms-b2b/v1/businesses/subscriptions/seat-roster`

Blocks the Subscriptions › **Assigned Learners** tab (one of four tabs; the other three work).

Args: `page` _(int, default 1)_, `per_page` _(int, default 10, 1–100)_, `search` _(string)_,
`status` _(enum `assigned|available|suspended|revoked|all`, default `all`)_.

```jsonc
{
  "items": [
    {
      "seat_id": 88,
      "subscription_id": 41,
      "plan_type": "yearly",
      "user_id": 42,
      "user_name": "Jane Doe",
      "user_email": "jane@acme.test",
      "status": "assigned",
      "assigned_at": "2026-07-01T09:00:00+00:00",
      "expires_at": "2027-07-01T09:00:00+00:00",
    },
  ],
  "total": 58,
  "pages": 6,
  "page": 1,
  "per_page": 10,
}
```

This is the seat roster **across all** of the business's subscriptions. The facade has
`GET /businesses/subscriptions/{id}/seats` (per-subscription), which cannot answer "show me every
seated learner" without N calls.

### `GET /lms-b2b/v1/businesses/subscriptions/active`

→ the single aggregated active subscription, or `null`:

```jsonc
{
  "subscription_id": 41,
  "plan_type": "yearly",
  "status": "active",
  "total_seats": 60,
  "assigned_seats": 47,
  "available_seats": 13,
  "next_payment": "2027-07-01T00:00:00+00:00",
}
```

The frontend currently derives this client-side by fetching `?per_page=50` and summing active
non-lifetime rows — correct only while the tenant has fewer than 50 subscriptions. Needed for the
Overview "renewal date" line.

### Not needed

`GET /business/check-learner-subscription` (singular) has no consumer — the bulk
`POST /business/check-learners-subscriptions` already in the facade covers it. Likewise
`/businesses/subscriptions/learner`, `/learners`, `/{id}/assign` and `/analytics` are called by no
live page. Do not port them.

---

## 12 — Course catalogue

### Extend `GET /lms-b2b/v1/courses`

The facade accepts `page`, `per_page`, `search`, `status`. The legacy catalogue also needs:

- `orderby` — enum `newest|popular|rated|alphabetical`, default `newest`. The enum values must
  match exactly; the legacy PHP `add_ordering()` keys off these strings.
- `taxonomy` — array of `course-cat` term ids to filter by.
- `meta` — array of meta filters _(legacy passes this; confirm whether any live UI uses it before
  implementing)_.

Without `orderby` and `taxonomy` the catalogue page has no sort control and no category filter.

### `GET /lms-b2b/v1/course-categories`

New. Today the legacy SPA bypasses the plugin entirely and pages `/wp/v2/course-cat` — up to 20
requests of 100 terms each — then filters out excluded ids client-side. The headless frontend
should not have to hit two namespaces and re-implement that.

```jsonc
{
  "categories": [
    { "id": 12, "name": "Health & Safety", "slug": "health-safety", "parent": 0, "count": 34 },
  ],
}
```

Apply the `b2b_excluded_course_categories` exclusion **server-side** and return counts already
reflecting it, so the client's numbers match its list.

---

## 13 — Orders

### Extend `GET /lms-b2b/v1/businesses/orders` item shape

The facade returns `{order_id, order_number, date, status, total, currency, items_count,
items_summary, payment_method, view_url}`. Legacy also returns, and the Billing page renders:

- `invoice_url` _(string|null)_ — the invoice PDF; the Download action is hidden when null.
- `is_paid` _(bool)_ — drives the paid/pending pill independently of WC status strings.
- `billing_name` _(string)_ — the Name column.

---

## Contract defects in routes that already exist

Independent of the gaps above. Each is reachable today.

| #   | Route                                          | Defect                                                                                                                                                                                                   | Impact                                                                                                     |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| D1  | `POST /licences/pricing/calculate`             | Returns `{"success": true, "data": {"status": 0, "message": "No items provided."}}` at **HTTP 400** on empty `items` (`Licence_Controller.php:200-210`, marked as a deliberately preserved legacy quirk) | A client branching on `success` treats a 400 as a success                                                  |
| D2  | `PUT /managers/{id}/status`                    | `status` declared as a bare `string`; the legacy route enforced `enum: active\|inactive`                                                                                                                 | Arbitrary strings reach `set_status()`                                                                     |
| D3  | `GET /managers`, `GET /managers/business/{id}` | `page`, `per_page`, `status`, `search` read but **not declared in `args`**                                                                                                                               | No defaults, no validation; the service must cope with `null`                                              |
| D4  | `GET /businesses/subscriptions`, `…/assigned`  | Same — `page`, `per_page`, `search` undeclared                                                                                                                                                           | Same                                                                                                       |
| D5  | `PATCH /businesses/{id}`                       | Body fields undeclared _(see cluster 9)_                                                                                                                                                                 | No WP-level sanitization                                                                                   |
| D6  | `GET /businesses/{id}`                         | `{id}` treated as owner user id _(see cluster 9)_                                                                                                                                                        | Round-tripping an id from `GET /businesses` fails                                                          |
| D7  | `GET /reports/certificates`                    | Declares `search`/`status`/`orderby`/`order` but forwards only `page`/`per_page`                                                                                                                         | Declared filters silently do nothing                                                                       |
| D8  | `GET /status`, `GET /health`                   | Not enveloped, unlike every other route                                                                                                                                                                  | Client needs a special case for two routes                                                                 |
| D9  | `GET /managers/business/{business_id}`         | Returns `pages` but no `total`                                                                                                                                                                           | Pagination UI cannot show "N of M" — the frontend renders `showSummary={false}` purely to work around this |

---

## Suggested delivery order

Sequenced by how much frontend it unblocks per unit of backend work.

| Phase | Clusters                                                           | Unblocks                                                                                           |
| ----- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **1** | 4 (`/reports/learner-courses`, `/reports/matrix`), 5 (`/activity`) | Status Reports, Training Matrix, CSV exports, Overview activity feed — the largest missing surface |
| **2** | 1, 2 (settings + onboarding)                                       | The `/settings` page and first-run wizard — currently no Next.js equivalent exists                 |
| **3** | 3 (departments) + the `department_id` filters                      | Departments UI and the filter controls on five existing pages                                      |
| **4** | 6 (learner lifecycle), 7 (reminders)                               | Learner profile rail, honest CSV import, Overview bulk remind                                      |
| **5** | 8, 9, 11, 13                                                       | Certificate register filters, logo upload, seat roster, invoice download                           |
| **6** | 10, 12 + defects D1–D9                                             | Pool assign/revoke, catalogue sort/filter, contract hygiene                                        |

Phases 1 and 2 together close roughly 70% of the parity gap by page count.

---

## Cross-checking this document

- Facade surface: `wp-lms-b2b-rest-api/tests/contract/contract-test.php:62-120`
- Recorded response fixtures: `wp-lms-b2b-rest-api/tests/golden/fixtures/*.json`
- Legacy route registrations: `wplms-business-dashboard/includes/api/class-b2b-*-controller.php`
- Legacy client, the definitive list of what the UI calls:
  `wplms-business-dashboard/src/business/services/api.ts`
- Frontend consumer: `src/lib/services/business-dashboard.ts` and `src/app/api/business/**` in the
  Next.js repo

`ARCHITECTURE.md` ("42 routes") and `docs/api-migration-tracking.md` ("135 legacy routes") in
`wp-lms-b2b-rest-api` are both stale and should not be used as a baseline.
