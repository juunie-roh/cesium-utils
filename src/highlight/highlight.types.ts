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
  show(object: any, color?: Color, options?: HighlightOptions): void;
  hide(): void;
  destroy(): void;
  color: Color;
}

interface HighlightOptions {
  outline?: boolean;
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
