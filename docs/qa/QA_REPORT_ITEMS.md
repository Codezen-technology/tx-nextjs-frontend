# QA Report — item inventory

**Source:** [QA Report (Google Doc)](https://docs.google.com/document/d/1jEH8XZCVGtwbOOix-Y2Uk--3FdFks4jOLwNPf3cAl0M/edit)
**Extracted:** 2026-08-14 · **Extracted by:** full-text read of the document
**Consumed by:** `scripts/qa-doc-check.mjs` assertions 5 and 6

---

## Why this file exists

`docs/qa/QA_BY_PAGE.md` is the sign-off sheet. Until now nothing could check it against
the report, because the report is a Google Doc and `pnpm test` cannot read one. The
result was the same error three times: **a page read `Open 0` while items sat untriaged.**
Homepage lost 5 rows, Single Course lost 8, and this reconciliation found more.

So the report's items live here, verbatim, with stable IDs. Every QA row cites the item
it came from, and the checker fails in **both** directions — a row citing nothing, and an
item cited by nothing. The second one is the assertion that was missing.

## How to read it

- **Item ID** — `R-<PAGE>-<BP>-<NN>`. `<BP>` is the report's own breakpoint heading
  (`1920`, `1280`, `440`). `<NN>` is assigned **by position**, not copied from the report
- **The report's own numbering is unreliable** and is recorded per item as `label:`.
  Homepage labels two items "Issue 7", Single Course labels three "Issue 4", About Us
  labels three "Issue 1". Position is the only stable identity
- **Sub-items are separate entries.** Where one report issue lists "1. … 2. …" under a
  single heading, each numbered fix is its own item, because each is a separate defect
  with a separate verdict. One QA row may cite several item IDs
- A breakpoint the report marks "Working Fine" has no items, and that is recorded

**Do not renumber.** A new item takes the next free number for its page and breakpoint.

---

## Homepage

Report page link: `https://backend.trainingexcellence.org.uk/`
Figma: Desktop `4571:10560` · Mobile `3268:45687`

### Desktop — 1920

| Item             | label     | Issue                                                                                                      | Solution(Dev)                                                                                                                   | Assignee     |
| ---------------- | --------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `R-HOME-1920-01` | 1         | "The text on the circle is not properly aligned."                                                          | "The text on the circle will be middle aligned."                                                                                | Dev          |
| `R-HOME-1920-02` | 2         | "The navbar dropdown opens after click."                                                                   | "The navbar dropdown should be open while hovering."                                                                            | Dev          |
| `R-HOME-1920-03` | 3         | "Search and Card button color is same and shape is different."                                             | "The shape and color needs to be fixed of the search courses button."                                                           | Dev & Design |
| `R-HOME-1920-04` | 4         | "The header of this section is not similar to the other section headers."                                  | "The section header's weight will be similar to the other section headers and the section header text case will be Title case." | Dev          |
| `R-HOME-1920-05` | 5         | "While hovering on the option here, the hover effect is so dark and also the text isn't visible properly." | "The hover effect needs to be lighter and the text should be more visible."                                                     | Dev & Design |
| `R-HOME-1920-06` | 6         | "There is a lot of spacing on the top and bottom of the hero section."                                     | "The top and bottom spacing needs to be 80 or 100px."                                                                           | Dev          |
| `R-HOME-1920-07` | 7         | "The title of the cards changes while hovering the cards."                                                 | "The Header color will remain the same even after hovering."                                                                    | Dev          |
| `R-HOME-1920-08` | 7 _(dup)_ | "The icon color is not visible."                                                                           | "The icon color needs to be more visible."                                                                                      | Dev & Design |
| `R-HOME-1920-09` | 8         | "This section took too much space."                                                                        | "The section needs to be more standard and also middle align."                                                                  | Dev & Design |
| `R-HOME-1920-10` | 9.1       | "There is an image on the right side of the section. But the image is not visible here."                   | "The image should be visible on the section."                                                                                   | Dev          |
| `R-HOME-1920-11` | 9.2       | "The button has no hover effect."                                                                          | "Add a hover effect on the button in this section."                                                                             | Dev          |
| `R-HOME-1920-12` | 10.1      | "The pound symbol on the marked areas has to be changed. It doesn't feel like a pound symbol."             | "The symbol will be in **Inter** Font."                                                                                         | Dev          |
| `R-HOME-1920-13` | 10.2      | "When the quantity is increased, the amount doesn't increase at all."                                      | (same block as 10.1)                                                                                                            | Dev          |
| `R-HOME-1920-14` | 11        | "The Certificate and the transcript are not visible on the website."                                       | "The certificate and the transcript needs to be visible."                                                                       | Dev          |
| `R-HOME-1920-15` | 12.1      | "There is no need of 'Force for good, work for us, resources'."                                            | "Remove these options from the footer."                                                                                         | Dev          |
| `R-HOME-1920-16` | 12.2      | "Certificate Validator has a longer body text."                                                            | "Shorten the body text."                                                                                                        | Dev          |
| `R-HOME-1920-17` | 13.1      | "There is no need of **contact us** on navbar."                                                            | "Remove the contact us from the navbar."                                                                                        | Design & Dev |
| `R-HOME-1920-18` | 13.2      | "There is no need for a **help centre** and **about us** on resource dropdown."                            | "Remove the help centre and about us from resources."                                                                           | Design & Dev |
| `R-HOME-1920-19` | 13.3      | "There is a new option needed on the navbar which is Pricing."                                             | "Add pricing option on the navbar."                                                                                             | Design & Dev |

### Laptop — 1280

_"Working Fine" — no items._

### Mobile — 440

| Item            | label     | Issue                                                                                                                     | Solution(Dev)                                                          | Assignee     |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------ |
| `R-HOME-440-01` | 7         | "The text field on the hero section is different from the actual design. The height and the width are not user friendly." | "Make the text field the same as the design."                          | Design       |
| `R-HOME-440-02` | 7 _(dup)_ | "The company logos are not visible in this section."                                                                      | "The company logos need to be visible under the text."                 | Dev          |
| `R-HOME-440-03` | 8         | "The CTA button is with the section header in the website. But the CTA should be on the bottom of the section."           | "Move the CTA to the bottom of the section."                           | Dev & Design |
| `R-HOME-440-04` | 9.1       | "The spacing in the marked area is too much."                                                                             | "Decrease the spacing into **40px**."                                  | Dev & Design |
| `R-HOME-440-05` | 9.2       | "The image of the section is missing."                                                                                    | "Add the image of this section."                                       | Dev & Design |
| `R-HOME-440-06` | 10.1      | "The header and the body text doesn't cover the full width horizontally."                                                 | "The header and the body text will cover the full width horizontally." | Dev & Design |
| `R-HOME-440-07` | 10.2      | "The Certificate and the Transcript are missing here."                                                                    | "Add the Certificate and the Transcript here."                         | Dev & Design |

**Homepage total: 26.**

---

## About Us

Report page link: `https://backend.trainingexcellence.org.uk/about-us`
Figma: Desktop `6239:102399`

### Desktop — 1920

| Item              | label     | Issue                                                                             | Solution(Dev)                      | Assignee |
| ----------------- | --------- | --------------------------------------------------------------------------------- | ---------------------------------- | -------- |
| `R-ABOUT-1920-01` | 1         | "The images are not visible on this page."                                        | "The pictures need to be visible." | Dev      |
| `R-ABOUT-1920-02` | 1 _(dup)_ | "There is breadcrumbs in the website."                                            | "No need of breadcrumbs."          | Dev      |
| `R-ABOUT-1920-03` | 1 _(dup)_ | "The images are not visible on this page." (second occurrence, different section) | — _(blank in the report)_          | Dev      |

### Laptop — 1280 · Mobile — 440

_Both "Working Fine" — no items._

**About Us total: 3.**

---

## Blog

Report page link: `https://backend.trainingexcellence.org.uk/blog`
Figma: `4900:75788`

### Desktop — 1920

| Item             | label | Issue                                                                            | Solution(Dev)                                                                      | Assignee |
| ---------------- | ----- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------- |
| `R-BLOG-1920-01` | 1     | "The Hero section doesn't match the design."                                     | "The hero section will have a gradient color and a pattern bottom of the section." | Dev      |
| `R-BLOG-1920-02` | 2     | "The image is not totally visible."                                              | "The image should be fully visible."                                               | Dev      |
| `R-BLOG-1920-03` | 3     | "When hovered, the button color doesn't change at all."                          | "There should be a hover effect on the button."                                    | Dev      |
| `R-BLOG-1920-04` | 4     | "In the blog card, there isn't much space to write the full name of the months." | "So we can write the month name in short form like Jan, Feb, Mar etc."             | Dev      |
| `R-BLOG-1920-05` | 5     | "There is no spacing between the final CTA section and the footer."              | "There will be **80px** between the final CTA section and the footer."             | Dev      |

### Laptop — 1280 · Mobile — 440

_Both "Working Fine" — no items._

**Blog total: 5.**

---

## Single Blog

Report page link: `https://backend.trainingexcellence.org.uk/blog/how-to-get-a-nursing-assistant-certification`
Figma: `4040:11134` · mobile ToC `4146:87332`

### Desktop — 1920

| Item              | label | Issue                                                                                                     | Solution(Dev)                                                                      | Assignee |
| ----------------- | ----- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------- |
| `R-SBLOG-1920-01` | 1.1   | "The image is not totally visible."                                                                       | "The image should be fully visible."                                               | Dev      |
| `R-SBLOG-1920-02` | 1.2   | "The category name is incorrect."                                                                         | "The category name should be corrected."                                           | Dev      |
| `R-SBLOG-1920-03` | 2     | "According to the design, there won't be any image in this place."                                        | "Remove the image from here."                                                      | Dev      |
| `R-SBLOG-1920-04` | 3     | "According to the design, there won't be any image in this place." (second location)                      | "Remove the image from here."                                                      | Dev      |
| `R-SBLOG-1920-05` | 4     | "The table of contents doesn't work properly. It doesn't take into account the content which is clicked." | "The table of contents should take to the content which is clicked."               | Dev      |
| `R-SBLOG-1920-06` | 5     | "There is no body text in the blog content. There will be 2 different texts. Header and body text."       | "The body text will be **16px regular** and the title will be **H2 (32px bold)**." | Dev      |
| `R-SBLOG-1920-07` | 6     | "The FAQ section is not similar to the actual design."                                                    | "The FAQ section will be similar to the actual design."                            | Dev      |

### Laptop — 1280

| Item              | label | Issue                                                                      | Solution(Dev)                                                         | Assignee |
| ----------------- | ----- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------- |
| `R-SBLOG-1280-01` | 8     | "There is no padding on the navbar and hero section of laptop responsive." | "There will be **128px** padding on the hero section and the navbar." | Dev      |

### Mobile — 440

| Item             | label | Issue                                                                                        | Solution(Dev)                                                                                             | Assignee |
| ---------------- | ----- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------- |
| `R-SBLOG-440-01` | 9     | "In the mobile responsive, the table of contents section is placed like any other sections." | "The table of contents is sticky on the bottom of the screen and when clicked, it will be open floating." | Dev      |

**Single Blog total: 9.**

---

## Contact

Report page link: `https://backend.trainingexcellence.org.uk/contact-us`
Figma: `3277:44993` · Report note: "Contact Us Page will be merged with Help & FAQ"

### Desktop — 1920

| Item                | label | Issue                                                 | Solution(Dev)                                        | Assignee |
| ------------------- | ----- | ----------------------------------------------------- | ---------------------------------------------------- | -------- |
| `R-CONTACT-1920-01` | 1     | "The section colors are not according to the design." | "Change the section colors according to the design." | Dev      |

### Laptop — 1280 · Mobile — 440

_Both "Working Fine" — no items._

**Contact total: 1.**

---

## Course Category

Report page link: `https://backend.trainingexcellence.org.uk/course-cat/animal-care-training`
Figma: `3294:42427`

### Desktop — 1920

| Item            | label | Issue                                                                                    | Solution(Dev)                                               | Assignee |
| --------------- | ----- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------- | -------- |
| `R-CAT-1920-01` | 1     | "The background color does not match the actual design."                                 | "The Background needs to be matched with the figma design." | Dev      |
| `R-CAT-1920-02` | 2     | "There is an FAQ section on the Category page. But in website, there is no FAQ section." | "Add the FAQ section under the courses."                    | Dev      |
| `R-CAT-1920-03` | 4     | "The image on the 'Why Choose Us' section is not showing."                               | "The image of this section needs to be visible."            | Dev      |

### Laptop — 1280

| Item            | label | Issue                                                                      | Solution(Dev)                                                      | Assignee |
| --------------- | ----- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------- |
| `R-CAT-1280-01` | 5     | "There is no padding on the navbar and hero section of laptop responsive." | "In laptop responsive, there will be 128px padding on both sides." | Dev      |

### Mobile — 440

| Item           | label | Issue                                                                     | Solution(Dev)                                 | Assignee |
| -------------- | ----- | ------------------------------------------------------------------------- | --------------------------------------------- | -------- |
| `R-CAT-440-01` | 7     | "The spacing between these sections is too much."                         | "The spacing here will be **40px**."          | Dev      |
| `R-CAT-440-02` | 8     | "The image of the Why choose us section is missing in mobile responsive." | "Add the image on the Why choose us section." | Dev      |

**Course Category total: 6.**

---

## All Courses

Report page link: `https://backend.trainingexcellence.org.uk/all-courses`
Figma: `3306:50109`

### Desktop — 1920

| Item                | label     | Issue                                                   | Solution(Dev)                                                                                                                            | Assignee |
| ------------------- | --------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `R-COURSES-1920-01` | 1         | "The marked pattern is missing in this design."         | "Add the pattern bottom of the hero section."                                                                                            | Dev      |
| `R-COURSES-1920-02` | 2         | "The unselected checkboxes have black fill color."      | "The unselected checkboxes will have white background with subtle borders. Also the selected box will have the **Secondary 500** Color." | Dev      |
| `R-COURSES-1920-03` | 2 _(dup)_ | "In the CTA, there are courses written multiple times." | "Remove one course from the CTA."                                                                                                        | Dev      |

### Laptop — 1280

_"Working Fine" — no items._

### Mobile — 440

| Item               | label | Issue                                      | Solution(Dev)                                      | Assignee |
| ------------------ | ----- | ------------------------------------------ | -------------------------------------------------- | -------- |
| `R-COURSES-440-01` | 2     | "There are huge mobile responsive issues." | "The mobile responsive needs to be done properly." | Dev      |

**All Courses total: 4.**

---

## Single Course

Report page link: `https://backend.trainingexcellence.org.uk/course/dog-grooming-and-training-course`
Figma: `3633:58383` — **wrong node**, resolves to the same node the report cites for Privacy Policy

### Desktop — 1920

| Item               | label     | Issue                                                          | Solution(Dev)                                                                 | Assignee |
| ------------------ | --------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------- |
| `R-COURSE-1920-01` | 1         | "There is a background image on the hero section."             | "The image needs to be removed from the background."                          | Dev      |
| `R-COURSE-1920-02` | 2         | "The body text's length is shorter than the other body texts." | "The body text's length could be longer like the bottom body text."           | Dev      |
| `R-COURSE-1920-03` | 3         | "The body text looks so cluttered."                            | "The body text's line height will be **150%**."                               | Dev      |
| `R-COURSE-1920-04` | 4         | "The arrow icons are almost invisible."                        | "Make the icons visible."                                                     | Dev      |
| `R-COURSE-1920-05` | 4 _(dup)_ | "The **related course** Section title is too short in size."   | "Make the section title like the other section titles of the page."           | Dev      |
| `R-COURSE-1920-06` | 4 _(dup)_ | "If this button is clicked it takes to the checkout page."     | "Instead of taking to the checkout page it should take to the **cart** page." | Dev      |
| `R-COURSE-1920-07` | 5         | "There is no need for breadcrumbs."                            | "Remove the breadcrumbs."                                                     | Dev      |
| `R-COURSE-1920-08` | 6         | "The hours are unnecessary for this section."                  | "Remove the hours from the course curriculum."                                | Dev      |
| `R-COURSE-1920-09` | 7         | "There is no hover on the FAQ plus/minus icon."                | "Add hover to the plus/minus icons."                                          | Dev      |
| `R-COURSE-1920-10` | 8         | "There is no hover on the for me and for teams options."       | "Add hover to these options."                                                 | Dev      |

### Laptop — 1280

_"Working Fine" — no items._

### Mobile — 440

| Item              | label | Issue                                                        | Solution(Dev)                                                             | Assignee |
| ----------------- | ----- | ------------------------------------------------------------ | ------------------------------------------------------------------------- | -------- |
| `R-COURSE-440-01` | 8     | "Rating doesn't match with the course card."                 | "The rating should match the course card ratings."                        | Dev      |
| `R-COURSE-440-02` | 4     | "In this section, the body texts are broken (bullet point)." | "The body text lines need to be completed before going to the next line." | Dev      |

**Single Course total: 12.**

> `R-COURSE-440-01` is why this file exists. It was filed as `BLOCKED-DESIGN` on the
> reading that its `Solution(Dev)` was blank. It is not blank, and the row sat blocked for
> two days on a misreading nothing could catch.

---

## Privacy Policy

Report page link: cites a Figma URL, not a page URL — **the report's link is wrong**
Figma: `3633:58383` — the same node it cites for Single Course

### Desktop — 1920

| Item                | label | Issue                                          | Solution(Dev)                                        | Assignee     |
| ------------------- | ----- | ---------------------------------------------- | ---------------------------------------------------- | ------------ |
| `R-PRIVACY-1920-01` | 2     | "The body text of this page is too cluttered." | "The line height of the body text will be **150%**." | Dev          |
| `R-PRIVACY-1920-02` | 3     | "Email & Numbers are not properly visible."    | "The email & number have to be more visible."        | Design & Dev |

### Laptop — 1280 · Mobile — 440

_Both marked "Same Issue" — the two 1920 items apply at all three widths; no separate items._

**Privacy Policy total: 2.**

---

## Team Training

_"There is no Team Training Page Available." — no items. The absence is the finding, and
it is Class D (net-new build)._

**Team Training total: 0.**

---

## FAQ / Help

Report page link: `https://backend.trainingexcellence.org.uk/help`
Figma: `6239:109818`

### Desktop — 1920

| Item             | label     | Issue                                                         | Solution(Dev)                                            | Assignee |
| ---------------- | --------- | ------------------------------------------------------------- | -------------------------------------------------------- | -------- |
| `R-HELP-1920-01` | 1         | "The hero section is different from the actual figma design." | — _(blank in the report)_                                | Dev      |
| `R-HELP-1920-02` | 1 _(dup)_ | "The FAQ section is different from the actual design."        | "The FAQ section has to be similar to the figma design." | Dev      |

### Laptop — 1280 · Mobile — 440

_Both "Working Fine" — no items._

**FAQ / Help total: 2.**

---

## Cart

Report page link: `https://backend.trainingexcellence.org.uk/cart`
Figma: `6239:113878`

### Desktop — 1920

| Item             | label | Issue                                                          | Solution(Dev)                                                       | Assignee |
| ---------------- | ----- | -------------------------------------------------------------- | ------------------------------------------------------------------- | -------- |
| `R-CART-1920-01` | 1     | "The card doesn't cover all the contents of the figma design." | "The card will have all the contents available on the design card." | Dev      |

### Laptop — 1280

_"Working Fine" — no items._

### Mobile — 440

| Item            | label | Issue                                                                                                        | Solution(Dev)                                                                                                                                                                       | Assignee |
| --------------- | ----- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `R-CART-440-01` | 1     | "The price and the cross are in the middle of the screen. They don't look good on the middle of the screen." | "They can be placed on the right side of the screen like the second image." **OR** "Only the cross icon can be placed on the right side of the screen, leaving the price as it is." | Dev      |

**Cart total: 2.** `R-CART-440-01` offers two alternatives and picks neither — a product decision, not a spec.

---

## Checkout

Report page link: `https://backend.trainingexcellence.org.uk/checkout`
Figma: `6239:134328`

### Desktop — 1920

| Item              | label | Issue                                                                                       | Solution(Dev)                                                                | Assignee     |
| ----------------- | ----- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------ |
| `R-CHECK-1920-01` | 1.1   | "The logos of the VISA, JCB etc. are not actual logos."                                     | "The logos need to be actual logos."                                         | Dev          |
| `R-CHECK-1920-02` | 1.2   | "The paypal coming soon is not needed here."                                                | "Remove the paypal coming soon option."                                      | Dev          |
| `R-CHECK-1920-03` | 2     | "This section is missing on the website while it is available on the figma design."         | "Add the section into the checkout page."                                    | Dev          |
| `R-CHECK-1920-04` | 3     | "The dropdown is too much on the right side of the text field. There is almost no padding." | "Add some padding (**16px**) on the right side of the dropdown."             | Dev          |
| `R-CHECK-1920-05` | 4     | "There are no trusted lines on the checkout page."                                          | "Add trusted lines like money back guarantee, secure payment etc for trust." | Design & Dev |

### Laptop — 1280 · Mobile — 440

_Both "Working Fine" — no items._

**Checkout total: 5.**

> The report files **no heading issue** for Checkout. `QA-CHECK-A2` (section header weight
> and Title Case) has no item here — it was generalised from the Homepage's
> `R-HOME-1920-04` during triage.

---

## Pricing

Report page link: `https://backend.trainingexcellence.org.uk/pricing`
Figma: `6239:135726`

### Desktop — 1920

| Item              | label | Issue                                                                                               | Solution(Dev)                                           | Assignee     |
| ----------------- | ----- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------ |
| `R-PRICE-1920-01` | 1     | "The hero section is different from the actual design."                                             | "The section needs to be similar to the actual design." | Dev          |
| `R-PRICE-1920-02` | 2     | "These two sections have the same background color which made the design confusing."                | "The sections can be rearranged to solve the problem."  | Design       |
| `R-PRICE-1920-03` | 3     | "There is no need for this section in this page."                                                   | "Remove the section."                                   | Design & Dev |
| `R-PRICE-1920-04` | 4     | "The header of this section is bigger than the other section headers which breaks the consistency." | "Make the header's size like the other headers."        | Dev          |
| `R-PRICE-1920-05` | 5     | "There is a third pricing card missing."                                                            | "Add the third pricing card there."                     | Dev          |
| `R-PRICE-1920-06` | 6     | "In this section, there won't be any Button in the marked area."                                    | "Remove the button."                                    | Dev          |

### Laptop — 1280

_"Working Fine" — no items._

### Mobile — 440

| Item             | label | Issue                                                    | Solution(Dev)                                              | Assignee |
| ---------------- | ----- | -------------------------------------------------------- | ---------------------------------------------------------- | -------- |
| `R-PRICE-440-01` | 7     | "The spacing of this marked area is too much."           | "There will be 40px spacing."                              | Dev      |
| `R-PRICE-440-02` | 8     | "The title and the button are not horizontally aligned." | "The title and the button has to be horizontally aligned." | Dev      |

**Pricing total: 8.**

---

## Verify Certificate

Report page link: `https://backend.trainingexcellence.org.uk/verify-certificate`
Figma: `6239:110952`

### Desktop — 1920

| Item               | label | Issue                                                        | Solution(Dev)                                                     | Assignee |
| ------------------ | ----- | ------------------------------------------------------------ | ----------------------------------------------------------------- | -------- |
| `R-VERIFY-1920-01` | 1     | "The textfield in this section looks like more of a button." | "The text field background has to be white with a subtle border." | Dev      |

### Laptop — 1280 · Mobile — 440

_Both "Working Fine" — no items._

**Verify Certificate total: 1.**

---

## Cancellations

Report page link: `https://backend.trainingexcellence.org.uk/cancellations?refund=1#refund-form`
Figma: `6239:110952` — **the same node the report cites for Verify Certificate and Priority Support**
Report note: "Re-arrange needed for sections in this page"

### Desktop — 1920

| Item               | label     | Issue                                                            | Solution(Dev)                               | Assignee     |
| ------------------ | --------- | ---------------------------------------------------------------- | ------------------------------------------- | ------------ |
| `R-CANCEL-1920-01` | 1         | "The Button text label is not visible at all."                   | "Fix the Button text label color contrast." | Dev          |
| `R-CANCEL-1920-02` | 2         | "The icons background and the icons color do not stand out."     | "Fix the icon background and icon color."   | Dev & Design |
| `R-CANCEL-1920-03` | 2 _(dup)_ | "The Button text label is not visible at all." (second location) | "Fix the Button text label color contrast." | Dev & Design |

### Laptop — 1280 · Mobile — 440

_Both "Working Fine" — no items._

**Cancellations total: 3.** The report files **no hero-spacing issue** for this page.

---

## Priority Support

Report page link: `https://backend.trainingexcellence.org.uk/support-request?issue=access`
Figma: `6239:110952` — same wrong node again

### Desktop — 1920

| Item                | label | Issue                                                             | Solution(Dev)                                                      | Assignee     |
| ------------------- | ----- | ----------------------------------------------------------------- | ------------------------------------------------------------------ | ------------ |
| `R-SUPPORT-1920-01` | 2.1   | "There is no padding on the right side of the dropdowns."         | "There should be 16px padding on the right side of the dropdowns." | Dev & Design |
| `R-SUPPORT-1920-02` | 2.2   | "The height of the text box in Additional Details is not enough." | "The height of the text box will cover all the text in it."        | Dev & Design |

### Laptop — 1280 · Mobile — 440

_Both "Working Fine" — no items._

**Priority Support total: 2.**

---

## Totals

| Page               | Items  |
| ------------------ | ------ |
| Homepage           | 26     |
| About Us           | 3      |
| Blog               | 5      |
| Single Blog        | 9      |
| Contact            | 1      |
| Course Category    | 6      |
| All Courses        | 4      |
| Single Course      | 12     |
| Privacy Policy     | 2      |
| Team Training      | 0      |
| FAQ / Help         | 2      |
| Cart               | 2      |
| Checkout           | 5      |
| Pricing            | 8      |
| Verify Certificate | 1      |
| Cancellations      | 3      |
| Priority Support   | 2      |
| **Total**          | **91** |

Three pages carry a Figma node the report got wrong — Privacy Policy and Single Course
share one node, and Verify Certificate, Cancellations and Priority Support share another.
Those pages take measured targets from the live site instead (`QA_EXECUTION.md`,
finding 3).
