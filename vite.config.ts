import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
      },
      formats: ["es"],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    outDir: "dist/es",
  },
  test: {
    coverage: {
      enabled: false,
      provider: "istanbul",
      include: ["src"],
    },
    browser: {
      enabled: true,
      instances: [
        {
          browser: "chromium",
        },
        // {
        //   browser: "firefox",
        // },
        // {
        //   browser: "webkit",
        // },
      ],
      provider: playwright(),
      headless: true,
      screenshotFailures: false,
    },
    // Ensure test files are included
    include: ["tests/**/*.test.ts"],
    // Enable inline tests in source files
    includeSource: ["src/**/*.{js,ts}"],
  },
  // Define vitest when bundling for production
  define: {
    "import.meta.vitest": "undefined",
  },
});
