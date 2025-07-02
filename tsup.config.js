import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: [
    "src/index.ts",
    "src/collection/index.ts",
    "src/highlight/index.ts",
    "src/terrain/index.ts",
    "src/utils/index.ts",
    "src/viewer/index.ts",
  ],
  esbuildOptions(options) {
    options.platform = "neutral";
  },
  format: ["cjs", "esm"],
  minify: true,
  target: "esnext",
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs" : ".js",
    };
  },
  sourcemap: false,
});
