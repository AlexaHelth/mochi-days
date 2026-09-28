import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// GitHub Pages build (https://alexahelth.github.io/mochi-days/): static files only, without the
// Sites server, ChatGPT sign-in or D1. Records stay in the browser (lib/device-store.ts).
// The Sites build keeps using vite.config.ts.
const project = resolve(fileURLToPath(new URL(".", import.meta.url)));
const entries = resolve(project, "github-pages");

export default defineConfig({
  root: entries,
  // The Pages workflow passes the site's path; "/" would suit a custom domain.
  base: process.env.PAGES_BASE || "/mochi-days/",
  publicDir: resolve(project, "public"),
  resolve: { alias: { "@": project } },
  css: { postcss: project },
  plugins: [react()],
  build: {
    outDir: resolve(project, "dist-pages"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(entries, "index.html"),
        install: resolve(entries, "install.html"),
      },
    },
  },
});
