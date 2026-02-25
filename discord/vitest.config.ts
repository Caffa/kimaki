// Vitest configuration for the kimaki discord package.
// Injects KIMAKI_VITEST=1 so config.ts and db.ts auto-isolate from the real
// ~/.kimaki/ database and the running bot's Hrana server.

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: {
      KIMAKI_VITEST: '1',
    },
  },
})
