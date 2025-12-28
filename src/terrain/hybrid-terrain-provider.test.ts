import { EllipsoidTerrainProvider, Request, TerrainProvider } from "cesium";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import HybridTerrainProvider from "@/terrain/hybrid-terrain-provider.js";
import type { TerrainRegion } from "@/terrain/index.js";

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
  let tileRegion: TerrainRegion;
  let hybrid: HybridTerrainProvider;

  beforeEach(() => {
    defaultProvider = new EllipsoidTerrainProvider();
    fallbackProvider = new EllipsoidTerrainProvider();
    tileRegion = createTileRegion();
    hybrid = new HybridTerrainProvider({
      regions: [tileRegion],
      defaultProvider,
      fallbackProvider,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create new instance with default values", () => {
      const defaultHybrid = new HybridTerrainProvider({
        regions: [tileRegion],
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
        regions: [tileRegion],
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
      expect(regions).toContain(tileRegion);
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
    it("should return true if any region contains the tile", () => {
      // Mock region contains method to return true
      vi.spyOn(HybridTerrainProvider.TerrainRegion, "contains").mockReturnValue(
        true,
      );
      const providerSpy = vi.spyOn(defaultProvider, "getTileDataAvailable");

      const result = hybrid.getTileDataAvailable(0, 0, 0);

      // Should not check providers when region contains tile
      expect(providerSpy).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should fall back to default provider if no region contains the tile", () => {
      vi.spyOn(HybridTerrainProvider.TerrainRegion, "contains").mockReturnValue(
        false,
      );
      const providerSpy = vi
        .spyOn(defaultProvider, "getTileDataAvailable")
        .mockReturnValue(true);

      const result = hybrid.getTileDataAvailable(0, 0, 0);

      expect(providerSpy).toHaveBeenCalledWith(0, 0, 0);
      expect(result).toBe(true);
    });

    it("should return true for first region that contains the tile", () => {
      // Create a second region
      const secondRegion = createTileRegion();
      const hybridWithMultipleRegions = new HybridTerrainProvider({
        regions: [tileRegion, secondRegion],
        defaultProvider,
        fallbackProvider,
      });

      // Mock only first region to contain the tile
      vi.spyOn(HybridTerrainProvider.TerrainRegion, "contains")
        .mockReturnValueOnce(true) // First region contains tile
        .mockReturnValueOnce(false); // Second region doesn't

      const defaultProviderSpy = vi.spyOn(
        defaultProvider,
        "getTileDataAvailable",
      );

      const result = hybridWithMultipleRegions.getTileDataAvailable(0, 0, 14);

      // Default provider should not be called since first region contained tile
      expect(defaultProviderSpy).not.toHaveBeenCalled();

      // Should return true from first region
      expect(result).toBe(true);
    });

    it("should pass through default provider result when no regions match", () => {
      const secondRegion = createTileRegion();
      const hybridWithMultipleRegions = new HybridTerrainProvider({
        regions: [tileRegion, secondRegion],
        defaultProvider,
        fallbackProvider,
      });

      // Mock both regions to NOT contain the tile
      vi.spyOn(HybridTerrainProvider.TerrainRegion, "contains").mockReturnValue(
        false,
      );

      const defaultProviderSpy = vi
        .spyOn(defaultProvider, "getTileDataAvailable")
        .mockReturnValue(undefined);

      const result = hybridWithMultipleRegions.getTileDataAvailable(0, 0, 14);

      expect(defaultProviderSpy).toHaveBeenCalledWith(0, 0, 14);
      expect(result).toBe(undefined);
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
      vi.spyOn(hybrid, "getTileDataAvailable").mockReturnValue(true);
      vi.spyOn(HybridTerrainProvider.TerrainRegion, "contains").mockReturnValue(
        true,
      );
      const regionRequestSpy = vi.spyOn(
        tileRegion.provider,
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
      vi.spyOn(HybridTerrainProvider.TerrainRegion, "contains").mockReturnValue(
        false,
      );
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
      vi.spyOn(HybridTerrainProvider.TerrainRegion, "contains").mockReturnValue(
        false,
      );
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

    it("should pass the request parameter to the appropriate provider", () => {
      const request = new Request();
      vi.spyOn(hybrid, "getTileDataAvailable").mockReturnValue(true);
      vi.spyOn(HybridTerrainProvider.TerrainRegion, "contains").mockReturnValue(
        true,
      );
      const regionRequestSpy = vi.spyOn(
        tileRegion.provider,
        "requestTileGeometry",
      );

      hybrid.requestTileGeometry(0, 0, 0, request);

      expect(regionRequestSpy).toHaveBeenCalledWith(0, 0, 0, request);
    });
  });

  describe("factory methods", () => {
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

  describe("TerrainRegion", () => {
    describe("contains", () => {
      it("should check tile coordinates correctly", () => {
        const tileRanges = new Map();
        tileRanges.set(5, { x: [0, 10], y: [0, 10] });
        tileRanges.set(6, { x: [0, 20], y: [0, 20] });

        const region: TerrainRegion = {
          provider: new EllipsoidTerrainProvider(),
          tiles: tileRanges,
        };

        expect(
          HybridTerrainProvider.TerrainRegion.contains(region, 5, 5, 5),
        ).toBe(true);
        expect(
          HybridTerrainProvider.TerrainRegion.contains(region, 15, 15, 5),
        ).toBe(false);
        expect(
          HybridTerrainProvider.TerrainRegion.contains(region, 15, 15, 6),
        ).toBe(true); // level 6 has larger range
        expect(
          HybridTerrainProvider.TerrainRegion.contains(region, 5, 5, 7),
        ).toBe(false); // level 7 not defined
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

        expect(
          HybridTerrainProvider.TerrainRegion.contains(region, 5, 5, 5),
        ).toBe(true);
        expect(
          HybridTerrainProvider.TerrainRegion.contains(region, 15, 15, 6),
        ).toBe(true);
        expect(
          HybridTerrainProvider.TerrainRegion.contains(region, 5, 5, 7),
        ).toBe(false); // level not in constraints
      });
    });
  });
});
