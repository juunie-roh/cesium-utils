---
"@juun-roh/cesium-utils": patch
---

Fix credit property getter

**Credit getter**:

- Since `HybridTerrainProvider` is a delegator of existing providers, it should not assign the `credit` property manually — hence, it has been removed from `ConstructorOptions`.
- `credit` now concatenates existing providers' credits.
