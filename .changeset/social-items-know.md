---
"@juun-roh/cesium-utils": patch
---

Highlight Feature Update

feat: Add new highlight feature

* New `Highlight` class for highlighting objects.  
A multiton class that supports multi-viewer situation.  
Handles mainly the object returned from `scene.pick()` or `drillPick()`.  

* Fix mocks for tests.  
Extend viewer mock to have collections. (primitives, entities, groundPrimives)  
Add a simple collection mock.

* New test conducted for `Highlight`.  
In Progress.
