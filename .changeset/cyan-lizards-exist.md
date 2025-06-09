---
"@juun-roh/cesium-utils": patch
---

Fix Highlight Class

fix: Update surface highlight

* Integrate `color` into `options` parameter.  
Remove color parameter for `show` and `update`, since the class has and uses it's member `_color` as a default value.  

* Apply fixed height reference.  
Matching the name of the class(_surface_ highlight), the highlight entity now always clamp to ground.

* Fix types.  
`HighlightOptions` now includes `color`.  
Fix `IHighlight` interface's `show` parameters.  

* Update others(test, ...) to follow the changes.
