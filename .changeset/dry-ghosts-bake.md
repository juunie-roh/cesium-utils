---
"@juun_roh/cesium-utils": patch
---

Viewer Utitlities Update

 feat: Add viewer utility functions

- Add `cloneViewer`, `syncCameraState` function.
    Helper functions to clone and manipulate viewers for multi-viewer applications.

  refactor: Remove `TypeGuard` namespace.

- Remove `TypeGuard` namespace, since it can be replaced with cesium native `defined`.
    Also remove references from import and require tests.

  test: Add multi-viewer demonstration in test example.

  ci: Fix build scripts

- Remove documentation script in build scripts.
    Remove `build:skip-doc` script, replace `build` script to run without documentation.

- Remove documentation from husky pre-commit.

- Test required if automated workflow is valid.
