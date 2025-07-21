---
"@juun-roh/cesium-utils": patch
---

Refactor HybridTerrainProvider

refactor: Simplify class configurations

- **Simplified Configuration**: Reduced from 3 concepts (`HybridTerrainProvider`, `TerrainArea`, `TileRange`) to 1 main concept

- **Deprecated**: `TerrainArea`.

**NOTE**: Deprecated classes will be deleted on next minor update.

- Migration Examples:

Before:

```typescript
// Complex setup with multiple concepts
const tileRanges = new Map<number, TerrainArea.TileRange>();
tileRanges.set(15, { start: { x: 55852, y: 9556 }, end: { x: 55871, y: 9575 } });

const area = new TerrainArea({ 
  terrainProvider: customProvider, 
  tileRanges 
});

const hybridTerrain = new HybridTerrainProvider({
  terrainAreas: [area],
  terrainProvider: worldTerrain,
});
```

After:

```typescript
// Simple rectangle-based regions
const hybridTerrain = new HybridTerrainProvider({
  regions: [
    {
      provider: customProvider,
      bounds: Rectangle.fromDegrees(-120, 30, -100, 50),
      levels: [10, 15] // optional
    }
  ],
  defaultProvider: worldTerrain
});
 // Or tile-coordinate based for precise control (multiple levels)
const tileRanges = new Map();
tileRanges.set(15, { x: [55852, 55871], y: [9556, 9575] });
tileRanges.set(16, { x: [111704, 111742], y: [19112, 19150] });
 const hybridTerrain = new HybridTerrainProvider({
  regions: [
    {
      provider: customProvider,
      tiles: tileRanges
    }
  ],
  defaultProvider: worldTerrain
});
 viewer.terrainProvider = hybridTerrain;
```
