---
"@juun-roh/cesium-utils": patch
---

Redefine Highlight Class

feat: Redefine highlight class

To support highlighting 3D objects, the class has been redefined.

* Separate multiton handler as a wrapper of the former Highlight class.  
The former class is renamed as `SurfaceHighlight`.  
The former class is now a member of new wrapper class `Highlight`.

* Add `SilhouetteHighlight` class to handle 3d objects.  
This class is able to display outlined highlights on `Cesium3DTileFeature` and `Model` objects.  
Also a member of new wrapper class `Highlight`.  

NOTE: Feature migration is under process. There are some mismatches and missing parts in documents and tests.
