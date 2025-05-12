import Collection from './collection/collection.js';
import { HybridTerrainProvider } from './terrain/hybrid-terrain-provider.js';
import { computeRectangle } from './terrain/terrain.utils.js';
import { TerrainArea } from './terrain/terrain-area.js';
import TerrainAreaCollection from './terrain/terrain-area-collection.js';
import { TerrainVisualizer } from './utils/terrain/index.js';
import { isGetterOnly } from './utils/type-check.js';
import { cloneViewer } from './viewer/clone.js';
import { Highlight } from './viewer/highlight.js';
import { syncCamera } from './viewer/index.js';

// Classes
export {
  Collection,
  Highlight,
  HybridTerrainProvider,
  TerrainArea,
  TerrainAreaCollection,
  TerrainVisualizer,
};

// Functions
export { cloneViewer, computeRectangle, isGetterOnly, syncCamera };

// Types
export type * from './collection/collection.types.js';
export type * from './terrain/terrain.types.js';
