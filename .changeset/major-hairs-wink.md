---
"@juun-roh/cesium-utils": patch
---

feat: Replace entity-based visualization with HybridImageryProvider at TerrainVisualizer

- **TerrainVisualizer.show()** API changed from `show(level: number)` to `show(options?: { showTileCoordinates?: boolean, alpha?: number })`
- Removed `level` getter/setter - no longer needed with imagery-based approach
- Removed entity-based tile grid methods (`_displayTileGrid`, `_createTileEntity`, `_getTileColor`, etc.)
- Removed `collection` getter - entities no longer used for visualization

## New Features

### HybridImageryProvider

- New imagery provider that visualizes HybridTerrainProvider regions using colored canvas tiles
- Extends `GridImageryProvider` for proper integration with Cesium's imagery pipeline
- **Parent tile checking**: Mimics terrain upsampling by checking parent tiles up the hierarchy when requested level is not available
- **Performance**: GPU-accelerated rendering, handles thousands of tiles efficiently
- **Global coverage**: Shows all terrain regions across all zoom levels simultaneously

### TerrainVisualizer Enhancements

- **Primary visualization**: Now uses `HybridImageryProvider` instead of entities
- **New methods**:
  - `showImageryOverlay(alpha?: number)` - Enable imagery-based visualization
  - `hideImageryOverlay()` - Disable imagery overlay
  - `showTileCoordinates()` - Show tile coordinate grid
  - `hideTileCoordinates()` - Hide tile coordinate grid
  - `setAlpha(alpha: number)` - Adjust overlay transparency
- **Improved API**: Options-based `show()` method with sensible defaults
- **Auto-initialization**: Supports `tile: true` option in constructor to show visualization immediately

## Technical Improvements

- **Terrain upsampling behavior**: When zooming beyond available terrain levels (e.g., level 13 → 14+), the imagery provider walks up the tile hierarchy to find parent tiles, matching how Cesium reuses terrain geometry
- **Efficient rendering**: Imagery layers integrated into Cesium's rendering pipeline with automatic LOD management
- **Camera-independent**: Visualization persists regardless of camera movement, unlike entity-based approach
- **Color-coded regions**:
  - RED: Custom terrain regions
  - BLUE: Default terrain provider areas
  - GRAY: Fallback terrain areas

## Migration Guide

```typescript
// Before
const visualizer = new TerrainVisualizer(viewer, { terrainProvider: hybrid });
visualizer.show(13); // Show level 13 entity grid
visualizer.level = 14; // Change to level 14

// After
const visualizer = new TerrainVisualizer(viewer, { terrainProvider: hybrid });
visualizer.show(); // Show imagery overlay + tile coordinates (defaults)
visualizer.show({ showTileCoordinates: false, alpha: 0.3 }); // Customize
visualizer.setAlpha(0.7); // Adjust transparency
```
