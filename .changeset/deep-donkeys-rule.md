---
"@juun-roh/cesium-utils": patch
---

Improve Sunlight debug visualization and memory efficiency

feat: Add sunlight debug visualization logic

- **Ray Visualization**: Add `debugShowRays` option to visualize sunlight ray paths as yellow semi-transparent polylines from virtual sun position to analysis point. Complements existing `debugShowPoints` collision visualization.
- **Debug Entity Storage**: Replace entity instance storage with ID-based tracking to reduce memory overhead and eliminate stale references. Debug entities are now tracked using `_debugEntityIds: string[]` instead of `_debugEntities: Entity[]`.
- **Improved Cleanup Logic**: Simplify debug entity cleanup by leveraging Cesium's `removeById()` method, removing the need for existence checks and reducing cleanup complexity.
- **Test Coverage Updates**: Update test suite to validate ID-based entity tracking, new debug ray visualization, and improved object exclusion handling for ray picking operations.
