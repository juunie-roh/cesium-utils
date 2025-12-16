---
"@juun-roh/cesium-utils": minor
---

fix: Fix HybridTerrainProvider region delegation and terrain availability caching

## Bug Fixes

### HybridTerrainProvider

- **Fixed terrain data availability checking**: `getTileDataAvailable()` now returns `true` when a region contains a tile, regardless of the underlying provider's response
- **Fixed region delegation**: Terrain regions with providers that return `undefined` for `getTileDataAvailable()` (like `EllipsoidTerrainProvider`) now work correctly
- **Root cause**: Cesium caches terrain availability before requesting geometry. When `getTileDataAvailable()` doesn't return `true`, Cesium marks tiles as `FAILED` and triggers upsampling instead of calling `requestTileGeometry()`, preventing region delegation from working

### HybridImageryProvider (TerrainVisualizer)

- **Simplified upsampling detection**: Removed redundant `_defaultProviderCoversArea()` method
- **Clearer naming**: Renamed `_isInRegion()` to `_isInRegionOrUpsampled()` to better reflect its purpose
- **Improved logic**: Now directly delegates to default provider's `getTileDataAvailable()` for non-region tiles

## Technical Details

### Cesium's Terrain Loading Flow

1. **Availability Check**: Cesium calls `getTileDataAvailable(x, y, level)` first (in `prepareNewTile`)
2. **Early Exit**: If it returns `false` or the provider returns `undefined` and parent tile has no child available, tile state is set to `FAILED`
3. **Upsampling Trigger**: `FAILED` tiles trigger upsampling from parent tile instead of calling `requestTileGeometry()`
4. **Region Bypass**: Your defined regions never get a chance to provide data

### The Fix

Region definitions are now the **source of truth** for availability:

```typescript
getTileDataAvailable(x: number, y: number, level: number): boolean | undefined {
  // If any terrain region contains this tile, data IS available
  for (const region of this._regions) {
    if (HybridTerrainProvider.TerrainRegion.contains(region, x, y, level)) {
      return true; // Region definition is the source of truth
    }
  }

  // Fall back to default provider
  return this._defaultProvider.getTileDataAvailable(x, y, level);
}
```

## Resolved Limitation

### Zoom Level Override Within Regions

This fix resolves a previous limitation where you couldn't override higher zoom levels within configured terrain regions:

- **Previous behavior**: Level 16+ would continue using Provider A even if you wanted to use Provider B
- **Now works correctly**: You can define multiple regions at different zoom levels for the same geographic area

**Example**:

```typescript
const regions = [
  {
    provider: providerA,
    tiles: new Map().set(15, { x: [100, 110], y: [200, 210] })
  },
  {
    provider: providerB,
    tiles: new Map().set(16, { x: [200, 220], y: [400, 420] }) // Same area, higher zoom
  }
];
```

- **At level 15**: Uses Provider A (first region matches)
- **At level 16**: Uses Provider B (second region matches, first region doesn't have level 16 defined)
