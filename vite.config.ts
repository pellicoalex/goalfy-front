import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { devtools } from '@tanstack/devtools-vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devtools()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
