import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  root: "pages",
  base: "/chinese-study/",
  plugins: [react()],
  build: {
    outDir: resolve(import.meta.dirname, "pages-dist"),
    emptyOutDir: true,
  },
});
