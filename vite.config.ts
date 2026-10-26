import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        // React and the router change far less often than app code, so they get their own
        // chunk that browsers keep cached across deploys
        manualChunks(id) {
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) {
            return 'react';
          }
          // Every translation file, loaded at startup like the entry but kept out of it so the entry
          // stays under Vite's size warning. JSON imports nothing, so this chunk can't form a cycle
          if (/[\\/]src[\\/].*[\\/]i18n[\\/].*\.json$/.test(id)) {
            return 'locales';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});