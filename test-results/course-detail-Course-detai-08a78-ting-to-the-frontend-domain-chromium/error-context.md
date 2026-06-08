# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: course-detail.spec.ts >> Course detail page >> has a canonical link pointing to the frontend domain
- Location: e2e/course-detail.spec.ts:15:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: null
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
    - generic [ref=e2]:
        - banner [ref=e3]:
            - generic [ref=e4]:
                - link "Training Excellence — home" [ref=e5] [cursor=pointer]:
                    - /url: /
                    - generic [ref=e6]:
                        - text: Training
                        - text: Excellence
                - navigation "Main navigation" [ref=e7]:
                    - generic [ref=e8]:
                        - link "About us" [ref=e9] [cursor=pointer]:
                            - /url: /about
                        - link "Help" [ref=e10] [cursor=pointer]:
                            - /url: /help
                        - generic [ref=e11]:
                            - generic [ref=e12]: Find a course
                            - generic [ref=e13]: "Find a course:"
                            - generic [ref=e14]:
                                - textbox "Find a course" [ref=e15]:
                                    - /placeholder: e.g. food hygiene
                                - button "Search" [ref=e16] [cursor=pointer]:
                                    - img [ref=e17]
                    - generic [ref=e20]:
                        - button "Our courses" [ref=e21] [cursor=pointer]:
                            - text: Our courses
                            - img [ref=e22]
                        - link "Training teams" [ref=e24] [cursor=pointer]:
                            - /url: /training-teams
                        - button "Resources" [ref=e26] [cursor=pointer]:
                            - text: Resources
                            - img [ref=e27]
                        - link "Contact us" [ref=e29] [cursor=pointer]:
                            - /url: /contact
                        - link "Basket (0)" [ref=e31] [cursor=pointer]:
                            - /url: /courses
                            - img [ref=e32]
                            - text: Basket (0)
                        - link "Log in" [ref=e36] [cursor=pointer]:
                            - /url: /login
        - main [ref=e37]:
            - generic [ref=e38]:
                - paragraph [ref=e39]: "404"
                - heading "Page not found" [level=1] [ref=e40]
                - paragraph [ref=e41]: The page you're looking for doesn't exist or has been moved.
                - link "Back to home" [ref=e42] [cursor=pointer]:
                    - /url: /
        - contentinfo [ref=e43]:
            - generic [ref=e45]:
                - generic [ref=e46]:
                    - heading "Training That Works for Your Team" [level=2] [ref=e47]
                    - paragraph [ref=e48]: Our 100% online courses cover all your compliance and development needs, making training simple for teams of any size.
                - generic [ref=e49]:
                    - link "Chat to us" [ref=e50] [cursor=pointer]:
                        - /url: /contact
                    - link "Get Started" [ref=e51] [cursor=pointer]:
                        - /url: /courses
            - generic [ref=e53]:
                - generic [ref=e54]:
                    - link "Training Excellence — home" [ref=e55] [cursor=pointer]:
                        - /url: /
                        - generic [ref=e56]:
                            - text: Training
                            - text: Excellence
                    - paragraph [ref=e57]: Our platform offers fully accredited, 100% online training designed for businesses of all sizes. Trusted by over 3 million learners, we provide flexible, high-quality courses to meet your compliance and development needs.
                    - generic [ref=e58]:
                        - generic [ref=e59]: "Follow us:"
                        - generic [ref=e60]:
                            - link "Facebook" [ref=e61] [cursor=pointer]:
                                - /url: https://facebook.com/trainingexcellence
                                - img [ref=e62]
                            - link "X (Twitter)" [ref=e64] [cursor=pointer]:
                                - /url: https://x.com/trainingexcellence
                                - img [ref=e65]
                            - link "TikTok" [ref=e67] [cursor=pointer]:
                                - /url: https://tiktok.com/@trainingexcellence
                                - img [ref=e68]
                            - link "Instagram" [ref=e70] [cursor=pointer]:
                                - /url: https://instagram.com/trainingexcellence
                                - img [ref=e71]
                            - link "LinkedIn" [ref=e74] [cursor=pointer]:
                                - /url: https://linkedin.com/company/trainingexcellence
                                - img [ref=e75]
                - generic [ref=e78]:
                    - generic [ref=e79]:
                        - generic [ref=e80]:
                            - paragraph [ref=e81]: About
                            - list [ref=e82]:
                                - listitem [ref=e83]:
                                    - link "About us" [ref=e84] [cursor=pointer]:
                                        - /url: /about
                                - listitem [ref=e85]:
                                    - link "Work for us" [ref=e86] [cursor=pointer]:
                                        - /url: /careers
                                - listitem [ref=e87]:
                                    - link "Resources" [ref=e88] [cursor=pointer]:
                                        - /url: /resources
                                    - generic [ref=e89]: New
                                - listitem [ref=e90]:
                                    - link "Force for Good" [ref=e91] [cursor=pointer]:
                                        - /url: /force-for-good
                                - listitem [ref=e92]:
                                    - link "Reviews" [ref=e93] [cursor=pointer]:
                                        - /url: /reviews
                        - generic [ref=e94]:
                            - paragraph [ref=e95]: Support
                            - list [ref=e96]:
                                - listitem [ref=e97]:
                                    - link "Help and FAQs" [ref=e98] [cursor=pointer]:
                                        - /url: /help
                                - listitem [ref=e99]:
                                    - link "Contact us" [ref=e100] [cursor=pointer]:
                                        - /url: /contact
                                - listitem [ref=e101]:
                                    - link "Verify certificate" [ref=e102] [cursor=pointer]:
                                        - /url: /verify-certificate
                                - listitem [ref=e103]:
                                    - link "Cancellations and refunds" [ref=e104] [cursor=pointer]:
                                        - /url: /cancellations
                                - listitem [ref=e105]:
                                    - link "Policies and terms of use" [ref=e106] [cursor=pointer]:
                                        - /url: /policies
                    - generic [ref=e107]:
                        - paragraph [ref=e108]: Certificate Validator
                        - paragraph [ref=e109]: Quickly and easily check the validity of your Training Excellence course certificates with Training Excellence's Course Certificate Validator tool.
                        - generic [ref=e110]:
                            - textbox "Enter Certificate Code" [ref=e111]
                            - button "Validate" [ref=e112] [cursor=pointer]
            - generic [ref=e114]:
                - paragraph [ref=e115]:
                    - text: © 2026 Training Excellence. Riverside Business Park, Dansk Way, Ilkley, West Yorkshire, LS29 8JZ.
                    - text: "VAT Reg. No: 923 6593 07 | Registered in England and Wales: 6428976"
                - paragraph [ref=e116]:
                    - text: This site is protected by reCAPTCHA and the Google
                    - link "Privacy Policy" [ref=e117] [cursor=pointer]:
                        - /url: https://policies.google.com/privacy
                    - text: and
                    - link "Terms of Service" [ref=e118] [cursor=pointer]:
                        - /url: https://policies.google.com/terms
                    - text: apply.
    - region "Notifications alt+T"
    - generic [ref=e119]:
        - img [ref=e121]
        - button "Open Tanstack query devtools" [ref=e169] [cursor=pointer]:
            - img [ref=e170]
    - alert [ref=e218]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  |
  3  | // Uses the first course returned by the API — adjust slug if the site has no courses.
  4  | const KNOWN_SLUG = "fire-safety-training";
  5  |
  6  | test.describe("Course detail page", () => {
  7  |   test("renders with correct page title", async ({ page }) => {
  8  |     await page.goto(`/course/${KNOWN_SLUG}`);
  9  |     await expect(page).toHaveTitle(/.+/);
  10 |     // Title should not be the bare "Course" fallback
  11 |     const title = await page.title();
  12 |     expect(title).not.toBe("Course");
  13 |   });
  14 |
  15 |   test("has a canonical link pointing to the frontend domain", async ({ page }) => {
  16 |     await page.goto(`/course/${KNOWN_SLUG}`);
  17 |     await page.waitForLoadState("networkidle");
  18 |     const canonical = await page.evaluate(
  19 |       () => document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
  20 |     );
> 21 |     expect(canonical).toBeTruthy();
     |                       ^ Error: expect(received).toBeTruthy()
  22 |     expect(canonical).not.toContain("trainingexcellence.org.uk");
  23 |     expect(canonical).toContain(`/course/${KNOWN_SLUG}`);
  24 |   });
  25 |
  26 |   test("injects valid JSON-LD structured data", async ({ page }) => {
  27 |     await page.goto(`/course/${KNOWN_SLUG}`);
  28 |     await page.waitForLoadState("networkidle");
  29 |     const scripts = await page.evaluate(() =>
  30 |       [...document.querySelectorAll('script[type="application/ld+json"]')].map(
  31 |         (s) => s.textContent,
  32 |       ),
  33 |     );
  34 |     expect(scripts.length).toBeGreaterThan(0);
  35 |     expect(() => JSON.parse(scripts[0] ?? "")).not.toThrow();
  36 |   });
  37 |
  38 |   test("renders course breadcrumb", async ({ page }) => {
  39 |     await page.goto(`/course/${KNOWN_SLUG}`);
  40 |     await expect(
  41 |       page.locator("nav[aria-label], [data-testid='breadcrumb'], ol, nav").first(),
  42 |     ).toBeVisible();
  43 |   });
  44 |
  45 |   test("unknown slug returns 404", async ({ page }) => {
  46 |     const response = await page.goto("/course/this-course-does-not-exist-xyz-abc-999");
  47 |     // Next.js notFound() returns a 404
  48 |     expect(response?.status()).toBe(404);
  49 |   });
  50 | });
  51 |
```
