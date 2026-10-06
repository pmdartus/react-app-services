import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'

// Kept apart from vite.config.ts: unit tests don't need the router or Tailwind plugins.
export default defineConfig({
  plugins: [viteReact()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
})
