import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  build: {
    outDir:      'dist',
    assetsDir:   '_app',
    emptyOutDir: true,
    sourcemap:   false,   // no source maps in production kiosk build

    rollupOptions: {
      output: {
        // Content-hashed filenames for immutable caching
        entryFileNames: '_app/[name]-[hash].js',
        chunkFileNames: '_app/[name]-[hash].js',
        assetFileNames: '_app/[name]-[hash][extname]',

        // Keep the page-flip library in its own chunk so Caddy's
        // "immutable" Cache-Control header keeps it cached across
        // app-code updates — the library never changes.
        manualChunks(id) {
          if (id.includes('page-flip')) return 'vendor-pageflip';
        },
      },
    },
  },
});
