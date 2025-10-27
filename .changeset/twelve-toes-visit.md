---
"@juun-roh/cesium-utils": patch
---

fix: Fix type error

- **TypeScript Compatibility**: Fixed spy type annotations to use `MockInstance` instead of `ReturnType<typeof vi.spyOn>` for Vitest 4.x type compatibility
