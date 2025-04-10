---
"@juun_roh/cesium-utils": patch
---

Viewer Utilities Updates

feat: Add viewer utility functions

* Add `cloneViewer`, `syncCameraState` function.
   Helper functions to clone and manipulate viewers for multi-viewer applications.

refactor: Remove `TypeGuard` namespace.

* Remove `TypeGuard` namespace, since it can be replaced with cesium native `defined`.
   Also remove references from import and require tests.

test: Add multi-viewer demonstration in test example.
