---
"@juun-roh/cesium-utils": patch
---

Collection Caching Strategy Improvement

perf: Improve caching strategy

* Add event-driven caching strategy.  
The caching strategy takes advantage of
Cesium collections' internal events,
such as `collectionChanged` in `EntityCollection`.  
The cache will be created when the `values()` method is called,
invalidated whenever the underlying collection event is provoked.

* Remove the inidividual calls of `_invalidateCache`.  
This may be restored in the future, for the sake of defensive programming.

* Add an instance clean up process.

* Update test to cover newly implemented caching feature.
