---
"@juun-roh/cesium-utils": patch
---

Align `HybridTerrainProvider` with the `TerrainProvider` interface

**Property Consolidation**:

- `hasWaterMask` / `hasVertexNormals` now return the union across the default provider and all region providers — ensures Cesium requests extensions in HTTP headers for any source that supports them, instead of only reflecting the default provider's capabilities
- `credit` now follows the `CesiumTerrainProvider` pattern: accepts an optional `Credit | string` via the new `credit` constructor option, falls back to the default provider's credit when not provided. Tile-level credits continue to flow through delegation via each child provider's terrain data
- `errorEvent` is now an owned `Event` instance that forwards errors from the default/fallback provider and all region providers, instead of exposing only the default provider's event
- `getLevelMaximumGeometricError` returns the maximum error across the default provider and all region providers, ensuring the LOD system refines conservatively enough for all sources when providers have differing geometric error calculations

**Request Routing**:

- `loadTileDataAvailability` now routes to the owning provider (checks regions first, falls through to the default provider), mirroring the delegation used in `requestTileGeometry`. Previously always delegated to the default provider, which prevented region providers with progressive availability from loading their availability metadata

**Resource Management**:

- Added `destroy()` method that removes all forwarded error event subscriptions and sets the provider to a non-ready state, preventing memory leaks when providers outlive the `HybridTerrainProvider`
