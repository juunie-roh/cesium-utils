/** A range of tiles from `start` to `end` */
export type TileRange = {
  /** Top Left tile coordinates */
  start: { x: number; y: number };
  /** Bottom Right tile coordinates */
  end: { x: number; y: number };
};
