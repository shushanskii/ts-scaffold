import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Keep in sync with `base` in src/api/todos.
const apiPrefix = "/api";
const apiTarget = process.env.API_URL ?? "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
  },
  server: {
    proxy: {
      [apiPrefix]: {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(new RegExp(`^${apiPrefix}`), ""),
      },
    },
  },
});
