import { defined, Viewer } from 'cesium';

/**
 * Copies camera state from source viewer to destination viewer.
 * @param source The source viewer to copy camera states from.
 * @param dest The destination viewer to apply camera properties from the source.
 */
export function syncCamera(source: Viewer, dest: Viewer) {
  if (defined(source) && defined(dest)) {
    const { camera } = source;
    dest.camera.position = camera.positionWC.clone();
    dest.camera.direction = camera.directionWC.clone();
    dest.camera.up = camera.upWC.clone();
  }
}
