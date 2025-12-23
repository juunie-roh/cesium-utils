---
"@juun-roh/cesium-utils": patch
---

Security fix

fix: Add prototype pollution protection to Collection.setProperty()

**Security Fix**: The `setProperty` method now blocks dangerous property names (`__proto__`, `constructor`, `prototype`) to prevent prototype pollution attacks.

**Protection Details**:

- Blocks access to dangerous properties anywhere in the property path
- Silently skips items with dangerous paths instead of throwing errors
- Maintains backward compatibility with legitimate property access
- Includes comprehensive test coverage for security scenarios

**Example of blocked operations**:

```typescript
// These are now safely blocked:
collection.setProperty("__proto__.polluted", "bad");
collection.setProperty("constructor.polluted", "bad");
collection.setProperty("data.__proto__.polluted", "bad");
```
