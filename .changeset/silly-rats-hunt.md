---
"@juun-roh/cesium-utils": patch
---

feat: Add runtime deprecation warning system

- **New Deprecation Utility**: Introduce `Deprecate` namespace with comprehensive deprecation management tools.

  The new `Deprecate` namespace provides:
  - `Deprecate.warn()` - Shows runtime deprecation warnings with configurable options
  - `Deprecate.deprecate()` - Wraps functions with automatic deprecation warnings
  - `Deprecate.clear()` - Clears warning history (useful for testing)
  - `Deprecate.getWarningCount()` - Returns count of unique warnings shown
  - `Deprecate.hasShown()` - Checks if specific warning was shown
  - `Deprecate.Options` - TypeScript interface for warning configuration

- **Enhanced Developer Experience**: Existing deprecated APIs now show runtime warnings to help developers identify and migrate away from deprecated functionality.

  - `TerrainArea` constructor now shows deprecation warning on instantiation
  - `HybridTerrainProvider.computeRectangle()` shows warning when called
  - Both include removal version info (`v0.3.0`) and migration guidance

- **Configurable Warning System**:
  - Once-only warnings by default (prevents spam)
  - Customizable prefixes and removal version info
  - Optional stack traces for debugging (enabled by default)
  - Environment variable control via `CESIUM_UTILS_DISABLE_DEPRECATION_WARNINGS`
  - Browser and Node.js compatibility with graceful fallbacks

**Usage Examples:**

```typescript
import { TerrainArea } from "@juun-roh/cesium-utils";
import { Deprecate, deprecate } from "@juun-roh/cesium-utils/utils";

// Automatic warning when using deprecated APIs
const area = new TerrainArea({ /* ... */ }); 
// Console: "[DEPRECATED] TerrainArea is deprecated. Use HybridTerrainProvider.TerrainRegion instead. This feature will be removed in v0.3.0."

// Wrap your own deprecated functions (development/testing use)
const myOldFunction = deprecate(
  () => "legacy implementation",
  "myOldFunction() is deprecated. Use myNewFunction() instead."
);

// Control deprecation behavior (development/testing use)
Deprecate.warn("Custom deprecation message", {
  removeInVersion: "v2.0.0",
  includeStack: true
});

Deprecate.clear(); // Reset for testing
console.log(Deprecate.getWarningCount()); // Get warning statistics
```

**Migration Impact**: This is a non-breaking change that enhances the existing deprecation system with runtime warnings.
Existing deprecated APIs maintain their functionality while providing better user feedback.

**New Exports**:

- `Deprecate` namespace (available via `@juun-roh/cesium-utils/utils`)
- `deprecate` function (available via `@juun-roh/cesium-utils/utils`)

**Note**: The deprecation utilities are intentionally not exported from the main package entry point,
as they are primarily intended for development and testing purposes.
They remain accessible through the utils module for users who need to wrap their own deprecated functions.
