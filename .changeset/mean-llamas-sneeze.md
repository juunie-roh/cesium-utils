---
"@juun_roh/cesium-utils": patch
---

Type compatibility updates

fix: Fix initializing strategy

* Fix initializing method of this class.
   Remove `_initialize` method.
   The static method `create` now handles all the asynchronous functions.
   The constructor now receives initialized instances.

* Match return type of `requestTileGeometry` with Cesium
   Since the method does not await `_ready` anymore, it is now synchronous.
   Disable the `@ts-expect-error` suppression.

fix: Fix initializing method

* Reconstructure initializing method of this class.
   The member `_ready` will always be `true` when the constructor is called.
   The static method `create` now handles all the asynchronous functions.

* Match return types of method `requestTileGeometry` with Cesium.
   Since the method no longer awaits for member `_ready`, it is now synchronous.

refactor: Rename member, set default value show function

* Rename `activeLevel` as `level`
* Set default parameter value to 15 in method `show`
