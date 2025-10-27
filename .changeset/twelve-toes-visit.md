---
"@juun-roh/cesium-utils": patch
---

test: Upgrade Vitest to 4.x and fix test compatibility

- **Vitest Upgrade**: Migrated from Vitest 3.x to 4.x
- **Mock Constructors**: Updated mock implementations to use `function` keyword instead of arrow functions (required by Vitest 4.x constructor support)
- **Mock Merge Fix**: Fixed mock object merge utility to skip read-only getter properties that cannot be overwritten in Vitest 4.x
- **CommonJS Test**: Converted `cjs-require.test.cjs` to `cjs-require.test.mjs` using ESM with `createRequire` pattern (Vitest 4.x no longer supports `require('vitest')`)
- **Viewer Clone Test**: Updated to use `mockImplementation` instead of `mockReturnValue` for constructor mocks
- **TypeScript Compatibility**: Fixed spy type annotations to use `MockInstance` instead of `ReturnType<typeof vi.spyOn>` for Vitest 4.x type compatibility
