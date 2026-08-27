/**
 * The course category names the WP backend actually serves, captured from
 * `GET /lms-backend/v1/course-categories?per_page=50` on 2026-08-24.
 *
 * 18 of these 20 already end in the word "Courses", which is why a CTA that
 * appends the word to the raw name reads "… Courses courses" on most of the
 * catalogue (`QA-COURSES-A4`).
 *
 * Production could not be sampled — trainingexcellence.org.uk answers the REST
 * route with an SG captcha redirect — so this fixture is the local backend's
 * catalogue. The rule under test tolerates names with and without the suffix,
 * so prod's exact names do not change the expected behaviour.
 */
export const COURSE_CATEGORY_NAMES = [
  "Animal Care Courses",
  "Asbestos Awareness Courses",
  "Business Essentials Courses",
  "Career Bundles Courses",
  "Education Courses",
  "Fire Safety Courses",
  "First Aid Courses",
  "Food Hygiene Courses",
  "Groupon",
  "HACCP Courses",
  "Health and Safety Courses",
  "Health and Social Care Courses",
  "Level 3,Construction Safety,Health & Safety",
  "Mental Health Courses",
  "Others Courses",
  "Safeguarding Courses",
  "Teaching Courses",
  "Trending Courses",
  "Workplace Compliance Courses",
  "Workplace Training Courses",
] as const;
