---
"@juun-roh/cesium-utils": patch
---

Internal API usage fix

fix: Fix internal API usage

The `sunlight` class was misusing the internal `picking` API of cesium.

Fixed the usage and updated mocks used for test.
