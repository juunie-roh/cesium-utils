---
"@juun-roh/cesium-utils": patch
---

Highlight Performance Optimization

fix: Eliminate flickering and delay in mouse movement highlighting

- Add object tracking to both `SurfaceHighlight` and `SilhouetteHighlight` classes.
  The classes now track the currently highlighted object and options to prevent redundant geometry updates.

- Skip geometry clearing and recreation when highlighting the same object with identical options.
  This eliminates the flickering effect during rapid mouse movements over the same entity.

- Implement robust comparison of `HighlightOptions` including proper color equality checks.
  Handle edge cases with undefined colors and default values correctly.

- Add proper cleanup of tracking state in `hide()` and `destroy()` methods.
  Clear tracking variables on error conditions to prevent stale state.

- Add `currentObject` getter to both highlight classes for debugging and state inspection.
