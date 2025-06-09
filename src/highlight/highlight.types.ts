import type {
  Cesium3DTileFeature,
  Cesium3DTileset,
  Color,
  Entity,
  GroundPrimitive,
  Model,
  Primitive,
} from 'cesium';

// highlight.types.ts
interface IHighlight {
  show(object: any, options?: HighlightOptions): void;
  hide(): void;
  destroy(): void;
  color: Color;
}

interface HighlightOptions {
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

type Picked = Entity | Cesium3DTileFeature | GroundPrimitive | PickedObject;

export type { HighlightOptions, IHighlight, Picked, PickedObject };
