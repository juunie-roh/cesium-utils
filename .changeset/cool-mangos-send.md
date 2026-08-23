---
"@juun-roh/cesium-utils": patch
---

Extend Highlight support beyond ground-clamped geometry

feat: Support standalone Model, point/billboard/label markers, and fix polyline highlighting

**New Object Support**:

- `Highlight` now routes standalone `Model` instances (picked directly, via `picked.primitive`, or via `picked.detail.model`) to `SilhouetteHighlight`, reusing the same native `silhouetteColor` / `silhouetteSize` properties already used for `Entity` model graphics
- `SurfaceHighlight` now highlights `Entity` instances with `point`, `billboard`, or `label` graphics by drawing a ring marker (transparent fill, colored outline) at the entity's position — these graphics have no comparable outline geometry of their own, so the marker is always outline-style regardless of the `outline` option, to avoid obscuring the icon or text being highlighted

**Bug Fixes**:

- Fixed polyline highlighting forcing `clampToGround: true` and dropping `arcType` on entities that weren't ground-clamped to begin with (e.g. a 3D flight path); the highlight now preserves the source polyline's own clamping and arc type
- Fixed a latent `NaN` outline width when a polyline entity's `width` property was undefined

**API Example**:

```typescript
// Standalone Model, not wrapped in an Entity
const model = await Model.fromGltfAsync({ url: "building.glb" });
viewer.scene.primitives.add(model);
highlight.show(model);

// Point, billboard, and label entities are now highlighted too
const marker = viewer.entities.add({
  position: Cartesian3.fromDegrees(-75, 40),
  billboard: { image: "pin.png" },
});
highlight.show(marker);
```

**Internal**:

- Refactored `SurfaceHighlight`'s geometry-update logic from a single deeply-nested method into one dedicated method per supported geometry type (polygon, polyline, rectangle, ground primitive, marker), with fill/outline variants split into sibling methods — no behavior change

**Note**: Volumetric entity graphics (`box`, `cylinder`, `corridor`, `wall`, `ellipsoid`, `plane`, extruded `ellipse`) and raw non-ground `Primitive` instances remain unsupported and are deferred to a future change.
