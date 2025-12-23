---
"@juun-roh/cesium-utils": patch
---

Refactor internal utilities and enhance security

refactor: Extract property validation logic into reusable utilities

**Internal Changes**:

- Moved `type-check.ts` from `src/dev/` to `src/utils/` for better code organization
- Created `src/utils/safe-property-setter.ts` with comprehensive property setting logic:
  - `safeSetProperty()`: Safely sets nested properties with full security validation
  - Prevents prototype pollution via `__proto__`, `constructor`, and `prototype`
  - Only traverses own (non-inherited) properties to prevent cross-instance pollution
  - Validates read-only properties, function properties, and path integrity
- Enhanced type inference for nested objects with improved handling of function types and non-null checks in `NestedValueOf` type utility
- Refactored `Collection.setProperty()` to use the new `safeSetProperty()` utility, reducing code from ~90 lines to ~20 lines while maintaining all security protections and backward compatibility

**Note**: These are internal utilities bundled within the library and do not affect the public API
