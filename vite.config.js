import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  publicDir: path.resolve(__dirname, "src/demo/public"),
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "src/demo/index.html"),
      },
    },
  },
  server: {
    port: 3000,
    open: "src/demo/index.html",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["src/**/*.(test|spec).*"],
    exclude: ["**/node_modules/**", "**/docs/**"],
    environment: "jsdom",
    coverage: {
      include: ["src/**"],
      exclude: [
        "**/index.*",
        "src/demo/**",
        "**/*.types.*",
        "src/__tests__/**",
        "**/__mocks__/**",
      ],
    },
  },
});
