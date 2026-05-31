import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "192.168.1.18",

      // Allow all ngrok free app preview URLs.
      // Example: https://ac2e-91-140-44-199.ngrok-free.app
      ".ngrok-free.app"
    ]
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["recharts"],
          data: ["dexie", "date-fns"],
          ui: ["lucide-react", "zustand"]
        }
      }
    }
  },

  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "generateSW",
      includeAssets: [
        "icons/favicon-16.png",
        "icons/favicon-32.png",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/maskable-512.png",
        "icons/apple-touch-icon-180.png"
      ],
      manifest: {
        name: "Fit Quest",
        short_name: "Fit Quest",
        lang: "en",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#080B12",
        background_color: "#080B12",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
        runtimeCaching: []
      },
      devOptions: {
        enabled: false
      }
    })
  ]
});
