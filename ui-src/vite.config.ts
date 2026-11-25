import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { functionsMixins } from 'vite-plugin-functions-mixins'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    { ...functionsMixins({ deps: ['m3-svelte'] }), enforce: 'pre' },
    tailwindcss(),
    svelte(),
  ],
  build: {
    outDir: '../webroot',
    emptyOutDir: true,
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1500,
  },
})
