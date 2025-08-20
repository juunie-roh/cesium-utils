import { Collection } from "./collection/index.js";
import Sunlight from "./experimental/sunlight.js";
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
  Sunlight,
  SurfaceHighlight,
};

// Functions
export { cloneViewer, syncCamera };
