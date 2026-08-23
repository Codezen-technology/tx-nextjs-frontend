## Context

See `proposal.md` — **Why**. Everything below was measured before the change was written:
the running build at 1280 and 1920, and the authoritative frame `6015:127141`
(`node-resolution.md` settled that pair).

### What the frame says

| Element            | Frame                                                                         | Build                                     |
| ------------------ | ----------------------------------------------------------------------------- | ----------------------------------------- |
| Container          | 1296 at x=312; ToC 306 · gutter 24 · rich text **636** · gutter 24 · rail 306 | matches                                   |
| Hero image         | `Image` 634×370, right of the heading                                         | matches                                   |
| Article column     | opens with **text**; one inline content image at y≈1258, 636×350              | opens with a **repeat of the hero image** |
| In-article heading | `Heading/Bold/H5` — SUSE **Bold 20px**, 1.2, `N900` #00204A                   | Open Sans **24px/600**                    |
| Body copy          | `Body/Regular` — Open Sans 400 **16px**, 1.5, `N500` #3B5374                  | 16px/400/24px, `N500` ✓                   |
| Side padding @1280 | 128                                                                           | **128** ✓ hero and header both            |

### The `A6` contradiction

The report asks for "H2 (32px bold)". The frame binds 20px. There is no 32px text anywhere
in the rich-text column — the only larger type on the page is the hero `h1`. Three values,
three sources: report 32, frame 20, build 24.

`design-token-fidelity` and finding 2 in `QA_EXECUTION.md` both say the frame wins and that
a value is never generalised from one page to another. So 20px ships and the contradiction
goes on the row, the same treatment the About Us heading weight got.

## Goals / Non-Goals

**Goals:**

- Close the five rows the measurements settle, each with evidence
- Leave `A7` measured to the pixel so the next slice is an edit, not an investigation

**Non-Goals:**

- Changing `CourseFaq`. See D3
- `D1`, the mobile ToC drawer — Class D, needs sizing
- Re-typing the shared `prose-wp` utility. It serves legal pages, course descriptions and
  bundle copy, none of which were measured against this frame

## Decisions

### D1 — Delete the article-top image, keep the hero's

Two elements render `image.url`: the hero (`page.tsx:~203`) and the article's opening block
(`page.tsx:~240`). The frame has the first and not the second. The article block goes.

Content images inside `contentWithIds` are untouched — those come from the post body and the
frame has one too.

### D2 — Scope the heading token with a modifier, not by re-typing `prose-wp`

A `prose-wp-article` class alongside `prose-wp` on the blog article, holding only the
heading rules. `prose-wp` keeps its current sizes for every other surface.

_Alternative considered — change `prose-wp`'s `h2` globally._ Rejected: it would re-type the
privacy policy, the course "about" section and bundle descriptions on the authority of one
blog frame. That is exactly the generalisation the runbook's finding 2 exists to prevent.

### D3 — Measure `A7`, do not fix it here

The frame's FAQ, read off `6015:127392`:

| Property        | Frame                                                    | `CourseFaq` today                      |
| --------------- | -------------------------------------------------------- | -------------------------------------- |
| Container fill  | `secondary-50` at **50% alpha**                          | `secondary-50` solid                   |
| Container shape | square                                                   | `rounded-lg` with a border             |
| Row padding     | 24                                                       | 24 ✓                                   |
| Row divider     | **`N30` #EBEDF1**                                        | `secondary-50`                         |
| Question type   | Open Sans **400** 16px, **`N500`**                       | 16px **500**, `N900`                   |
| Icon            | **24px**                                                 | 20px                                   |
| Answer panel    | outer 24 padding, inner `secondary-50` solid, 24 padding | `m-4` + `bg-secondary-100`, 24 padding |
| Answer type     | 14px, 1.5, `N500`                                        | 14px, `leading-relaxed`, `N600`        |

Seven deltas, all measurable — but `CourseFaq` also renders on the course page (signed off
after its own slice) and the category page. Applying the blog frame to it changes two pages
nobody asked about; adding a variant is a component decision worth making deliberately.

So the numbers go in `targets.md` and the row stays open with them attached. A row that
stays `STILL-BROKEN` **with a complete delta list** is honest; one closed on "looks close
enough" is not.

### D4 — `A3`, `A5` and `A8` close on measurement, with assertions

None needs code:

- `A3` — the rendered category equals the API's name for the post's first category
- `A5` — the build has exactly one duplicate image, which is `A4`; the frame's right rail
  holds a promo rectangle and no image, and neither rail component renders one
- `A8` — hero and header both compute 128px at 1280

Each still gets a test, because "measured once in August" is not a guard.

## Risks / Trade-offs

- **20px headings read as a weak hierarchy against 16px body** → it is what the frame binds;
  the row records the report's 32 so design can overrule with a ruling rather than a guess
- **Removing the article image changes a page users see** → it is a duplicate of the image
  200px above it; the frame does not have it
- **`A7` stays open and the page stays `RED`** → correct. Two rows still owe work
- **The `A5` verdict rests on this dataset** → the frame is the stronger evidence and it
  agrees: no image in the rail, none at the top of the rich-text column

## Migration Plan

No data or API change. One commit; `git revert` restores both.
