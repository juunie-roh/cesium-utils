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
} from "cesium";
import { Cesium3DTileset, Entity, EntityCollection } from "cesium";

type CesiumCollection =
  | BillboardCollection
  | DataSourceCollection
  | EntityCollection
  | ImageryLayerCollection
  | LabelCollection
  | PointPrimitiveCollection
  | PolylineCollection
  | PrimitiveCollection;

type Primitives = Primitive | Cesium3DTileset | GroundPrimitive;

type CesiumCollectionItem =
  | Billboard
  | DataSource
  | Entity
  | ImageryLayer
  | Label
  | PointPrimitive
  | Polyline
  | Primitives;

type Tag = string | number;

interface WithTag {
  [key: symbol]: Tag;
}
/**
 * Collection event types
 */
type CollectionEventType = "add" | "remove" | "update" | "clear";

/**
 * Event handler function type
 */
type EventHandler<I> = (event: {
  type: CollectionEventType;
  items?: I[];
  tag?: Tag;
}) => void;

// Helper type to exclude function types
type NonFunction<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export type {
  CesiumCollection,
  CesiumCollectionItem,
  CollectionEventType,
  EventHandler,
  NonFunction,
  Tag,
  WithTag,
};
