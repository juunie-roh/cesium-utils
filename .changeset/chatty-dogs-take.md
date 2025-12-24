---
"@juun-roh/cesium-utils": patch
---

Enhance Sunlight experimental API with async analysis and improved accuracy

feat: Refactor Sunlight API for better usability and reliability

**Breaking Changes** (Experimental API):

- Renamed `createDetectionEllipsoid()` → `setTargetPoint()` for clearer intent
- Made `analyze()` async to properly handle ray picking operations
- Changed detection entity from point to ellipsoid for improved collision detection accuracy
- `analyze()` now throws error if `setTargetPoint()` hasn't been called first

**Improvements**:

- Enhanced `virtualSun()` to return both position and direction for more efficient ray calculations
- Fixed sun direction vector calculation (properly negated `_sunDirectionWC` to point from sun toward scene)
- Updated ray origin to start from virtual sun position for accurate shadow detection
- Added proper `objectsToExclude` option handling in analysis pipeline
- Improved internal state management with dedicated collections for polylines and points
- Enhanced `clear()` method to properly clean up debug visualizations without removing target point

**Demo**:

- Added interactive demo at `src/demo/scripts/sunlight.ts` showcasing:
  - NYC 3D buildings with sunlight analysis
  - Time-of-day slider with real-time shadow updates
  - Single-time and time-range analysis modes
  - Debug visualization options for sun rays and collision points
  - Click-to-analyze workflow with visual feedback

**Note**: This is an experimental feature using Cesium's internal APIs that may change in future versions
