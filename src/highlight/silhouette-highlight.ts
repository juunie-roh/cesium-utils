import {
  Cesium3DTileFeature,
  Color,
  ConstantProperty,
  defined,
  ModelGraphics,
  PostProcessStage,
  PostProcessStageCollection,
  PostProcessStageComposite,
  PostProcessStageLibrary,
  Viewer,
} from 'cesium';

import type { IHighlight } from './highlight.types.js';

export default class SilhouetteHighlight implements IHighlight {
  private _color: Color = Color.RED;
  private _silhouette: PostProcessStage;
  private _composite: PostProcessStageComposite;
  private _stages: PostProcessStageCollection;
  private _model?: ModelGraphics;

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

  show(
    object: Cesium3DTileFeature | ModelGraphics,
    color: Color = this._color,
    options?: { outline?: boolean; width?: number },
  ) {
    if (!defined(object) || this._silhouette.selected[0] === object) return;
    if (object instanceof Cesium3DTileFeature) {
      this._silhouette.selected.push(object);
    } else {
      this._model = object;
      object.silhouetteSize = new ConstantProperty(options?.width || 2);
      object.silhouetteColor = new ConstantProperty(color);
    }
  }
  hide(): void {
    if (this._silhouette.selected.length > 0) this._silhouette.selected = [];
    if (this._model) {
      this._model.silhouetteColor = new ConstantProperty(Color.TRANSPARENT);
      this._model = undefined;
    }
  }
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
