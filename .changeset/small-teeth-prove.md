---
"@juun-roh/cesium-utils": patch
---

Update Return Values for Collection Methods

refactor: Update return values

* `Collection` class methods:  
`add`, `remove` methods now return `this`
to support method chaining.

* `TerrainAreaCollection` class methods:  
Likewise, `add` method now returns `this`.
