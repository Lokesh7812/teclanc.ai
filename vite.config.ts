// vite.config.ts (FIXED VERSION)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    // ... (Your existing plugins)
 react(),

    runtimeErrorOverlay(),

    ...(process.env.NODE_ENV !== "production" &&

    process.env.REPL_ID !== undefined

      ? [

          await import("@replit/vite-plugin-cartographer").then((m) =>

            m.cartographer(),

          ),

          await import("@replit/vite-plugin-dev-banner").then((m) =>

            m.devBanner(),

          ),

        ]

      : []),
  ],
  resolve: {
  alias: {

      "@": path.resolve(import.meta.dirname, "client", "src"),

      "@shared": path.resolve(import.meta.dirname, "shared"),

      "@assets": path.resolve(import.meta.dirname, "attached_assets"),

    },
    // ... (Your existing resolve/alias config)
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
  outDir: path.resolve(import.meta.dirname, "dist/public"),

    emptyOutDir: true,
    // ... (Your existing build config)
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // ➡️ 🔑 ADD THIS PROXY SECTION 🔑 ⬅️
    proxy: {
        // Intercept any request starting with /api
        '/api': {
            // Forward it to your Express backend running on port 5000
            target: 'http://localhost:5000', 
            changeOrigin: true, // Needed for virtual hosting
            secure: false, // Use if targeting a non-HTTPS backend
            // Optionally, rewrite the path if your Express app didn't use the /api prefix,
            // but since your backend uses /api, this is fine.
        },
    },
  },
});