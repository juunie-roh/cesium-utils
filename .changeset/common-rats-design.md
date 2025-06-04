---
"@juun-roh/cesium-utils": patch
---

Update Highlight classes

refactor: Update highlight classes

**`Highlight`:**

* Replace type of `instances` from `Map` to `WeackMap`.

* Remove handling `ModelGraphics` type.  
Now determines the type(2D or 3D) of an entity by the presence of it's `model` property.

* Add descriptions.

**`SilhouetteHighlight`:**

* Replace `_model` having `ModelGraphics` type with `_entity` having `Entity` type.
