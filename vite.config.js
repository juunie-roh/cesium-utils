import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  publicDir: path.resolve(__dirname, 'src/demo/public'),
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/demo/index.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: 'src/demo/index.html',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.*'],
    exclude: ['**/node_modules/**', '**/docs/**'],
    coverage: {
      include: ['src/**'],
      exclude: ['**/index.*', '**/demo/**', '**/*.types.*'],
    }
  },
});
