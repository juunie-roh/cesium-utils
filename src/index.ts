import { Collection } from "./collection/index.js";
import {
  Highlight,
  SilhouetteHighlight,
  SurfaceHighlight,
} from "./highlight/index.js";
import { HybridTerrainProvider } from "./terrain/index.js";
import { cloneViewer, syncCamera } from "./viewer/index.js";

// Classes & namespaces
export {
  Collection,
  Highlight,
  HybridTerrainProvider,
  SilhouetteHighlight,
  SurfaceHighlight,
};

// Functions
export { cloneViewer, syncCamera };

// Types
export type * from "./collection/index.js";
export type * from "./highlight/index.js";
export type * from "./terrain/index.js";
export type * from "./viewer/index.js";
