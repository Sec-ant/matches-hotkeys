import { cpSync, writeFileSync } from "node:fs";
import { playwright } from "@vitest/browser-playwright";
import dts from "vite-plugin-dts";
import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: "src/index.ts",
      name: "MatchesHotkeys",
    },
    rollupOptions: {
      output: [
        {
          format: "es",
          dir: "dist/es",
          entryFileNames: "index.js",
        },
        {
          format: "cjs",
          dir: "dist/cjs",
          entryFileNames: "index.js",
        },
        {
          format: "iife",
          dir: "dist/iife",
          name: "MatchesHotkeys",
          entryFileNames: "index.js",
        },
      ],
    },
  },
  plugins: [
    dts({
      outDir: "dist/es",
      rollupTypes: true,
      afterBuild() {
        cpSync("dist/es/index.d.ts", "dist/cjs/index.d.ts");
      },
    }),
    {
      name: "cjs-package-json",
      writeBundle(options) {
        if (options.format === "cjs" && options.dir) {
          writeFileSync(
            `${options.dir}/package.json`,
            `${JSON.stringify({ type: "commonjs" }, undefined, 2)}\n`,
          );
        }
      },
    },
  ],
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
      ],
      provider: playwright(),
      headless: true,
      screenshotFailures: false,
    },
    include: ["tests/**/*.test.ts"],
    includeSource: ["src/**/*.{js,ts}"],
  },
  define: {
    "import.meta.vitest": "undefined",
  },
});
