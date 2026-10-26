import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In dev, /api calls go to the Express server so cookies stay same-origin.
    proxy: { '/api': 'http://localhost:4000' },
  },
})
