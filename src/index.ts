import { Collection } from "./collection/index.js";
import {
  Highlight,
  SilhouetteHighlight,
  SurfaceHighlight,
} from "./highlight/index.js";
import { HybridTerrainProvider, TerrainArea } from "./terrain/index.js";
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
  TerrainVisualizer,
};

// Functions
export { cloneViewer, isGetterOnly, syncCamera };

// Types
export type * from "./utils/type-check.js";
