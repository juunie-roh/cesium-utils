import { Collection } from "./collection/index.js";
import {
  Highlight,
  SilhouetteHighlight,
  SurfaceHighlight,
} from "./highlight/index.js";
import {
  computeRectangle,
  HybridTerrainProvider,
  TerrainArea,
  TerrainAreaCollection,
} from "./terrain/index.js";
import { isGetterOnly, TerrainVisualizer } from "./utils/index.js";
import { cloneViewer, syncCamera } from "./viewer/index.js";

// Classes
export {
  Collection,
  Highlight,
  HybridTerrainProvider,
  SilhouetteHighlight,
  SurfaceHighlight,
  TerrainArea,
  TerrainAreaCollection,
  TerrainVisualizer,
};

// Functions
export { cloneViewer, computeRectangle, isGetterOnly, syncCamera };

// Types
export type * from "./collection/collection.types.js";
export type * from "./highlight/highlight.types.js";
export type * from "./terrain/terrain.types.js";
