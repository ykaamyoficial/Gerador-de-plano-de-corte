import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base is overridden by the GitHub Pages workflow to "/<repository-name>/";
// locally it stays "/" so `npm run dev` and `npm run preview` work as expected.
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
})
