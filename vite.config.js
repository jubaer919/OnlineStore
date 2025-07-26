// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "assets",
    emptyOutDir: false,
    rollupOptions: {
      input: "./src/js/theme.js",
      output: {
        entryFileNames: "theme.js", // Shopify will load this
        format: "iife", // Shopify doesn’t support ES modules directly
      },
    },
  },
});
