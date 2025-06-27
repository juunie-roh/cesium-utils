---
"@juun-roh/cesium-utils": patch
---

Test Conducted for Silhouette Highlight

test: Add new test for silhouette highlight

* Add tests on class methods besides `show` Entity type.

* Fix `hide` method  
From setting `entity.model.silhouetteColor` as `Color.TRANSPARENT` to `undefined`.
