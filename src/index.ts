import { Collection } from "./collection/index.js";
import {
  Highlight,
  SilhouetteHighlight,
  SurfaceHighlight,
} from "./highlight/index.js";
import { HybridTerrainProvider, TerrainArea } from "./terrain/index.js";
import { cloneViewer, syncCamera } from "./viewer/index.js";

// Classes & namespaces
export {
  Collection,
  Highlight,
  HybridTerrainProvider,
  SilhouetteHighlight,
  SurfaceHighlight,
  TerrainArea, // Deprecated
};

// Functions
export { cloneViewer, syncCamera };
