---
"@juun-roh/cesium-utils": patch
---

Fix dual-package exports and declaration file generation

**Build Configuration**:

- Split tsup config into two passes: one for JS bundles (`dts: false`) and one for type declarations only (`dts: { only: true }`)
- Declaration pass generates both `.d.ts` (ESM) and `.d.cts` (CJS) files from a single `src/index.ts` entry point

**Package Exports**:

- Refactored all entry point exports to use nested `import`/`require` conditions
- Each subpath now correctly points to `.d.ts` for ESM consumers and `.d.cts` for CJS consumers, resolving type resolution issues in dual-package setups
- Affects all entry points: `.`, `./collection`, `./highlight`, `./terrain`, `./terrain/dev`, `./dev`, `./viewer`, `./experimental`

**Type Exports**:

- Added `export type *` re-exports for `dev`, `experimental`, and `terrain/dev` modules from the main entry point
- Consumers importing from `@juun-roh/cesium-utils` now have access to all public types across all submodules without needing separate subpath imports
