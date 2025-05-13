---
"@juun-roh/cesium-utils": patch
---

Simplify Class

fix: Simplify class to use single type of collection

* Remove internal `Primitive` collection.  
Replace highlight object to be type of `Entity`.  
Replace `GroundPrimitive` instances logics with `Entity`.  

* Replace viewer identifier.  
Use DOM element, the container of viewer instance as an identifier of the viewer.  

* Update viewer mock to have container property.

* Update test to match fixed class.
