import {
  Cesium3DTileFeature,
  Color,
  ConstantProperty,
  defined,
  Entity,
  PostProcessStage,
  PostProcessStageCollection,
  PostProcessStageComposite,
  PostProcessStageLibrary,
  Viewer,
} from "cesium";

import type { HighlightOptions, IHighlight } from "./highlight.types.js";

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
export default class SilhouetteHighlight implements IHighlight {
  private _color: Color = Color.RED;
  private _silhouette: PostProcessStage;
  private _composite: PostProcessStageComposite;
  private _stages: PostProcessStageCollection;
  private _entity?: Entity;

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

  /**
   * Highlights a picked `Cesium3DTileset` by updating silhouette composite.
   * @param object The object to be highlighted.
   * @param options Optional style for the highlight.
   */
  show(object: Cesium3DTileFeature, options?: HighlightOptions): void;
  /**
   * Highlights a picked `Entity` by updating the model properties.
   * @param object The object to be highlighted.
   * @param options Optional style for the highlight.
   */
  show(object: Entity, options?: HighlightOptions): void;
  show(object: Cesium3DTileFeature | Entity, options?: HighlightOptions) {
    if (!defined(object) || this._silhouette.selected[0] === object) return;
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
  }

  /** Clears the current highlight */
  hide(): void {
    if (this._silhouette.selected.length > 0) this._silhouette.selected = [];
    if (this._entity?.model) {
      this._entity.model.silhouetteColor = new ConstantProperty(
        Color.TRANSPARENT,
      );
      this._entity.model.silhouetteSize = new ConstantProperty(0.0);
      this._entity = undefined;
    }
  }

  /** Clean up the instances */
  destroy(): void {
    this.hide();
    if (this._composite) {
      this._stages.remove(this._composite);
    }
  }

  /** Gets the highlight color. */
  get color(): Color {
    return this._color;
  }
  /** Sets the highlight color. */
  set color(color: Color) {
    this._color = color;
  }
}
