---
"@juun-roh/cesium-utils": patch
---

Bug Fix

fix: Add unit test and fix problems of collection

* Fix `add()` for multiple items to have proper tag.  
Assigning input tag was missing when the input item is an array.

* Fix type handling of `remove()`.  
Receive normal type (not internally defined `I & WithTag`), and convert it internally.

* Fix usage of `Object.defineProperty` in `updateTag()`.  
Change form of parameter for `Object.defineProperty`.
