import { Entity, Viewer } from "cesium";
import { Cartesian3, JulianDate } from "cesium";

/**
 * @experimental
 * Point sunlight analysis utility for shadow calculations.
 *
 * ⚠️ **Warning**: This is an experimental feature that uses Cesium's internal APIs.
 * The API may change or break in future versions of Cesium or cesium-utils.
 *
 * @example
 * ```typescript
 * const sunlight = new Sunlight(viewer);
 * sunlight.analyze(point, JulianDate.now());
 * ```
 */
class Sunlight {
  private _sunPositionWC: Cartesian3;
  private _sunDirectionWC: Cartesian3;
  private _viewer: Viewer;
  private _analyzing: boolean = false;
  private _pointEntityId?: string;
  private _debugEntities: Entity[] = [];

  constructor(viewer: Viewer) {
    // @ts-expect-error Accessing internal APIs
    const { sunPositionWC, sunDirectionWC } = viewer.scene.context.uniformState;
    this._sunPositionWC = sunPositionWC;
    this._sunDirectionWC = sunDirectionWC;
    this._viewer = viewer;
  }

  /**
   * The sun position in 3D world coordinates at the current scene time.
   */
  get sunPositionWC(): Cartesian3 {
    return this._sunPositionWC;
  }

  /**
   * A normalized vector to the sun in 3D world coordinates at the current scene time.
   */
  get sunDirectionWC(): Cartesian3 {
    return this._sunDirectionWC;
  }

  /**
   * Whether sunlight analysis is currently in progress
   */
  get isAnalyzing(): boolean {
    return this._analyzing;
  }

  /**
   * Gets a virtual position of the sun to reduce calculation overhead.
   *
   * @param from target point to start from
   * @param radius virtual distance between target point and the sun. Defaults to 1000 (1km)
   */
  getVirtualSunPosition(from: Cartesian3, radius: number = 1000): Cartesian3 {
    // Get normalized vector between target point and sun position
    const n = Cartesian3.normalize(
      Cartesian3.subtract(this._sunPositionWC, from, new Cartesian3()),
      new Cartesian3(),
    );

    // Multiply the vector by radius
    Cartesian3.multiplyByScalar(n, radius, n);
    return Cartesian3.add(from, n, new Cartesian3());
  }

  /**
   * Analyze the sunlight acceptance from a given point at a given time.
   * @param from target point to analyze
   * @param at time to analyze
   */
  analyze(
    from: Cartesian3,
    at: JulianDate,
    options?: Sunlight.AnalyzeOptions,
  ): Sunlight.AnalysisResult;
  analyze(
    from: Cartesian3,
    time: Sunlight.TimeRange,
    options?: Sunlight.AnalyzeOptions,
  ): Sunlight.AnalysisResult[];
  analyze(
    from: Cartesian3,
    time: JulianDate | Sunlight.TimeRange,
    options?: Sunlight.AnalyzeOptions,
  ): Sunlight.AnalysisResult | Sunlight.AnalysisResult[] {
    const result: Sunlight.AnalysisResult[] = [];
    // Flag for recursive call level detection
    const isTopLevel = !this._analyzing;
    // Only set time on top level calls
    const originalTime = isTopLevel
      ? this._viewer.clock.currentTime.clone()
      : undefined;

    if (isTopLevel) {
      this._analyzing = true;
    }

    try {
      if (time instanceof JulianDate) {
        // Single time analysis
        // Implement single time analysis
        // Create point entity (set point size as error boundary if necessary) for collision test at `from`.
        // Set clock.currentTime to time, then call render.
        // Execute ray collision detection (pick)
        this._viewer.clock.currentTime = time;
        this._viewer.scene.render();

        return {
          timestamp: time.toString(),
        };
      } else {
        // Time range analysis
        const { start, end, step } = time;
        let t = start.clone();
        while (JulianDate.compare(t, end) <= 0) {
          result.push(this.analyze(from, t, options));
          JulianDate.addSeconds(t, step, t);
        }
      }
    } finally {
      // Reset the viewer state to before analysis.
      if (isTopLevel && originalTime) {
        this._viewer.clock.currentTime = originalTime;
        this._viewer.scene.render();
        this._analyzing = false;
        // Clean up point entity used for collision detection
        if (this._pointEntityId)
          this._viewer.entities.removeById(this._pointEntityId);
      }
    }

    return result;
  }

  /**
   * Create a point entity for collision detection
   * @param at where to create the entity
   * @param errorBoundary size of the point entity for error tolerance
   */
  private _createPointEntity(at: Cartesian3, errorBoundary?: number): void {
    // Generate new point entity with error boundary size
    // Store the entity id
  }

  /**
   * Remove all instances created for debug purpose
   */
  clear(): void {
    this._debugEntities.forEach((entity) => {
      if (this._viewer.entities.contains(entity))
        this._viewer.entities.remove(entity);
    });
    this._debugEntities = [];
  }
}

namespace Sunlight {
  /** for time-range analysis */
  export interface TimeRange {
    /** When to start analysis */
    start: JulianDate;
    /** When to end analysis */
    end: JulianDate;
    /** Step interval (seconds) inside the range */
    step: number;
  }

  export interface AnalyzeOptions {
    /** List of objects to exclude from ray pick */
    objectsToExclude?: any[];
    /** size of the point entity for error tolerance */
    errorBoundary?: number;
    /** Whether to show sunlight paths */
    debugShowRays?: boolean;
    /** Whether to show points */
    debugShowPoints?: boolean;
  }

  export interface AnalysisResult {
    /** ISO time string */
    timestamp: string;
  }
}

export default Sunlight;
