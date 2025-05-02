---
"@juun-roh/cesium-utils": patch
---

Refactor Class

refactor: Fix types for terrain provider options

* Remove static method `create`.  
There is no reason to handle the terrain url directly in this class.
