---
"@juun-roh/cesium-utils": patch
---

Fix Collection

fix: Fix bugs found by newly established test

* `values`:  
The Collection class cannot invalidate cache when the base collection has changed.  
`values` now returns values directly, not referring cache.

* `removeByTag`:  
Fix inconsistent return value.

* `setProperty`:  
Fix invalid type inference using new utility function `isGetterOnly`.  
It now throws an error on accessing readonly value.

refactor: Restructure exports and add new utility type

* Group exports, and export with `type`.  
as is: `export { ... }`  
to be: `export type { ... }`

* New utility type `NonFunction`.
