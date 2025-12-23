---
"@juun-roh/cesium-utils": patch
---

Enhanced Collection.setProperty() with Nested Property Path Support

feat: `Collection.setProperty()` now supports nested property paths using dot notation

The `setProperty` method has been enhanced to support setting deeply nested properties using dot notation paths, powered by the new `NestedKeyOf<T>` and `NestedValueOf<T, Path>` type utilities.

**Usage Examples**:

```typescript
import { Collection } from '@juun-roh/cesium-utils';

const collection = new Collection({ collection: entityCollection });

// Before: Only top-level properties
collection.setProperty('name', 'Building A');

// Now: Nested properties with full type safety and IntelliSense support
collection.setProperty('metadata.priority', 5, 'buildings');
collection.setProperty('config.display.scale', 2.5, 'markers');
collection.setProperty('settings.advanced.renderMode', 'optimized', 'terrain');
```

**Key Features**:

- **Type Safety**: Full TypeScript IntelliSense and compile-time type checking for nested paths
- **Depth Limit**: Supports up to 3 levels of nesting to prevent excessive type complexity
- **Read-Only Detection**: Maintains existing safeguards for read-only properties at any nesting level
- **Graceful Handling**: Silently skips items where the nested path doesn't exist
- **Backward Compatible**: Existing code using top-level properties continues to work unchanged

**Implementation Details**:

- Runtime path traversal splits dot-notation strings and navigates object hierarchy
- Property descriptor checks ensure read-only properties cannot be modified
- Type system prevents setting function properties at any nesting level
