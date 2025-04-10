import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  esbuildOptions(options) {
    options.platform = 'neutral';
  },
  format: ['cjs', 'esm'],
  minify: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
  sourcemap: false,
});
