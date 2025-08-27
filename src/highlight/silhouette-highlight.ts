import type {
  Entity,
  PostProcessStage,
  PostProcessStageCollection,
  PostProcessStageComposite,
  Viewer,
} from "cesium";
import {
  Cesium3DTileFeature,
  Color,
  ConstantProperty,
  defined,
  PostProcessStageLibrary,
} from "cesium";

import Highlight from "./highlight.js";

/**
 * @class
 * An implementation for highlighting 3D objects in Cesium.
 *
 * **Supported Object Types:**
 * - `Entity` with model graphics. (adjustable outline width)
 * - `Cesium3DTileset` instances. (fixed outline width)
 *
 * Currently supports outline style only.
 *
 * @example
 * ```typescript
 * const viewer = new Viewer("cesiumContainer");
 * const silhouetteHighlight = new SilhouetteHighlight(viewer);
 *
 * // Highlight an object
 * const entity = viewer.entities.add(new Entity({
 *   model: new ModelGraphics(),
 * }));
 * silhouetteHighlight.show(entity);
 * ```
 */
export default class SilhouetteHighlight implements Highlight.Base {
  private _color: Color = Color.RED;
  private _silhouette: PostProcessStage;
  private _composite: PostProcessStageComposite;
  private _stages: PostProcessStageCollection;
  private _entity?: Entity;
  private _currentObject: Cesium3DTileFeature | Entity | undefined;
  private _currentOptions: Highlight.Options | undefined;

  /**
   * Creates a new `Silhouette` instance.
   * @param viewer A viewer to create highlight silhouette in
   */
  constructor(viewer: Viewer) {
    this._stages = viewer.scene.postProcessStages;
    this._silhouette = PostProcessStageLibrary.createEdgeDetectionStage();
    this._silhouette.uniforms.color = this._color;
    this._silhouette.uniforms.length = 0.01;
    this._silhouette.selected = [];
    this._composite = PostProcessStageLibrary.createSilhouetteStage([
      this._silhouette,
    ]);

    this._stages.add(this._composite);
  }

  /** Gets the highlight color. */
  get color(): Color {
    return this._color;
  }

  /** Sets the highlight color. */
  set color(color: Color) {
    this._color = color;
  }

  /** Gets the currently highlighted object */
  get currentObject(): Cesium3DTileFeature | Entity | undefined {
    return this._currentObject;
  }

  /**
   * Highlights a picked `Cesium3DTileset` by updating silhouette composite.
   * @param object The object to be highlighted.
   * @param options Optional style for the highlight.
   */
  show(object: Cesium3DTileFeature, options?: Highlight.Options): void;
  /**
   * Highlights a picked `Entity` by updating the model properties.
   * @param object The object to be highlighted.
   * @param options Optional style for the highlight.
   */
  show(object: Entity, options?: Highlight.Options): void;
  show(object: Cesium3DTileFeature | Entity, options?: Highlight.Options) {
    if (!defined(object)) return;

    // Check if we're highlighting the same object with the same options
    if (
      this._currentObject === object &&
      this._optionsEqual(this._currentOptions, options)
    ) {
      // Same object and options - no need to update
      return;
    }

    // Clear previous highlights before setting new one
    this._clearHighlights();

    try {
      if (object instanceof Cesium3DTileFeature) {
        this._silhouette.uniforms.color = options?.color || this._color;
        this._silhouette.selected.push(object);
      } else {
        if (!object.model) return;
        this._entity = object;
        object.model.silhouetteSize = new ConstantProperty(options?.width || 2);
        object.model.silhouetteColor = new ConstantProperty(
          options?.color || this._color,
        );
      }

      // Store current object and options for next comparison
      this._currentObject = object;
      this._currentOptions = options ? { ...options } : undefined;
    } catch (error) {
      console.error("Failed to highlight object:", error);
      this._currentObject = undefined;
      this._currentOptions = undefined;
    }
  }

  /** Clears the current highlight */
  hide(): void {
    this._clearHighlights();

    // Clear tracking of current object
    this._currentObject = undefined;
    this._currentOptions = undefined;
  }

  /** Clean up the instances */
  destroy(): void {
    this.hide();
    if (this._composite) {
      this._stages.remove(this._composite);
    }
    this._currentObject = undefined;
    this._currentOptions = undefined;
  }

  /**
   * Compares two Highlight.Options objects for equality
   * @private
   */
  private _optionsEqual(
    options1: Highlight.Options | undefined,
    options2: Highlight.Options | undefined,
  ): boolean {
    // Both undefined
    if (!options1 && !options2) return true;

    // One undefined, one defined
    if (!options1 || !options2) return false;

    // Compare properties
    return (
      options1.outline === options2.outline &&
      options1.width === options2.width &&
      Color.equals(options1.color || this._color, options2.color || this._color)
    );
  }

  /**
   * Clears all current highlights
   * @private
   */
  private _clearHighlights(): void {
    // Clear silhouette selection
    if (this._silhouette.selected.length > 0) {
      this._silhouette.selected = [];
    }

    // Clear entity model highlight
    if (this._entity?.model) {
      this._entity.model.silhouetteColor = new ConstantProperty(
        Color.TRANSPARENT,
      );
      this._entity.model.silhouetteSize = new ConstantProperty(0.0);
      this._entity = undefined;
    }
  }
}
