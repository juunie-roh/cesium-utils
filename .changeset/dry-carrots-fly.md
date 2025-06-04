---
"@juun-roh/cesium-utils": patch
---

Fix Collection

fix: Enhance type definition and error assertion

* Fix value type from `V extends Exclude<I[K], Function>` to `I[K]`.

* Improve clarity of the error message in `setProperty`.
