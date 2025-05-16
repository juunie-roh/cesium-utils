---
"@juun-roh/cesium-utils": patch
---

Lightweight Highlight Implementation

refactor: Replace collection-based highlight with flyweight pattern

* Architectural Changes  
Flyweight Pattern: Implement the flyweight pattern with a single entity per viewer instance instead of creating a new entity for each highlight.  
Memory Efficiency: Remove the entity collection and active highlights tracking, dramatically reducing memory overhead.  
Property-based Updates: Use Cesium's property system to update the highlight entity in-place rather than creating new entities.  

* API Improvements  
Type Safety: Add proper TypeScript method overloads for the _update method, making the API more type-safe.  
Better Error Handling: Improve error handling throughout the class to prevent failures when working with complex geometries.  
Rename Methods: Change method names to better reflect their function.  

>     `add` → `show`  
>     `remove` → `hide`  
>     `removeAll` → now handled by hide  
>     `_createEntity` → `_update`  

* Feature Enhancements  
Geometry Cleanup: Properly clear all geometries between highlights to prevent artifacts.  
Outline Support: Add comprehensive support for outline-style highlighting across all geometry types.  
Improved Primitive Support: Better handling of GroundPrimitives with proper position extraction.  
Efficient Property Cloning: Properly preserve important properties from source geometries like heightReference and classificationType.  

* Internal Improvements
Simplified State Management: Remove the need to track active highlights with a Set.  
Direct Entity Access: Add a highlightEntity getter for direct access to the highlight entity.  
Better Instance Management: More robust multiton pattern implementation with proper cleanup.  
Optimized Reuse: The single entity is reused for all geometry types by selectively applying only the needed properties.  
