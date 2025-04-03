---
"@juun_roh/cesium-utils": patch
---

feat: Redefine types, add overload for `removeByTag` function

* Fix types, now adds tag into the item using `Object.defineProperty`.
* Fix `add` function to recursively call itself, simplifying the code sturcture.
* Add overloads for `removeByTag` method. It now support mutiple tags removal.
