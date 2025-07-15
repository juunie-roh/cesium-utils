import { EllipsoidTerrainProvider, Request, TerrainProvider } from "cesium";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HybridTerrainProvider from "@/terrain/hybrid-terrain-provider.js";
import TerrainArea from "@/terrain/terrain-area.js";

const createTileRanges = (): Map<number, TerrainArea.TileRange> => {
  const map = new Map<number, TerrainArea.TileRange>();
  for (let i = 0; i < 5; ++i) {
    map.set(i, { start: { x: 0, y: 0 }, end: { x: i, y: i } });
  }
  return map;
};

describe("HybridTerrainProvider", () => {
  let terrainProvider: TerrainProvider;
  let fallbackProvider: TerrainProvider;
  let terrainArea: TerrainArea;
  let hybrid: HybridTerrainProvider;
  let tileRanges: Map<number, TerrainArea.TileRange>;

  beforeEach(() => {
    terrainProvider = new EllipsoidTerrainProvider();
    fallbackProvider = new EllipsoidTerrainProvider();
    tileRanges = createTileRanges();
    terrainArea = new TerrainArea({
      terrainProvider: new EllipsoidTerrainProvider(),
      tileRanges,
    });
    hybrid = new HybridTerrainProvider({
      terrainAreas: [terrainArea],
      terrainProvider,
      fallbackProvider,
    });
  });

  describe("constructor", () => {
    it("should create new instance with default values", () => {
      const defaultHybrid = new HybridTerrainProvider({
        terrainAreas: [terrainArea],
        terrainProvider,
      });

      expect(defaultHybrid).toBeInstanceOf(HybridTerrainProvider);
      expect(defaultHybrid.tilingScheme).toBe(terrainProvider.tilingScheme);
      expect(defaultHybrid.fallbackProvider).toBeInstanceOf(
        EllipsoidTerrainProvider,
      );
      expect(defaultHybrid.ready).toBe(true);
    });

    it("should create new instance with provided values", () => {
      const provider = new EllipsoidTerrainProvider();
      const fallback = new EllipsoidTerrainProvider();
      const t = new HybridTerrainProvider({
        terrainAreas: [terrainArea],
        terrainProvider: provider,
        fallbackProvider: fallback,
      });

      expect(t.defaultProvider).toBe(provider);
      expect(t.fallbackProvider).toBe(fallback);
    });
  });

  describe("property getters", () => {
    it("should correctly get credit from terrain provider", () => {
      expect(hybrid.credit).toBe(terrainProvider.credit);
    });

    it("should correctly get errorEvent from terrain provider", () => {
      expect(hybrid.errorEvent).toBe(terrainProvider.errorEvent);
    });

    it("should correctly get hasWaterMask from terrain provider", () => {
      expect(hybrid.hasWaterMask).toBe(terrainProvider.hasWaterMask);
    });

    it("should correctly get hasVertexNormals from terrain provider", () => {
      expect(hybrid.hasVertexNormals).toBe(terrainProvider.hasVertexNormals);
    });

    it("should correctly get availability from terrain provider", () => {
      expect(hybrid.availability).toBe(terrainProvider.availability);
    });

    it("should return a copy of terrainAreas", () => {
      const areas = hybrid.terrainAreas;
      expect(areas).toContain(terrainArea);
      expect(hybrid["_terrainAreas"]).toBeInstanceOf(TerrainArea.Collection);
      expect(areas).not.toBe(hybrid["_terrainAreas"]);
    });
  });

  describe("getLevelMaximumGeometricError", () => {
    it("should pass through to terrain provider", () => {
      const spy = vi.spyOn(terrainProvider, "getLevelMaximumGeometricError");
      hybrid.getLevelMaximumGeometricError(5);
      expect(spy).toHaveBeenCalledWith(5);
    });
  });

  describe("loadTileDataAvailability", () => {
    it("should pass through to terrain provider", () => {
      const spy = vi.spyOn(terrainProvider, "loadTileDataAvailability");
      hybrid.loadTileDataAvailability(0, 0, 0);
      expect(spy).toHaveBeenCalledWith(0, 0, 0);
    });
  });

  describe("getTileDataAvailable", () => {
    it("should check terrain areas first", () => {
      const areaSpy = vi.spyOn(terrainArea, "contains").mockReturnValue(true);
      const areaDataSpy = vi
        .spyOn(terrainArea, "getTileDataAvailable")
        .mockReturnValue(true);
      const providerSpy = vi.spyOn(terrainProvider, "getTileDataAvailable");

      const result = hybrid.getTileDataAvailable(0, 0, 0);

      expect(areaSpy).toHaveBeenCalledWith(0, 0, 0);
      expect(areaDataSpy).toHaveBeenCalledWith(0, 0, 0);
      expect(providerSpy).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should fall back to terrain provider if no terrain area contains the tile", () => {
      const areaSpy = vi.spyOn(terrainArea, "contains").mockReturnValue(false);
      const providerSpy = vi
        .spyOn(terrainProvider, "getTileDataAvailable")
        .mockReturnValue(true);

      const result = hybrid.getTileDataAvailable(0, 0, 0);

      expect(areaSpy).toHaveBeenCalledWith(0, 0, 0);
      expect(providerSpy).toHaveBeenCalledWith(0, 0, 0);
      expect(result).toBe(true);
    });
  });

  describe("requestTileGeometry", () => {
    it("should return undefined if not ready", () => {
      // Set ready to false
      Object.defineProperty(hybrid, "_ready", { get: () => false });

      const result = hybrid.requestTileGeometry(0, 0, 0);

      expect(result).toBeUndefined();
    });

    it("should use terrain area if tile is within an area", () => {
      const areaSpy = vi.spyOn(terrainArea, "contains").mockReturnValue(true);
      const areaRequestSpy = vi.spyOn(terrainArea, "requestTileGeometry");
      const defaultProviderSpy = vi.spyOn(
        terrainProvider,
        "requestTileGeometry",
      );
      const fallbackProviderSpy = vi.spyOn(
        fallbackProvider,
        "requestTileGeometry",
      );

      hybrid.requestTileGeometry(0, 0, 0);

      expect(areaSpy).toHaveBeenCalledWith(0, 0, 0);
      expect(areaRequestSpy).toHaveBeenCalledWith(0, 0, 0, undefined);
      expect(defaultProviderSpy).not.toHaveBeenCalled();
      expect(fallbackProviderSpy).not.toHaveBeenCalled();
    });

    it("should use default provider if tile is available", () => {
      const areaSpy = vi.spyOn(terrainArea, "contains").mockReturnValue(false);
      const availableSpy = vi
        .spyOn(terrainProvider, "getTileDataAvailable")
        .mockReturnValue(true);
      const defaultProviderSpy = vi.spyOn(
        terrainProvider,
        "requestTileGeometry",
      );
      const fallbackProviderSpy = vi.spyOn(
        fallbackProvider,
        "requestTileGeometry",
      );

      hybrid.requestTileGeometry(0, 0, 0);

      expect(areaSpy).toHaveBeenCalledWith(0, 0, 0);
      expect(availableSpy).toHaveBeenCalledWith(0, 0, 0);
      expect(defaultProviderSpy).toHaveBeenCalledWith(0, 0, 0, undefined);
      expect(fallbackProviderSpy).not.toHaveBeenCalled();
    });

    it("should use fallback provider if default provider does not have tile available", () => {
      const areaSpy = vi.spyOn(terrainArea, "contains").mockReturnValue(false);
      const availableSpy = vi
        .spyOn(terrainProvider, "getTileDataAvailable")
        .mockReturnValue(false);
      const defaultProviderSpy = vi.spyOn(
        terrainProvider,
        "requestTileGeometry",
      );
      const fallbackProviderSpy = vi.spyOn(
        fallbackProvider,
        "requestTileGeometry",
      );

      hybrid.requestTileGeometry(0, 0, 0);

      expect(areaSpy).toHaveBeenCalledWith(0, 0, 0);
      expect(availableSpy).toHaveBeenCalledWith(0, 0, 0);
      expect(defaultProviderSpy).not.toHaveBeenCalled();
      expect(fallbackProviderSpy).toHaveBeenCalledWith(0, 0, 0, undefined);
    });

    it("should pass the request parameter to the appropriate provider", () => {
      const request = new Request();
      const areaRequestSpy = vi.spyOn(terrainArea, "requestTileGeometry");

      hybrid.requestTileGeometry(0, 0, 0, request);

      expect(areaRequestSpy).toHaveBeenCalledWith(0, 0, 0, request);
    });
  });
});
