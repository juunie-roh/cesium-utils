---
"@juun-roh/cesium-utils": patch
---

Test Coverage Expansion

test: Update test for highlight class

* Refactoring Highlight class:  
  Simplify names of private members.

  * `_highlightEntity` to `_entity`
  * `_viewerEntities` to `_entities`  

  Remove validation about `_entity` is defined.
  `_entity` is initialized in constructor, thus there is no need to check if the `_entity` is `undefined`.

* Test coverage improvements:  
  Now the highlight test is covered 100%.
