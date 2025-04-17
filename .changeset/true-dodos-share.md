---
"@juun-roh/cesium-utils": patch
---

Refactor Collection

refactor: Simplify names of collection methods

* New Functionality

1. Iterator Support  
Now supports iterator protocol.

2. Expand Standard Array API  
Add `map`, `find`.

* API Streamlining:  
Shorter, more intuitive method names. (`contains`, `get`, `first`, `update`)  
Consistent parameter naming with `by` for tag-based operations.  
Naming consistency with `from`/`to` in update().

* Consistant return type to support chaining
Visibility operations (show, hide, toggle) now return this for chaining.  
setProperty returns this instead of count for consistent pattern.
