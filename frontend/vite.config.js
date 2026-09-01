import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Himalayan Learning Grid — frontend build config.
// The PWA plugin generates the service worker that caches the app shell and
// cached lesson data so the student app keeps working with the network off.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Himalayan Learning Grid",
        short_name: "HLG",
        description: "Offline-first AI education platform for remote Himalayan communities.",
        theme_color: "#0E1826",
        background_color: "#0E1826",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // App shell: cache-first. API GETs: network-first with an offline fallback
        // to the last cached response, so lessons/progress still render offline.
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) => url.pathname.startsWith("/api/") && request.method === "GET",
            handler: "NetworkFirst",
            options: {
              cacheName: "hlg-api-cache",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      // In dev, requests to /api/* are forwarded to the Express backend so the
      // frontend never needs to hardcode a host.
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
