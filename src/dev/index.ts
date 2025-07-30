import Deprecate from "./deprecation.js";
import { TerrainVisualizer } from "./terrain/visualizer/terrain-visualizer.js";
import { isGetterOnly } from "./type-check.js";

export { TerrainVisualizer };

export { Deprecate };
export { isGetterOnly };

export const deprecate = Deprecate.deprecate;
export type * from "./type-check.js";
