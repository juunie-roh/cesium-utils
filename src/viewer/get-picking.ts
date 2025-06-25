import { defined, Scene } from 'cesium';

/**
 * Gets `picking` functions and state
 * annotated as private but has a public getter
 * @param from The scene to get `picking` instance
 * @see {@link https://github.com/CesiumGS/cesium/blob/1.129/packages/engine/Source/Scene/Scene.js#L1060 `Scene.picking`}
 */
export function getPicking(from: Scene): undefined | any {
  if (!defined(from)) return;
  //@ts-expect-error
  return from.picking;
}
