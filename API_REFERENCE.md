# LMS Backend REST API Reference

> **Source:** Extracted from the `lms-backend-rest-api` WordPress plugin
> **Namespace:** `lms-backend/v1`
> **Base URL:** `https://<your-domain>/wp-json/lms-backend/v1`

---

## Response Format

All responses are wrapped in a standard envelope:

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated Success

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "per_page": 10,
    "totalPages": 10
  }
}
```

Headers also include: `X-WP-Total`, `X-WP-TotalPages`

### Error

Returns `WP_Error` which WordPress converts to:

```json
{
  "code": "error_code",
  "message": "Human readable message",
  "data": { "status": 400 }
}
```

---

## Authentication

All protected endpoints require `Authorization: Bearer <access_token>` header.

### POST `/auth/login`

**Public.** Authenticates user and returns tokens.

**Request:**

```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "64-char-hex-string",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": 1,
      "username": "john",
      "email": "john@example.com",
      "display_name": "John Doe",
      "roles": ["subscriber"]
    }
  }
}
```

**Errors:**

- `lms_auth_locked` (429) — Too many login attempts
- `lms_auth_failed` (401) — Invalid credentials

---

### POST `/auth/register`

**Public.** Creates new user account.

**Request:**

```json
{
  "username": "string (required, min 3 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars)"
}
```

**Response (201):** Same as login response.

**Errors:**

- `lms_registration_disabled` (403) — Registration disabled in WP
- `lms_register_locked` (429) — Too many attempts
- `lms_username_exists` (400)
- `lms_email_exists` (400)
- `lms_invalid_email` (400)

---

### POST `/auth/refresh`

**Public.** Exchanges refresh token for new access token. Rotates refresh token.

**Request:**

```json
{
  "refresh_token": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "Bearer",
    "expires_in": 86400
  }
}
```

**Errors:**

- `lms_invalid_refresh_token` (401)
- `lms_refresh_token_expired` (401)

---

### POST `/auth/logout`

**Protected.** Revokes refresh token.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully."
  }
}
```

---

### POST `/auth/forgot-password`

**Public.** Triggers password reset email. Always returns 200 to prevent user enumeration.

**Request:**

```json
{
  "email": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "If that email is registered, a reset link has been sent."
  }
}
```

---

### POST `/auth/reset-password`

**Public.** Resets password using WP reset key.

**Request:**

```json
{
  "login": "string (required, username)",
  "key": "string (required, reset key from email)",
  "password": "string (required, min 8 chars)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully. Please log in."
  }
}
```

**Errors:**

- `lms_invalid_reset_key` (400)
- `lms_weak_password` (400)

---

## Users

### GET `/users/me`

**Protected.** Returns current user profile.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "display_name": "John Doe",
    "first_name": "John",
    "last_name": "Doe",
    "avatar": "https://...",
    "roles": ["subscriber"],
    "capabilities": ["read", "..."],
    "enrolled_courses": 5,
    "registered_at": "2024-01-15 10:30:00"
  }
}
```

---

### PUT/PATCH `/users/me`

**Protected.** Updates current user profile.

**Request (all optional):**

```json
{
  "display_name": "string",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "password": "string (min 8 chars)"
}
```

**Response:** Same as GET `/users/me`

**Errors:**

- `lms_invalid_email` (400)
- `lms_email_exists` (400)
- `lms_weak_password` (400)

---

## Courses

### GET `/courses`

**Public.** Lists courses with pagination and filters.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 10 | Items per page (max 100) |
| `search` | string | — | Full-text search |
| `category` | string/int | — | Filter by category ID or slug |
| `level` | string/int | — | Filter by level ID or slug |
| `tag` | string/int | — | Filter by tag ID or slug |
| `orderby` | string | — | `date` or `title` |
| `order` | string | — | `ASC` or `DESC` |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 123,
        "slug": "course-slug",
        "title": "Course Title",
        "excerpt": "Short description...",
        "content": "<p>Full HTML content...</p>",
        "status": "publish",
        "date_created": 1704067200,
        "date_modified": 1704153600,
        "featured_image": {
          "id": 456,
          "full": "https://.../image.jpg",
          "large": "https://.../image-1024x768.jpg",
          "thumb": "https://.../image-150x150.jpg"
        },
        "price": 29.99,
        "price_display": "£29.99",
        "is_free": false,
        "total_students": 743,
        "seats": null,
        "average_rating": 4.5,
        "rating_count": 120,
        "duration": { "value": 5, "unit": "hours" },
        "start_date": null,
        "categories": [
          { "id": 1, "slug": "business", "name": "Business" }
        ],
        "levels": [
          { "id": 2, "slug": "beginner", "name": "Beginner" }
        ],
        "tags": [],
        "instructors": [
          {
            "id": 5,
            "display_name": "Jane Instructor",
            "email": "jane@example.com",
            "avatar": "https://..."
          }
        ],
        "primary_instructor": { ... },
        "author": { ... },
        "menu_order": 0
      }
    ],
    "total": 150,
    "page": 1,
    "per_page": 10,
    "totalPages": 15
  }
}
```

---

### GET `/courses/search`

**Public.** Alias for `/courses` with `q` parameter mapped to `search`.

**Query:** Same as `/courses` plus `q` (search query).

---

### GET `/courses/featured`

**Public.** Returns featured courses (where `vibe_featured = 1`).

**Query:** `page`, `per_page`

---

### GET `/courses/popular`

**Public.** Returns courses ordered by student count (`vibe_students` meta).

**Query:** `page`, `per_page`

---

### GET `/courses/free`

**Public.** Returns free courses (`vibe_course_free = 1` or `vibe_price = 0`).

**Query:** `page`, `per_page`

---

### GET `/courses/{id}`

**Public.** Returns single course details.

**Response:** Same as single item in `/courses` list.

**Errors:**

- `lms_course_not_found` (404)

---

### GET `/courses/{id}/curriculum`

**Public.** Returns ordered curriculum with sections and units.

**Response (200):**

```json
{
  "success": true,
  "data": [
    { "id": null, "title": "Section 1: Introduction", "type": "section" },
    { "id": 100, "title": "Lesson 1", "type": "unit" },
    { "id": 101, "title": "Lesson 2", "type": "unit" },
    { "id": 102, "title": "Module Quiz", "type": "quiz" },
    { "id": null, "title": "Section 2: Advanced Topics", "type": "section" },
    { "id": 103, "title": "Lesson 3", "type": "unit" }
  ]
}
```

---

### GET `/courses/{id}/students`

**Protected.** Returns enrolled students. Requires instructor/admin role.

**Query:** `page`, `per_page`

**Response:** Paginated list of user objects.

**Errors:**

- `lms_course_not_found` (404)
- `lms_auth_required` (401)
- `lms_forbidden` (403)

---

### GET `/courses/{id}/instructors`

**Public.** Returns course instructors.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 5,
        "display_name": "Jane Instructor",
        "email": "jane@example.com",
        "avatar": "https://...",
        "is_primary": true
      }
    ],
    "total": 1
  }
}
```

---

### GET `/courses/{id}/reviews`

**Public.** Returns course reviews with rating breakdown.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "course_id": 123,
    "reviews": [
      {
        "id": 456,
        "course_id": 123,
        "user_id": 7,
        "author": {
          "id": 7,
          "name": "Student Name",
          "avatar": "https://..."
        },
        "title": "Great course!",
        "content": "Very helpful...",
        "rating": 5,
        "created_at": "2024-01-15 10:30:00",
        "status": "1"
      }
    ],
    "total_reviews": 50,
    "average_rating": 4.5,
    "rating_breakdown": {
      "5": 30,
      "4": 15,
      "3": 3,
      "2": 1,
      "1": 1
    }
  }
}
```

---

### POST `/courses/{id}/reviews`

**Protected.** Creates a review for a course.

**Request:**

```json
{
  "rating": 5,
  "title": "string (optional)",
  "content": "string (required)"
}
```

**Errors:**

- `course_not_found` (404)
- `already_reviewed` (400)

---

## Units (Lessons)

### GET `/units`

**Protected.** Lists units (primarily for admin use).

**Query:** `page`, `per_page`, `search`

---

### GET `/units/{id}`

**Protected.** Returns unit metadata (no content).

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 100,
    "title": "Lesson Title",
    "slug": "lesson-slug",
    "course_id": 123,
    "duration": "10 minutes",
    "type": "unit"
  }
}
```

---

### GET `/units/{id}/content`

**Protected.** Returns rendered unit content. Requires enrollment or instructor access.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 100,
    "content": "<p>Full HTML content with applied filters...</p>"
  }
}
```

**Errors:**

- `lms_unit_not_found` (404)
- `lms_unit_forbidden` (403) — Not enrolled

---

### POST `/units/{id}/complete`

**Protected.** Marks unit complete for current user.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "unit_id": 100,
    "course_id": 123,
    "completed": true,
    "completed_at": 1704153600
  }
}
```

**Errors:**

- `lms_unit_not_found` (404)
- `lms_course_not_found` (404)
- `lms_unit_forbidden` (403)

---

## Enrollments

### POST `/courses/{id}/enroll`

**Protected.** Enrolls current user in a course (free courses only).

**Response (201):**

```json
{
  "success": true,
  "data": {
    "message": "Enrolled successfully.",
    "enrollment": {
      "user_id": 7,
      "course_id": 123,
      "enrolled_at": 1704153600,
      "status": "active"
    }
  }
}
```

**Errors:**

- `lms_course_not_found` (404)
- `lms_already_enrolled` (400)
- `lms_enroll_failed` (400)

---

### GET `/users/me/enrollments`

**Protected.** Returns current user's enrolled courses.

**Query:** `page`, `per_page`

**Response (200):** Paginated list with enrollment data + course title/link.

---

## Progress

### GET `/users/me/progress`

**Protected.** Returns progress summary for all enrolled courses.

**Query:** `page`, `per_page`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "course_id": 123,
        "user_id": 7,
        "status": 2,
        "status_label": "continue_course",
        "completed": false,
        "completion_rate": 45,
        "course_title": "Course Title",
        "course_link": "https://..."
      }
    ],
    "total": 5,
    "page": 1,
    "per_page": 10,
    "totalPages": 1
  }
}
```

Status codes: `1` = start_course, `2` = continue_course, `3` = under_evaluation, `4` = evaluated

---

### GET `/users/me/courses/{course_id}/progress`

**Protected.** Returns detailed per-unit progress for a course.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "course_id": 123,
    "user_id": 7,
    "status": 2,
    "status_label": "continue_course",
    "completed": false,
    "completion_rate": 45,
    "course_title": "Course Title",
    "course_link": "https://...",
    "units": [
      { "type": "section", "title": "Section 1", "id": null },
      {
        "id": 100,
        "title": "Lesson 1",
        "type": "unit",
        "completed": true,
        "completed_at": 1704153600
      },
      { "id": 101, "title": "Lesson 2", "type": "unit", "completed": false, "completed_at": null },
      { "id": 102, "title": "Quiz", "type": "quiz", "completed": false, "completed_at": null }
    ]
  }
}
```

---

## Quizzes

### GET `/quizzes`

**Public.** Lists quizzes.

**Query:** `page`, `per_page`, `course_id`

---

### GET `/quizzes/{id}`

**Public.** Returns quiz metadata.

---

### GET `/quizzes/{id}/questions`

**Public.** Returns quiz questions (no answers).

**Response (200):**

```json
{
  "success": true,
  "data": [
    { "id": 200, "title": "Question text?", "type": "multiple" },
    { "id": 201, "title": "Another question?", "type": "single" }
  ]
}
```

---

### POST `/quizzes/{id}/start`

**Protected.** Starts a quiz attempt.

**Response (201):**

```json
{
  "success": true,
  "data": {
    "attempt_id": "7_102_1704153600",
    "quiz_id": 102,
    "course_id": 123,
    "status": "in_progress"
  }
}
```

---

### POST `/quizzes/{id}/submit`

**Protected.** Submits quiz answers.

**Request:**

```json
{
  "answers": [
    { "question_id": 200, "answer": "A" },
    { "question_id": 201, "answer": ["B", "C"] }
  ]
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "attempt_id": "7_102_1704153600",
    "quiz_id": 102,
    "score": 80,
    "max_score": 100,
    "passed": true,
    "status": "completed",
    "completed_at": 1704154200
  }
}
```

---

### GET `/quizzes/{id}/results`

**Protected.** Returns latest quiz attempt results for current user.

---

## Assignments

### GET `/assignments`

**Protected.** Lists assignments.

**Query:** `page`, `per_page`, `course_id`

---

### GET `/assignments/{id}`

**Protected.** Returns assignment details.

---

### POST `/assignments/{id}/submit`

**Protected.** Submits assignment.

**Request:**

```json
{
  "content": "string (text submission)",
  "files": ["attachment_id_1", "attachment_id_2"]
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "submission_id": 500,
    "status": "submitted",
    "message": "Assignment submitted successfully."
  }
}
```

---

### GET `/assignments/{id}/status`

**Protected.** Returns submission status.

**Query:** `user_id` (optional, defaults to current user)

---

### PUT/PATCH `/assignments/{id}/grade`

**Protected.** Grades assignment (instructor/admin only).

**Request:**

```json
{
  "user_id": 7,
  "marks": 85,
  "feedback": "Great work!"
}
```

---

## Reviews

### GET `/reviews`

**Public.** Lists all reviews.

**Query:** `page`, `per_page`

---

### GET `/reviews/my-reviews`

**Protected.** Returns current user's reviews.

---

### PUT/PATCH `/reviews/{id}`

**Protected.** Updates own review.

**Request:**

```json
{
  "rating": 4,
  "title": "Updated title",
  "content": "Updated content"
}
```

---

### DELETE `/reviews/{id}`

**Protected.** Deletes own review (or admin can delete any).

---

## Taxonomy

### GET `/course-categories`

**Public.** Returns course categories.

**Query:** `parent` (filter by parent term ID)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Health & Safety",
        "slug": "health-safety",
        "description": "",
        "count": 25,
        "parent": 0,
        "image": "https://..."
      }
    ]
  }
}
```

---

### GET `/levels`

**Public.** Returns course levels.

---

### GET `/tags`

**Public.** Returns course tags.

---

## Utility

### GET `/health`

**Public.** Health check endpoint.

**Response (200):**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00+00:00",
  "wordpress_version": "6.4.2",
  "wplms_active": true,
  "php_version": "8.2.0"
}
```

---

### GET `/version`

**Public.** API version info.

**Response (200):**

```json
{
  "api_version": "1.0.0",
  "endpoints_count": 45,
  "controllers": [
    "auth",
    "courses",
    "units",
    "quizzes",
    "users",
    "enrollments",
    "progress",
    "taxonomy"
  ],
  "status": "active"
}
```

---

## Not Yet Implemented

These endpoints are documented in `LMS_API_PLAN.md` but not yet built:

| Endpoint                  | Section           | Priority |
| ------------------------- | ----------------- | -------- |
| `/cart/*`                 | §11               | P0       |
| `/orders/*`               | §11               | P0       |
| `/payment/*`              | §11               | P0       |
| `/bundles/*`              | §12               | P1       |
| `/memberships/*`          | §12               | P1       |
| `/certificates/*`         | §13               | P1       |
| `/users/me/certificates`  | §2                | P1       |
| `/users/me/badges`        | §2                | P2       |
| `/users/me/notifications` | §2                | P3       |
| `/instructors/*`          | §19               | P2       |
| `/search` (unified)       | §16               | P2       |
| `/settings`               | new (white-label) | P0       |

---

## Certificates

### POST `/certificates/verify` (also GET)

Public. Verifies a certificate code in the live-site format `{PREFIX}-{course_id}-{user_id}`.

Body / query: `code` (string, required).

```json
{
  "success": true,
  "data": {
    "valid": true,
    "code": "TX-123-456",
    "certificate_url": "https://…/certificate.pdf",
    "course": { "id": 123, "title": "…", "slug": "…" },
    "student_name": "Jane Doe"
  }
}
```

Invalid codes return `valid: false` with null fields (HTTP 200).

---

## Pages

### GET `/pages/{slug}`

Public. Returns a published WP page by slug (legal/marketing copy).

```json
{
  "success": true,
  "data": {
    "id": 12,
    "slug": "privacy-policy",
    "title": "Privacy Policy",
    "content": "<p>…</p>",
    "excerpt": "…",
    "modified": "2026-06-12T00:00:00+00:00"
  }
}
```

Errors: `lms_page_not_found` (404).

---

## Contact

### POST `/contact`

Public, IP rate-limited (5/hour). Honeypot field: `website` (must stay empty).

Body: `first_name` (required), `last_name`, `email` (required), `phone`, `message` (required, ≤5000 chars).

```json
{ "success": true, "data": { "sent": true } }
```

Errors: `lms_contact_missing_fields` (400), `lms_contact_invalid_email` (400), `lms_contact_message_too_long` (400), `lms_contact_rate_limited` (429), `lms_contact_send_failed` (500).

### GET `/cancellations/page`

Public. Returns hero copy and Gravity Form ids for the headless `/cancellations` and `/support-request` pages. Content is edited via ACF on the WordPress `cancellations` and `support-request` pages.

```json
{
  "success": true,
  "data": {
    "cancellations": {
      "hero": { "eyebrow": "…", "heading": "…", "text": "…" },
      "cta": { "supportLabel": "Get quick help first", "refundLabel": "Check refund options" },
      "refundFormId": 12
    },
    "supportRequest": {
      "hero": { "eyebrow": "…", "heading": "…", "text": "…" },
      "supportFormId": 11
    },
    "notificationEmail": "admin@example.com"
  }
}
```

Form ids may be `null` when not yet configured in WP admin. `notificationEmail` is the WordPress Administration Email Address (used for GF notifications and frontend fallbacks). Submissions use `POST /forms/{id}/submissions`. See `lms-backend-rest-api/docs/cancellations-refunds/GRAVITY_FORMS.md` for GF setup and `PROGRESS.md` for implementation status.

---

## Error Codes Reference

| Code                         | HTTP | Description                        |
| ---------------------------- | ---- | ---------------------------------- |
| `lms_auth_failed`            | 401  | Invalid username or password       |
| `lms_auth_locked`            | 429  | Too many login attempts            |
| `lms_auth_required`          | 401  | Authentication required            |
| `lms_invalid_refresh_token`  | 401  | Refresh token invalid or not found |
| `lms_refresh_token_expired`  | 401  | Refresh token expired              |
| `lms_registration_disabled`  | 403  | User registration disabled         |
| `lms_register_locked`        | 429  | Too many registration attempts     |
| `lms_username_exists`        | 400  | Username taken                     |
| `lms_email_exists`           | 400  | Email already registered           |
| `lms_invalid_email`          | 400  | Invalid email address              |
| `lms_weak_password`          | 400  | Password too short                 |
| `lms_user_not_authenticated` | 401  | User not logged in                 |
| `lms_user_not_found`         | 404  | User not found                     |
| `lms_course_not_found`       | 404  | Course not found                   |
| `lms_unit_not_found`         | 404  | Unit not found                     |
| `lms_unit_forbidden`         | 403  | Not enrolled in course             |
| `lms_quiz_not_found`         | 404  | Quiz not found                     |
| `lms_quiz_forbidden`         | 403  | Not enrolled for quiz              |
| `lms_already_enrolled`       | 400  | Already enrolled in course         |
| `lms_enroll_failed`          | 400  | Enrollment failed                  |
| `lms_not_enrolled`           | 403  | Not enrolled in course             |
| `lms_forbidden`              | 403  | Permission denied                  |
| `rest_forbidden`             | 403  | Generic permission denied          |

---

# B2B Business Dashboard REST API Reference

> **Source:** `wp-lms-b2b-rest-api` WordPress plugin (facade over `b2b-dashboard/v1`)
> **Namespace:** `lms-b2b/v1` (configure via `NEXT_PUBLIC_B2B_NAMESPACE`)
> **Base URL:** `https://<your-domain>/wp-json/lms-b2b/v1`

The Next.js business dashboard calls these endpoints through BFF routes at `/api/business/*` via `proxyToB2B()`. All protected routes require `Authorization: Bearer <access_token>`.

## Response Format

Same envelope as `lms-backend/v1`: `{ success, data }` or paginated `{ success, data: { items, total, page, per_page, pages } }`.

---

## Reports & Summary

| Method | Path                    | Description              |
| ------ | ----------------------- | ------------------------ |
| GET    | `/reports/summary`      | Dashboard KPIs           |
| GET    | `/reports/courses`      | Course assignment report |
| GET    | `/reports/members`      | Learner activity report  |
| GET    | `/reports/certificates` | Certificate report       |

---

## Business Profile

| Method | Path                    | Description                           |
| ------ | ----------------------- | ------------------------------------- |
| GET    | `/businesses/current`   | Current business profile              |
| PATCH  | `/businesses/{id}`      | Update profile fields                 |
| POST   | `/businesses/{id}/logo` | Upload logo (multipart)               |
| DELETE | `/businesses/{id}/logo` | Remove logo                           |
| GET    | `/businesses/orders`    | WooCommerce order history (paginated) |

> **v4:** `/business/system-type` and `/business/switch-system` removed. All businesses use licence pools + v2 subscriptions together.

---

## Team / Learners

| Method | Path                       | Description                   |
| ------ | -------------------------- | ----------------------------- |
| GET    | `/team`                    | List team members (paginated) |
| POST   | `/team`                    | Add learner                   |
| PATCH  | `/team/{id}`               | Update member (e.g. status)   |
| POST   | `/team/{id}/convert-role`  | Convert learner ↔ manager     |
| GET    | `/team/check-email?email=` | Email availability check      |

---

## Courses & Assignments

| Method | Path                               | Description                            |
| ------ | ---------------------------------- | -------------------------------------- |
| GET    | `/courses`                         | Course catalogue for assignment        |
| GET    | `/courses/assignments`             | Assignment history                     |
| GET    | `/courses/assignment-list`         | Assigned courses with completion stats |
| GET    | `/courses/learner/{id}`            | Courses assigned to a learner          |
| GET    | `/courses/{id}/learners`           | Learners on a course                   |
| GET    | `/courses/{id}/available-learners` | Learners not yet on course             |
| POST   | `/courses/assign`                  | Assign course to learners              |

**POST `/courses/assign` body:**

```json
{
  "course_id": 123,
  "user_ids": [1, 2, 3]
}
```

**Errors:** `409 no_licence_available` when the learner has no subscription seat and no licence pool (course-specific or universal `course_id = 0`) can fund the assignment.

**GET `/courses/assignment-list` response shape:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "course_id": 123,
        "course_name": "Course Title",
        "total_learners": 10,
        "completion_stats": {
          "completed": 3,
          "active": 5,
          "expired": 2,
          "certificate_count": 3
        },
        "first_assigned": "2024-01-01",
        "last_assigned": "2024-06-01"
      }
    ],
    "total": 1,
    "pages": 1,
    "page": 1,
    "per_page": 10
  }
}
```

---

## Licences

| Method | Path                              | Description                   |
| ------ | --------------------------------- | ----------------------------- |
| GET    | `/licences/balance`               | Licence pools summary         |
| GET    | `/licences/balance/{course_id}`   | Per-course licence pool       |
| GET    | `/licences/courses`               | Purchasable licence catalogue |
| GET    | `/licences/pricing`               | Volume discount tiers         |
| POST   | `/licences/pricing/calculate`     | Price calculation             |
| POST   | `/licences/checkout`              | Licence checkout              |
| POST   | `/licences/subscription/checkout` | Subscription checkout         |

> **v4:** All `/credits/*` routes removed. Legacy credit balances are migrated server-side into universal licence pools (`course_id = 0`).

---

## Subscriptions

| Method | Path                                            | Description                |
| ------ | ----------------------------------------------- | -------------------------- |
| GET    | `/businesses/subscriptions`                     | Subscription list          |
| GET    | `/businesses/subscriptions/summary`             | Seat summary KPIs          |
| GET    | `/businesses/subscriptions/assigned`            | Assigned seats             |
| POST   | `/businesses/subscriptions/assign-user`         | Assign seat to user        |
| PATCH  | `/businesses/subscriptions/{id}/status`         | Update subscription status |
| DELETE | `/businesses/subscriptions/{id}/seats/{seatId}` | Revoke seat                |

---

## Certificates

| Method | Path                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| GET    | `/certificates`         | Certificate list (legacy)            |
| POST   | `/certificate/generate` | Generate certificate for user+course |

**POST `/certificate/generate` body:**

```json
{ "user_id": 42, "course_id": 123 }
```

---

## Managers & Permissions

| Method | Path                                | Description              |
| ------ | ----------------------------------- | ------------------------ |
| GET    | `/managers`                         | List managers            |
| GET    | `/managers/business/{id}`           | Managers for business    |
| POST   | `/managers`                         | Add manager              |
| PATCH  | `/managers/{id}`                    | Update manager           |
| DELETE | `/managers/{id}`                    | Remove manager           |
| GET    | `/permissions/manager/capabilities` | Manager capability flags |

---

## Reviews

| Method | Path           | Description               |
| ------ | -------------- | ------------------------- |
| GET    | `/reviews/has` | `{ has_review: boolean }` |
| POST   | `/reviews`     | Submit feedback           |

---

## Course Categories

| Method | Path                          | Description                          |
| ------ | ----------------------------- | ------------------------------------ |
| GET    | `/course-categories/excluded` | Category IDs excluded from catalogue |

---

## BFF Route Map (Next.js)

| BFF route                                           | Proxies to                           |
| --------------------------------------------------- | ------------------------------------ |
| `GET /api/business/summary`                         | `/reports/summary`                   |
| `GET /api/business/profile`                         | `/businesses/current`                |
| `PATCH /api/business/profile/[id]`                  | `/businesses/{id}`                   |
| `GET/POST /api/business/team`                       | `/team`                              |
| `PATCH /api/business/team/[id]`                     | `/team/{id}`                         |
| `POST /api/business/team/[id]/convert-role`         | `/team/{id}/convert-role`            |
| `GET /api/business/team/check-email`                | `/team/check-email`                  |
| `GET /api/business/courses`                         | `/courses`                           |
| `GET /api/business/courses/assignment-list`         | `/courses/assignment-list`           |
| `GET /api/business/courses/learner/[id]`            | `/courses/learner/{id}`              |
| `GET /api/business/courses/[id]/learners`           | `/courses/{id}/learners`             |
| `GET /api/business/courses/[id]/available-learners` | `/courses/{id}/available-learners`   |
| `POST /api/business/courses/assign`                 | `/courses/assign`                    |
| `GET /api/business/licences/balance`                | `/licences/balance`                  |
| `GET /api/business/licences/pricing`                | `/licences/pricing`                  |
| `POST /api/business/licences/pricing/calculate`     | `/licences/pricing/calculate`        |
| `POST /api/business/licences/checkout`              | `/licences/checkout`                 |
| `POST /api/business/licences/subscription/checkout` | `/licences/subscription/checkout`    |
| `POST /api/business/licences/quote`                 | `/licences/quote`                    |
| `GET /api/business/subscriptions`                   | `/businesses/subscriptions`          |
| `GET /api/business/orders`                          | `/businesses/orders`                 |
| `GET /api/business/subscriptions/summary`           | `/businesses/subscriptions/summary`  |
| `GET /api/business/subscriptions/assigned`          | `/businesses/subscriptions/assigned` |
| `GET /api/business/course-categories/excluded`      | `/course-categories/excluded`        |
| `POST /api/business/certificate/generate`           | `/certificate/generate`              |
| `GET /api/business/managers`                        | `/managers`                          |
| `GET /api/business/reviews/has`                     | `/reviews/has`                       |
| `POST /api/business/reviews`                        | `/reviews`                           |
