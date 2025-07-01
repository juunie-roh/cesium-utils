import type {
  Billboard,
  DataSource,
  DataSourceCollection,
  GroundPrimitive,
  ImageryLayer,
  ImageryLayerCollection,
  Label,
  PointPrimitive,
  Polyline,
  Primitive,
  PrimitiveCollection,
} from "cesium";
import { Cesium3DTileset, Entity, EntityCollection } from "cesium";

type CesiumCollection =
  | DataSourceCollection
  | EntityCollection
  | ImageryLayerCollection
  | PrimitiveCollection;

type Primitives =
  | Billboard
  | Cesium3DTileset
  | GroundPrimitive
  | Label
  | PointPrimitive
  | Polyline
  | Primitive;

type CesiumCollectionItem = DataSource | Entity | ImageryLayer | Primitives;

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
