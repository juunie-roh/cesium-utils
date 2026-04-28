---
"@juun-roh/cesium-utils": patch
---

Deprecate fallbackProvider and TerrainRegion.contains

**`HybridTerrainProvider.fallbackProvider`**:

- `fallbackProvider` was originally introduced as a safety net for an async-ready model, where a provider could be used before sub-providers had finished initializing.
- Since the provider now only reaches `ready` once all sub-providers are ready, the failure case `fallbackProvider` was guarding against can no longer occur.
- `fallbackProvider` is deprecated and will be removed in `0.5.0`. Remove it from `ConstructorOptions` and `fromTileRanges` calls — `defaultProvider` is now always used when no region matches.

**`HybridTerrainProvider.TerrainRegion.contains`**:

- The nested namespace `TerrainRegion` is deprecated in favour of a flat API on `HybridTerrainProvider`.
- Migrate to `HybridTerrainProvider.regionContains`:

```ts
// Before
HybridTerrainProvider.TerrainRegion.contains(region, x, y, level);

// After
HybridTerrainProvider.regionContains(region, x, y, level);
```
