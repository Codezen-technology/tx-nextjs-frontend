import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    env: {
      NEXT_PUBLIC_WP_API_URL: "http://localhost",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    },
    exclude: ["**/node_modules/**", "**/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/lib/**/*.ts", "src/components/**/*.tsx", "src/app/**/*.tsx"],
      exclude: ["**/*.d.ts", "**/node_modules/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` is a build-time boundary marker with no runtime entry
      // point Vitest can resolve.
      "server-only": path.resolve(__dirname, "src/__tests__/mocks/server-only.ts"),
    },
  },
});
