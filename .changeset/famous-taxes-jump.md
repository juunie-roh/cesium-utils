---
"@juun-roh/cesium-utils": minor
---

API Reorganization and Import Optimization

refactor: Namespace integration and import separation

- Move `TerrainAreaCollection` into `TerrainArea` namespace as `TerrainArea.Collection`
  The standalone `TerrainAreaCollection` export has been removed. Users should now use `TerrainArea.Collection` instead.
  
  ```typescript
  // Before
  import { TerrainAreaCollection, TerrainArea } from "@juun-roh/cesium-utils";
  const areas = new TerrainAreaCollection();
  
  // After  
  import { TerrainArea } from "@juun-roh/cesium-utils";
  const areas = new TerrainArea.Collection();
  ```

- **Improved TypeDoc organization**: Related functionality is now properly grouped under class namespaces:

  - TerrainArea.ConstructorOptions
  - TerrainArea.fromUrl()
  - TerrainArea.Collection

- **Import separation for future compatibility**: Separate type imports from instance imports across all modules to prepare for potential Cesium modular exports and improve tree-shaking.

```typescript
// Type imports - compile-time only
import type { Credit, Request, TerrainProvider } from "cesium";
// Instance imports - runtime dependencies  
import { EllipsoidTerrainProvider, Rectangle } from "cesium";
```

- **Consistent namespace pattern**: Establishes uniform API organization across the library (Collection.Tag, Highlight.Options, TerrainArea.Collection, etc.)
- **Better bundle optimization**: Type-only imports don't affect bundle size and prepare the library for future Cesium architectural changes.
