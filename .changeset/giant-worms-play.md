---
"@juun-roh/cesium-utils": patch
---

Bug Fix

fix: Model entity highlight

* Setting `entity.model.silhouetteColor` to `undefined` does not properly remove the applied silhouette color.  
Restore setting it from `undefined` to `Color.TRANSPARENT`.
