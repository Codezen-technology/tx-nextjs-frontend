## REMOVED Requirements

### Requirement: The course page shows no visual breadcrumb trail

**Reason**: Subsumed by the site-wide `site-breadcrumb-suppression` capability, which
states the same rule for every page and keeps a dedicated scenario for this page's
`BreadcrumbList` structured data. Keeping a per-page copy leaves three specs asserting
one rule, which drift independently.

**Migration**: None — the behaviour is unchanged and still normative. Read the rule at
`openspec/specs/site-breadcrumb-suppression/spec.md`; the e2e assertion
`e2e/course-detail.spec.ts > QA-COURSE-A2` continues to cover this page.
