---
"@juun-roh/cesium-utils": minor
---

Release 3D Object Highlight

feat: 3d object highlight

* Complete test on highlight class.  
3D Highlight supports:  
  `Cesium3DTileFeature` which is returned by `scene.pick()` on `Cesium3DTileset` object.  
  `Entity` with specified `model` property.  
3D Highlight supports outline style only.

* Both surface and silhouette only supports single highlighting feature currently.
