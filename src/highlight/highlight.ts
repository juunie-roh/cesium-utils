import type { Cesium3DTileset, Model, Primitive, Viewer } from "cesium";
import {
  Cesium3DTileFeature,
  Color,
  defined,
  Entity,
  GroundPrimitive,
} from "cesium";

import SilhouetteHighlight from "./silhouette-highlight.js";
import SurfaceHighlight from "./surface-highlight.js";

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
 * highlighter1.show(someEntity, { color: Color.RED });
 *
 * // This highlight only affects viewer2
 * highlighter2.show(someEntity, { color: Color.BLUE });
 *
 * // When done with viewers
 * Highlight.releaseInstance(viewer1);
 * Highlight.releaseInstance(viewer2);
 * viewer1.destroy();
 * viewer2.destroy();
 * ```
 */
class Highlight {
  private static instances = new WeakMap<Element, Highlight>();
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

  /**
   * Highlights a picked object or a direct instance.
   * @param picked The result of `Scene.pick()` or direct instance to be highlighted.
   * @param options Optional style for the highlight.
   * @see {@link Highlight.Options}
   */
  show(
    picked: Highlight.Picked,
    options: Highlight.Options = { color: this._color },
  ) {
    const object = this._getObject(picked);
    if (!defined(object)) return;
    if (object instanceof Cesium3DTileFeature) {
      return this._silhouette.show(object, options);
    } else if (object instanceof Entity && object.model) {
      return this._silhouette.show(object, options);
    }

    return this._surface.show(object, options);
  }

  private _getObject(
    picked: Highlight.Picked,
  ): Entity | GroundPrimitive | Cesium3DTileFeature | undefined {
    if (!defined(picked)) return;

    if (picked instanceof Entity) return picked;
    if (picked instanceof Cesium3DTileFeature) return picked;
    if (picked instanceof GroundPrimitive) return picked;

    if (picked.id instanceof Entity) return picked.id;
    if (picked.primitive instanceof GroundPrimitive) return picked.primitive;
  }

  /**
   * Clears the current highlight effects.
   */
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

namespace Highlight {
  export interface Base {
    show(object: any, options?: Highlight.Options): void;
    hide(): void;
    destroy(): void;
    color: Color;
  }

  export interface Options {
    /** Color of the highlight */
    color?: Color;
    /** To apply outline style for the highlight */
    outline?: boolean;
    /** Outline width */
    width?: number;
  }

  type PickedObject = {
    id?: Entity;
    primitive?: Primitive | GroundPrimitive | Model | Cesium3DTileset;
    tileset?: Cesium3DTileset;
    detail?: {
      model?: Model;
    };
  };

  export type Picked =
    | Entity
    | Cesium3DTileFeature
    | GroundPrimitive
    | PickedObject;
}

export default Highlight;
