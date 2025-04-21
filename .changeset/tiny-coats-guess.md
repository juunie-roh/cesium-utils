---
"@juun-roh/cesium-utils": patch
---

Remove Redundant Class

refactor: Remove terrain bounds class

* Remove `TerrainBounds`.
Now doing proper delegation rather than modifying internals. (was modifying private member)  

* Stricter checks for terrain areas.

* Fix others according to the deletion and refactoring.
