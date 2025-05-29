import {
  Cesium3DTileFeature,
  Color,
  defined,
  Entity,
  GroundPrimitive,
  ModelGraphics,
  Viewer,
} from 'cesium';

import { Picked } from './highlight.types.js';
import SilhouetteHighlight from './silhouette-highlight.js';
import SurfaceHighlight from './surface-highlight.js';

/**
 * @class
 * Lightweight multiton highlight manager for Cesium using flyweight pattern.
 *
 * @example
 * ```
 * // Setup
 * const viewer1 = new Viewer('cesiumContainer1');
 * const viewer2 = new Viewer('cesiumContainer2');
 *
 * const highlighter1 = Highlight.getInstance(viewer1);
 * const highlighter2 = Highlight.getInstance(viewer2);
 *
 * // This highlight only affects viewer1
 * highlighter1.show(someEntity, Color.RED);
 *
 * // This highlight only affects viewer2
 * highlighter2.show(someEntity, Color.BLUE);
 *
 * // When done with viewers
 * Highlight.releaseInstance(viewer1);
 * Highlight.releaseInstance(viewer2);
 * viewer1.destroy();
 * viewer2.destroy();
 * ```
 */
export default class Highlight {
  private static instances = new Map<Element, Highlight>();
  private _surface: SurfaceHighlight;
  private _silhouette: SilhouetteHighlight;
  private _color: Color = Color.RED;

  /**
   * Creates a new `Highlight` instance.
   * @private Use {@link getInstance `Highlight.getInstance()`}
   * @param viewer A viewer to create highlight entity in
   */
  private constructor(viewer: Viewer) {
    this._surface = new SurfaceHighlight(viewer);
    this._silhouette = new SilhouetteHighlight(viewer);

    this._surface.color = this._color;
    this._silhouette.color = this._color;
  }

  /**
   * Gets or creates highlight instance from a viewer.
   * @param viewer The viewer to get or create a new instance from.
   */
  static getInstance(viewer: Viewer): Highlight {
    const container = viewer.container;
    if (!Highlight.instances.has(container)) {
      Highlight.instances.set(container, new Highlight(viewer));
    }
    return Highlight.instances.get(container)!;
  }

  /**
   * Releases the highlight instance associated with a viewer.
   * @param viewer The viewer whose highlight instance should be released.
   */
  static releaseInstance(viewer: Viewer): void {
    const container = viewer.container;
    const instance = Highlight.instances.get(container);
    if (instance) {
      instance.hide();

      if (instance._surface) instance._surface.destroy();
      if (instance._silhouette) instance._silhouette.destroy();

      Highlight.instances.delete(container);
    }
  }

  show(
    picked: Picked,
    color = this._color,
    options?: { outline?: boolean; width?: number },
  ) {
    const object = this._getObject(picked);
    if (!defined(object)) return;
    if (
      object instanceof Cesium3DTileFeature ||
      object instanceof ModelGraphics
    ) {
      return this._silhouette.show(object, color);
    }
    return this._surface.show(object, color, options);
  }

  private _getObject(
    picked: Picked,
  ):
    | Entity
    | GroundPrimitive
    | ModelGraphics
    | Cesium3DTileFeature
    | undefined {
    if (!defined(picked)) return;
    // Direct instances
    if (picked instanceof Entity) return picked;
    if (picked instanceof Cesium3DTileFeature) return picked;
    if (picked instanceof GroundPrimitive) return picked;

    // Entity
    if (picked.id instanceof Entity) {
      if (picked.id.model) return picked.id.model;
      return picked.id;
    }

    // Primitives
    if (picked.primitive instanceof GroundPrimitive) return picked.primitive;

    // 3D Tiles
    if (picked instanceof Cesium3DTileFeature) return picked;
  }

  hide(): void {
    this._surface.hide();
    this._silhouette.hide();
  }

  /** Gets the highlight color. */
  get color(): Color {
    return this._color;
  }

  /**
   * Sets the highlight color.
   * @param color The new color for highlights
   */
  set color(color: Color) {
    this._color = color;
    this._surface.color = color;
    this._silhouette.color = color;
  }
}
