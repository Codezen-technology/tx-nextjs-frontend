import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // ── Next.js 16 upgrade: React Compiler / react-hooks v6 rules ──────────────
      // These rules ship newly-enabled in eslint-config-next 16. They flag valid
      // existing patterns (e.g. the canonical next-themes `mounted` setState, scroll
      // listeners) that need per-site refactors, not bulk edits. Downgraded to `warn`
      // so `pnpm lint` stays green; tracked for cleanup in docs/NEXTJS_16_MIGRATION.md.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/static-components": "warn",
      // Perf/quality, not correctness — converting <img> → next/image needs correct
      // per-image dimensions to avoid layout shift. Tracked for cleanup.
      "@next/next/no-img-element": "warn",
    },
  },
];
