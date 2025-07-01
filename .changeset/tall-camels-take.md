---
"@juun-roh/cesium-utils": patch
---

Collection Types Reorganization

refactor: Collection types reorganization

* `CesiumCollection`:  
Narrowed it down to 4 types from various collection types, since other items (such as `Billboard`, `Label`) are eventually added to `viewer.primitives`.

* `Primitives`:  
Likewise, this type has expanded to contain more collection item types.
