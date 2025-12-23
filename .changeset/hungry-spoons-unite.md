---
"@juun-roh/cesium-utils": patch
---

New Type Utilities for Nested Property Paths

feat: Add recursive type utilities for type-safe nested object property access

This change introduces advanced TypeScript type utilities inspired by the pattern from [next-intl's MessageKeys](https://github.com/amannn/next-intl/blob/main/packages/use-intl/src/core/MessageKeys.tsx).

**New Type Utilities** (exported from `@juun-roh/cesium-utils/dev`):

- **`NestedKeyOf<T>`**: Recursively generates a union type of all possible property paths using dot notation (e.g., `"billboard.scale" | "billboard.show" | "name"`). Limited to 3 levels of depth to prevent infinite type recursion and excludes function properties.

- **`NestedValueOf<T, Path>`**: Extracts the value type from a nested property path string, ensuring type safety when working with deeply nested structures.

These utilities enable developers to build type-safe APIs that work with nested object properties using dot notation paths.
