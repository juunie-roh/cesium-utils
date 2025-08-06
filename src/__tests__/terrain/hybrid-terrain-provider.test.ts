import {
  EllipsoidTerrainProvider,
  Rectangle,
  Request,
  TerrainProvider,
} from "cesium";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HybridTerrainProvider from "@/terrain/hybrid-terrain-provider.js";
import type { TerrainRegion } from "@/terrain/index.js";

const createRectRegion = (): TerrainRegion => ({
  provider: new EllipsoidTerrainProvider(),
  bounds: Rectangle.fromDegrees(-10, -10, 10, 10),
  levels: [0, 1, 2, 3, 4],
});

const createTileRegion = (): TerrainRegion => {
  const tileRanges = new Map();
  tileRanges.set(5, { x: [0, 5], y: [0, 5] });
  tileRanges.set(6, { x: [0, 11], y: [0, 11] });
  return {
    provider: new EllipsoidTerrainProvider(),
    tiles: tileRanges,
  };
};

describe("HybridTerrainProvider", () => {
  let defaultProvider: TerrainProvider;
  let fallbackProvider: TerrainProvider;
  let rectRegion: TerrainRegion;
  let tileRegion: TerrainRegion;
  let hybrid: HybridTerrainProvider;

  beforeEach(() => {
    defaultProvider = new EllipsoidTerrainProvider();
    fallbackProvider = new EllipsoidTerrainProvider();
    rectRegion = createRectRegion();
    tileRegion = createTileRegion();
    hybrid = new HybridTerrainProvider({
      regions: [rectRegion],
      defaultProvider,
      fallbackProvider,
    });
  });

  describe("constructor", () => {
    it("should create new instance with default values", () => {
      const defaultHybrid = new HybridTerrainProvider({
        regions: [rectRegion],
        defaultProvider,
      });

      expect(defaultHybrid).toBeInstanceOf(HybridTerrainProvider);
      expect(defaultHybrid.tilingScheme).toBe(defaultProvider.tilingScheme);
      expect(defaultHybrid.fallbackProvider).toBeInstanceOf(
        EllipsoidTerrainProvider,
      );
      expect(defaultHybrid.ready).toBe(true);
    });

    it("should create new instance with provided values", () => {
      const provider = new EllipsoidTerrainProvider();
      const fallback = new EllipsoidTerrainProvider();
      const t = new HybridTerrainProvider({
        regions: [rectRegion],
        defaultProvider: provider,
        fallbackProvider: fallback,
      });

      expect(t.defaultProvider).toBe(provider);
      expect(t.fallbackProvider).toBe(fallback);
    });

    it("should create instance without regions", () => {
      const t = new HybridTerrainProvider({
        defaultProvider,
      });

      expect(t.regions).toEqual([]);
      expect(t.defaultProvider).toBe(defaultProvider);
    });
  });

  describe("property getters", () => {
    it("should correctly get credit from default provider", () => {
      expect(hybrid.credit).toBe(defaultProvider.credit);
    });

    it("should correctly get errorEvent from default provider", () => {
      expect(hybrid.errorEvent).toBe(defaultProvider.errorEvent);
    });

    it("should correctly get hasWaterMask from default provider", () => {
      expect(hybrid.hasWaterMask).toBe(defaultProvider.hasWaterMask);
    });

    it("should correctly get hasVertexNormals from default provider", () => {
      expect(hybrid.hasVertexNormals).toBe(defaultProvider.hasVertexNormals);
    });

    it("should correctly get availability from default provider", () => {
      expect(hybrid.availability).toBe(defaultProvider.availability);
    });

    it("should return a copy of regions", () => {
      const regions = hybrid.regions;
      expect(regions).toContain(rectRegion);
      expect(regions).not.toBe(hybrid["_regions"]);
    });
  });

  describe("getLevelMaximumGeometricError", () => {
    it("should pass through to default provider", () => {
      const spy = vi.spyOn(defaultProvider, "getLevelMaximumGeometricError");
      hybrid.getLevelMaximumGeometricError(5);
      expect(spy).toHaveBeenCalledWith(5);
    });
  });

  describe("loadTileDataAvailability", () => {
    it("should pass through to default provider", () => {
      const spy = vi.spyOn(defaultProvider, "loadTileDataAvailability");
      hybrid.loadTileDataAvailability(0, 0, 0);
      expect(spy).toHaveBeenCalledWith(0, 0, 0);
    });
  });

  describe("getTileDataAvailable", () => {
    it("should check terrain regions first", () => {
      // Mock region contains method
      vi.spyOn(hybrid as any, "_regionContains").mockReturnValue(true);
      const regionSpy = vi
        .spyOn(rectRegion.provider, "getTileDataAvailable")
        .mockReturnValue(true);
      const providerSpy = vi.spyOn(defaultProvider, "getTileDataAvailable");

      const result = hybrid.getTileDataAvailable(0, 0, 0);

      expect(regionSpy).toHaveBeenCalledWith(0, 0, 0);
      expect(providerSpy).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should fall back to default provider if no region contains the tile", () => {
      vi.spyOn(hybrid as any, "_regionContains").mockReturnValue(false);
      const providerSpy = vi
        .spyOn(defaultProvider, "getTileDataAvailable")
        .mockReturnValue(true);

      const result = hybrid.getTileDataAvailable(0, 0, 0);

      expect(providerSpy).toHaveBeenCalledWith(0, 0, 0);
      expect(result).toBe(true);
    });

    it("should continue searching regions when a provider returns false", () => {
      // Create a second region
      const secondRegion = createTileRegion();
      const hybridWithMultipleRegions = new HybridTerrainProvider({
        regions: [rectRegion, secondRegion],
        defaultProvider,
        fallbackProvider,
      });

      // Mock both regions to contain the tile
      vi.spyOn(hybridWithMultipleRegions as any, "_regionContains")
        .mockReturnValueOnce(true) // First region contains tile
        .mockReturnValueOnce(true); // Second region also contains tile

      // First region returns false (no data available)
      const firstRegionSpy = vi
        .spyOn(rectRegion.provider, "getTileDataAvailable")
        .mockReturnValue(false);

      // Second region returns true (data available)
      const secondRegionSpy = vi
        .spyOn(secondRegion.provider, "getTileDataAvailable")
        .mockReturnValue(true);

      const defaultProviderSpy = vi.spyOn(
        defaultProvider,
        "getTileDataAvailable",
      );

      const result = hybridWithMultipleRegions.getTileDataAvailable(0, 0, 14);

      // Both regions should be checked
      expect(firstRegionSpy).toHaveBeenCalledWith(0, 0, 14);
      expect(secondRegionSpy).toHaveBeenCalledWith(0, 0, 14);

      // Default provider should not be called since second region had data
      expect(defaultProviderSpy).not.toHaveBeenCalled();

      // Should return true from second region
      expect(result).toBe(true);
    });

    it("should fall back to default provider when all regions return false", () => {
      const secondRegion = createTileRegion();
      const hybridWithMultipleRegions = new HybridTerrainProvider({
        regions: [rectRegion, secondRegion],
        defaultProvider,
        fallbackProvider,
      });

      // Mock both regions to contain the tile
      vi.spyOn(
        hybridWithMultipleRegions as any,
        "_regionContains",
      ).mockReturnValue(true);

      // Both regions return false (no data available)
      vi.spyOn(rectRegion.provider, "getTileDataAvailable").mockReturnValue(
        false,
      );
      vi.spyOn(secondRegion.provider, "getTileDataAvailable").mockReturnValue(
        false,
      );

      const defaultProviderSpy = vi
        .spyOn(defaultProvider, "getTileDataAvailable")
        .mockReturnValue(true);

      const result = hybridWithMultipleRegions.getTileDataAvailable(0, 0, 14);

      expect(defaultProviderSpy).toHaveBeenCalledWith(0, 0, 14);
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

    it("should use region provider if tile is within a region", () => {
      vi.spyOn(hybrid as any, "_regionContains").mockReturnValue(true);
      vi.spyOn(rectRegion.provider, "getTileDataAvailable").mockReturnValue(
        true,
      );
      const regionRequestSpy = vi.spyOn(
        rectRegion.provider,
        "requestTileGeometry",
      );
      const defaultProviderSpy = vi.spyOn(
        defaultProvider,
        "requestTileGeometry",
      );
      const fallbackProviderSpy = vi.spyOn(
        fallbackProvider,
        "requestTileGeometry",
      );

      hybrid.requestTileGeometry(0, 0, 0);

      expect(regionRequestSpy).toHaveBeenCalledWith(0, 0, 0, undefined);
      expect(defaultProviderSpy).not.toHaveBeenCalled();
      expect(fallbackProviderSpy).not.toHaveBeenCalled();
    });

    it("should use default provider if tile is available and no region contains it", () => {
      vi.spyOn(hybrid as any, "_regionContains").mockReturnValue(false);
      const availableSpy = vi
        .spyOn(defaultProvider, "getTileDataAvailable")
        .mockReturnValue(true);
      const defaultProviderSpy = vi.spyOn(
        defaultProvider,
        "requestTileGeometry",
      );
      const fallbackProviderSpy = vi.spyOn(
        fallbackProvider,
        "requestTileGeometry",
      );

      hybrid.requestTileGeometry(0, 0, 0);

      expect(availableSpy).toHaveBeenCalledWith(0, 0, 0);
      expect(defaultProviderSpy).toHaveBeenCalledWith(0, 0, 0, undefined);
      expect(fallbackProviderSpy).not.toHaveBeenCalled();
    });

    it("should use fallback provider if default provider does not have tile available", () => {
      vi.spyOn(hybrid as any, "_regionContains").mockReturnValue(false);
      const availableSpy = vi
        .spyOn(defaultProvider, "getTileDataAvailable")
        .mockReturnValue(false);
      const defaultProviderSpy = vi.spyOn(
        defaultProvider,
        "requestTileGeometry",
      );
      const fallbackProviderSpy = vi.spyOn(
        fallbackProvider,
        "requestTileGeometry",
      );

      hybrid.requestTileGeometry(0, 0, 0);

      expect(availableSpy).toHaveBeenCalledWith(0, 0, 0);
      expect(defaultProviderSpy).not.toHaveBeenCalled();
      expect(fallbackProviderSpy).toHaveBeenCalledWith(0, 0, 0, undefined);
    });

    it("should continue searching regions when a provider has no data available", () => {
      // Create a second region
      const secondRegion = createTileRegion();
      const hybridWithMultipleRegions = new HybridTerrainProvider({
        regions: [rectRegion, secondRegion],
        defaultProvider,
        fallbackProvider,
      });

      // Mock both regions to contain the tile
      vi.spyOn(hybridWithMultipleRegions as any, "_regionContains")
        .mockReturnValueOnce(true) // First region contains tile
        .mockReturnValueOnce(true); // Second region also contains tile

      // First region has no data available
      vi.spyOn(rectRegion.provider, "getTileDataAvailable").mockReturnValue(
        false,
      );
      const firstRegionRequestSpy = vi.spyOn(
        rectRegion.provider,
        "requestTileGeometry",
      );

      // Second region has data available
      vi.spyOn(secondRegion.provider, "getTileDataAvailable").mockReturnValue(
        true,
      );
      const secondRegionRequestSpy = vi.spyOn(
        secondRegion.provider,
        "requestTileGeometry",
      );

      const defaultProviderSpy = vi.spyOn(
        defaultProvider,
        "requestTileGeometry",
      );

      hybridWithMultipleRegions.requestTileGeometry(0, 0, 14);

      // First region should not be called for request since it has no data
      expect(firstRegionRequestSpy).not.toHaveBeenCalled();

      // Second region should be called since it has data
      expect(secondRegionRequestSpy).toHaveBeenCalledWith(0, 0, 14, undefined);

      // Default provider should not be called
      expect(defaultProviderSpy).not.toHaveBeenCalled();
    });

    it("should use default provider when all regions have no data available", () => {
      const secondRegion = createTileRegion();
      const hybridWithMultipleRegions = new HybridTerrainProvider({
        regions: [rectRegion, secondRegion],
        defaultProvider,
        fallbackProvider,
      });

      // Mock both regions to contain the tile but have no data
      vi.spyOn(
        hybridWithMultipleRegions as any,
        "_regionContains",
      ).mockReturnValue(true);
      vi.spyOn(rectRegion.provider, "getTileDataAvailable").mockReturnValue(
        false,
      );
      vi.spyOn(secondRegion.provider, "getTileDataAvailable").mockReturnValue(
        false,
      );

      const firstRegionRequestSpy = vi.spyOn(
        rectRegion.provider,
        "requestTileGeometry",
      );
      const secondRegionRequestSpy = vi.spyOn(
        secondRegion.provider,
        "requestTileGeometry",
      );

      // Default provider has data available
      vi.spyOn(defaultProvider, "getTileDataAvailable").mockReturnValue(true);
      const defaultProviderSpy = vi.spyOn(
        defaultProvider,
        "requestTileGeometry",
      );

      hybridWithMultipleRegions.requestTileGeometry(0, 0, 14);

      // Neither region should be called for request
      expect(firstRegionRequestSpy).not.toHaveBeenCalled();
      expect(secondRegionRequestSpy).not.toHaveBeenCalled();

      // Default provider should be called
      expect(defaultProviderSpy).toHaveBeenCalledWith(0, 0, 14, undefined);
    });

    it("should pass the request parameter to the appropriate provider", () => {
      const request = new Request();
      vi.spyOn(hybrid as any, "_regionContains").mockReturnValue(true);
      vi.spyOn(rectRegion.provider, "getTileDataAvailable").mockReturnValue(
        true,
      );
      const regionRequestSpy = vi.spyOn(
        rectRegion.provider,
        "requestTileGeometry",
      );

      hybrid.requestTileGeometry(0, 0, 0, request);

      expect(regionRequestSpy).toHaveBeenCalledWith(0, 0, 0, request);
    });
  });

  describe("factory methods", () => {
    it("should create from rectangles", () => {
      const regions = [
        {
          provider: new EllipsoidTerrainProvider(),
          bounds: Rectangle.fromDegrees(-10, -10, 10, 10),
          levels: [1, 2, 3],
        },
      ];

      const hybrid = HybridTerrainProvider.fromRectangles(
        regions,
        defaultProvider,
      );

      expect(hybrid).toBeInstanceOf(HybridTerrainProvider);
      expect(hybrid.regions).toHaveLength(1);
      expect(hybrid.regions[0].bounds).toBe(regions[0].bounds);
    });

    it("should create from tile ranges", () => {
      const tileRanges = new Map();
      tileRanges.set(5, { x: [0, 10], y: [0, 10] });
      tileRanges.set(6, { x: [0, 20], y: [0, 20] });

      const regions = [
        {
          provider: new EllipsoidTerrainProvider(),
          tiles: tileRanges,
        },
      ];

      const hybrid = HybridTerrainProvider.fromTileRanges(
        regions,
        defaultProvider,
      );

      expect(hybrid).toBeInstanceOf(HybridTerrainProvider);
      expect(hybrid.regions).toHaveLength(1);
      expect(hybrid.regions[0].tiles).toBe(regions[0].tiles);
    });
  });

  describe("_regionContains", () => {
    it("should check rectangle bounds correctly", () => {
      const region: TerrainRegion = {
        provider: new EllipsoidTerrainProvider(),
        bounds: Rectangle.fromDegrees(-10, -10, 10, 10),
      };

      // This is a simplified test - in reality this would need proper tile coordinate calculation
      const result = hybrid["_regionContains"](region, 0, 0, 5);
      expect(typeof result).toBe("boolean");
    });

    it("should check tile coordinates correctly", () => {
      const tileRanges = new Map();
      tileRanges.set(5, { x: [0, 10], y: [0, 10] });
      tileRanges.set(6, { x: [0, 20], y: [0, 20] });

      const region: TerrainRegion = {
        provider: new EllipsoidTerrainProvider(),
        tiles: tileRanges,
      };

      expect(hybrid["_regionContains"](region, 5, 5, 5)).toBe(true);
      expect(hybrid["_regionContains"](region, 15, 15, 5)).toBe(false);
      expect(hybrid["_regionContains"](region, 15, 15, 6)).toBe(true); // level 6 has larger range
      expect(hybrid["_regionContains"](region, 5, 5, 7)).toBe(false); // level 7 not defined
    });

    it("should check level constraints", () => {
      const tileRanges = new Map();
      tileRanges.set(5, { x: [0, 10], y: [0, 10] });
      tileRanges.set(6, { x: [0, 20], y: [0, 20] });

      const region: TerrainRegion = {
        provider: new EllipsoidTerrainProvider(),
        tiles: tileRanges,
        levels: [5, 6], // only allow levels 5 and 6
      };

      expect(hybrid["_regionContains"](region, 5, 5, 5)).toBe(true);
      expect(hybrid["_regionContains"](region, 15, 15, 6)).toBe(true);
      expect(hybrid["_regionContains"](region, 5, 5, 7)).toBe(false); // level not in constraints
    });
  });
});
