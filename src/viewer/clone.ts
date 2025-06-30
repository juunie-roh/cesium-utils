import { Viewer } from "cesium";

import { syncCamera } from "./sync-camera.js";

/**
 * Copies configuration and state from one Cesium Viewer to another.
 * @param source - The source viewer to copy properties from
 * @param container - DOM element ID or element for the new viewer
 * @param options - Optional override options for the new viewer
 * @returns A new Viewer instance with copied properties
 */
export function cloneViewer(
  source: Viewer,
  container: Element | string,
  options?: Viewer.ConstructorOptions,
): Viewer {
  // Capture essential viewer configuration
  const baseOptions = {
    baseLayerPicker: source.baseLayerPicker !== undefined,
    geocoder: source.geocoder !== undefined,
    homeButton: source.homeButton !== undefined,
    sceneModePicker: source.sceneModePicker !== undefined,
    timeline: source.timeline !== undefined,
    navigationHelpButton: source.navigationHelpButton !== undefined,
    animation: source.animation !== undefined,
    fullscreenButton: source.fullscreenButton !== undefined,
    shouldAnimate: source.clock.shouldAnimate,
    terrainProvider: source.terrainProvider,
    requestRenderMode: source.scene.requestRenderMode,
    infoBox: source.infoBox !== undefined,
  };

  // Create new viewer with combined options
  const dest = new Viewer(container, {
    ...baseOptions,
    ...options,
  });

  syncCamera(source, dest);

  // Copy imageryLayers (including the base layer)
  const imageryLayers = source.imageryLayers;
  dest.imageryLayers.removeAll();
  for (let i = 0; i < imageryLayers.length; i++) {
    const layer = imageryLayers.get(i);
    dest.imageryLayers.addImageryProvider(layer.imageryProvider, i);
  }

  // Copy clock settings
  dest.clock.startTime = source.clock.startTime.clone();
  dest.clock.stopTime = source.clock.stopTime.clone();
  dest.clock.currentTime = source.clock.currentTime.clone();
  dest.clock.multiplier = source.clock.multiplier;
  dest.clock.clockStep = source.clock.clockStep;
  dest.clock.clockRange = source.clock.clockRange;
  dest.clock.shouldAnimate = source.clock.shouldAnimate;

  // Copy scene properties
  dest.scene.globe.enableLighting = source.scene.globe.enableLighting;
  dest.scene.globe.depthTestAgainstTerrain =
    source.scene.globe.depthTestAgainstTerrain;
  dest.scene.screenSpaceCameraController.enableCollisionDetection =
    source.scene.screenSpaceCameraController.enableCollisionDetection;

  // Copy input event settings
  const tiltEventTypes =
    source.scene.screenSpaceCameraController.tiltEventTypes;
  if (tiltEventTypes) {
    dest.scene.screenSpaceCameraController.tiltEventTypes = Array.isArray(
      tiltEventTypes,
    )
      ? [...tiltEventTypes]
      : tiltEventTypes;
  }
  const zoomEventTypes =
    source.scene.screenSpaceCameraController.zoomEventTypes;
  if (zoomEventTypes) {
    dest.scene.screenSpaceCameraController.zoomEventTypes = Array.isArray(
      zoomEventTypes,
    )
      ? [...zoomEventTypes]
      : zoomEventTypes;
  }

  return dest;
}
