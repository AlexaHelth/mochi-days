import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// GitHub Pages / Cloudflare Pages build: static files only, without the
// Sites server, ChatGPT sign-in or D1. Records stay in the browser (lib/device-store.ts).
// The Sites build keeps using vite.config.ts.
const project = resolve(fileURLToPath(new URL(".", import.meta.url)));
const entries = resolve(project, "github-pages");

export default defineConfig(({ mode }) => ({
  root: entries,
  // Cloudflare Direct Upload serves the app from the domain root.
  // The GitHub Pages workflow retains its configured repository path.
  base: mode === "cloudflare" ? "/" : process.env.PAGES_BASE || "/mochi-days/",
  publicDir: resolve(project, "public"),
  resolve: { alias: { "@": project } },
  css: { postcss: project },
  plugins: [react()],
  build: {
    outDir: resolve(project, mode === "cloudflare" ? "dist-cloudflare" : "dist-pages"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(entries, "index.html"),
        install: resolve(entries, "install.html"),
      },
    },
  },
}));
