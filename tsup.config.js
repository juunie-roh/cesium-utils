import { defineConfig } from "tsup";

export default defineConfig([
  {
    clean: true,
    dts: false,
    entry: [
      "src/index.ts",
      "src/collection/index.ts",
      "src/highlight/index.ts",
      "src/terrain/index.ts",
      "src/terrain/dev/index.ts",
      "src/dev/index.ts",
      "src/viewer/index.ts",
      "src/experimental/index.ts",
    ],
    esbuildOptions(options) {
      options.platform = "neutral";
    },
    format: ["cjs", "esm"],
    minify: true,
    target: "esnext",
    splitting: false,
    external: ["cesium"], // Already handled by listing on peerDependencies
    outExtension({ format }) {
      return {
        js: format === "cjs" ? ".cjs" : ".js",
      };
    },
    sourcemap: false,
  },
  {
    clean: false,
    dts: { only: true },
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    outExtension: ({ format }) => ({
      dts: format === "cjs" ? ".d.cts" : ".d.ts",
    }),
    splitting: false,
    target: "esnext",
    external: ["cesium"],
  },
]);
