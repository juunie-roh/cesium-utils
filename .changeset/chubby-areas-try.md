---
"@juun-roh/cesium-utils": patch
---

Refactor Methods

refactor: Update class methods

* Rename methods.  
Replace `clear`, `clearAll` with `remove`, `removeAll.  

* Consolidate methods.  
Merge `_highlightGroundPrimitive` and `_highlightEntity` into a single overrided method `_createEntity`.  

* Add `outline` styling option.  
Support highlights with outline style.

* Assign identifiers to the highlight entities.  
Fundamental tasks for caching strategy.
