import { defineConfig } from "vite";
import { sharedConfig } from "./vite.config";
import { r, isDev } from "./scripts/utils";
import packageJson from "./package.json";

// This config now builds only one content script: injected.js
export default defineConfig({
  ...sharedConfig,
  build: {
    watch: isDev
      ? {
          include: [r("src/contentScripts/**/*"), r("src/components/**/*")],
        }
      : undefined,
    outDir: r("extension/dist/contentScripts"),
    cssCodeSplit: false,
    emptyOutDir: false,
    sourcemap: isDev ? "inline" : false,
    lib: {
      // Change entry to injected.js
      entry: r("src/contentScripts/core/injected.js"),
      name: packageJson.name,
      formats: ["iife"], // Keep iife for single file, no code splitting
    },
    rollupOptions: {
      output: {
        // Rename to injected.js to match our single content script
        entryFileNames: "injected.js",
        extend: true,
      },
    },
  },
  plugins: [...(sharedConfig.plugins || [])],
});