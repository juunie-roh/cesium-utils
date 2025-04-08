import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  publicDir: path.resolve(__dirname, 'tests/public'),
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'tests/index.html'),
      },
    },
  },

  server: {
    port: 3000,
    open: 'tests/index.html',
  },
  resolve: {
    alias: {
      'dist': path.resolve(__dirname, 'dist'),
    },
  },
});
