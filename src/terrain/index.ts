import HybridTerrainProvider from "./hybrid-terrain-provider.js";

export { HybridTerrainProvider };

export type TerrainTiles = NonNullable<
  HybridTerrainProvider.TerrainRegion["tiles"]
>;
export type TerrainRegion = HybridTerrainProvider.TerrainRegion;
export type TerrainOptions = HybridTerrainProvider.ConstructorOptions;
