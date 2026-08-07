/**
 * Stub for Next's `server-only` marker.
 *
 * The package exists to fail a build that imports a server module into client
 * code; under Vitest there is no such boundary and the real module has no
 * resolvable entry point. Aliased in `vitest.config.ts`.
 */
export {};
