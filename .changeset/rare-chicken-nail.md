---
"@juun-roh/cesium-utils": patch
---

Reorganize module structure and relocate development utilities

refactor: Move TerrainVisualizer to terrain-specific dev module

**Structural Changes**:

- Relocated `TerrainVisualizer` from `src/dev/` to `src/terrain/dev/` for better module organization
- Added new export path `@juun-roh/cesium-utils/terrain/dev` for terrain-specific development utilities
- Updated `src/dev/` to contain only deprecation utilities (`Deprecate`, `deprecate`)
- Co-located test files with their source modules instead of centralized `src/__tests__/` directory

**Import Path Updates**:

```typescript
// Before
import { TerrainVisualizer } from "@juun-roh/cesium-utils/dev";

// After
import { TerrainVisualizer } from "@juun-roh/cesium-utils/terrain/dev";
```

**Note**: This change improves module organization by grouping terrain-related development tools together, making the codebase more maintainable and easier to navigate
