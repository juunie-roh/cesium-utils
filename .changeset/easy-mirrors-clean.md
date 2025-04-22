---
"@juun-roh/cesium-utils": patch
---

Refactoring Classes

refactor: Rename class

* Rename `TerrainAreas` as `TerrainAreaCollection`.  
The class provides collection-like methods, so renamed it to be more consistent.  

* Rename the member `_provider` as `_terrainProvider` of `TerrainArea`.  
To have more aligned form of variables.

* Update Documents.  
Some of the existing documents were incompatible with the code.
