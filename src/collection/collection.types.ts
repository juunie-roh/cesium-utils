import type {
  Billboard,
  BillboardCollection,
  DataSource,
  DataSourceCollection,
  GroundPrimitive,
  ImageryLayer,
  ImageryLayerCollection,
  Label,
  LabelCollection,
  PointPrimitive,
  PointPrimitiveCollection,
  Polyline,
  PolylineCollection,
  Primitive,
  PrimitiveCollection,
} from 'cesium';
import { Cesium3DTileset, Entity, EntityCollection } from 'cesium';

export type CesiumCollection =
  | BillboardCollection
  | DataSourceCollection
  | EntityCollection
  | ImageryLayerCollection
  | LabelCollection
  | PointPrimitiveCollection
  | PolylineCollection
  | PrimitiveCollection;

export type Primitives = Primitive | Cesium3DTileset | GroundPrimitive;

export type CesiumCollectionItem =
  | Billboard
  | DataSource
  | Entity
  | ImageryLayer
  | Label
  | PointPrimitive
  | Polyline
  | Primitives;

export type Tag = string | number;

export interface WithTag {
  [key: symbol]: Tag;
}
/**
 * Collection event types
 */
export type CollectionEventType = 'add' | 'remove' | 'update' | 'clear';

/**
 * Event handler function type
 */
export type EventHandler<I> = (event: {
  type: CollectionEventType;
  items?: I[];
  tag?: Tag;
}) => void;
