import { Color, Entity, Ray, Viewer } from "cesium";
import { Cartesian3, JulianDate } from "cesium";

/**
 * @since Cesium 1.132.0
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
  private _debugEntityIds: string[] = [];

  constructor(viewer: Viewer) {
    // @ts-expect-error Accessing internal APIs
    const { sunPositionWC, sunDirectionWC } = viewer.scene.context.uniformState;
    this._sunPositionWC = sunPositionWC;
    this._sunDirectionWC = sunDirectionWC;
    this._viewer = viewer;
  }

  /** The sun position in 3D world coordinates at the current scene time. */
  get sunPositionWC(): Cartesian3 {
    return this._sunPositionWC;
  }

  /** A normalized vector to the sun in 3D world coordinates at the current scene time. */
  get sunDirectionWC(): Cartesian3 {
    return this._sunDirectionWC;
  }

  /** Whether sunlight analysis is currently in progress. */
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
   * @param options {@link Sunlight.AnalyzeOptions}
   */
  analyze(
    from: Cartesian3,
    at: JulianDate,
    options?: Sunlight.AnalyzeOptions,
  ): Sunlight.AnalysisResult;
  /**
   * Analyze the sunlight acceptance from a given point at a given time range.
   * @param from target point to analyze
   * @param range time range to analyze
   * @param options {@link Sunlight.AnalyzeOptions}
   */
  analyze(
    from: Cartesian3,
    range: Sunlight.TimeRange,
    options?: Sunlight.AnalyzeOptions,
  ): Sunlight.AnalysisResult[];
  analyze(
    from: Cartesian3,
    time: JulianDate | Sunlight.TimeRange,
    options?: Sunlight.AnalyzeOptions,
  ): Sunlight.AnalysisResult | Sunlight.AnalysisResult[] {
    const results: Sunlight.AnalysisResult[] = [];
    // Flag for recursive call level detection
    const isTopLevel = !this._analyzing;
    // Only set time on top level calls
    const originalTime = isTopLevel
      ? this._viewer.clock.currentTime.clone()
      : undefined;

    if (isTopLevel) {
      // Create point entity (set point size as error boundary if necessary) for collision test at `from`.
      this._viewer.entities.add(
        this._createPointEntity(
          from,
          options?.debugShowPoints,
          options?.errorBoundary,
        ),
      );
      this._analyzing = true;
    }

    try {
      if (time instanceof JulianDate) {
        // Single time analysis

        // Set clock.currentTime to time, then call render.
        this._viewer.clock.currentTime = time;
        this._viewer.scene.render();

        // Create ray instance
        const ray = new Ray(
          this.getVirtualSunPosition(from),
          this._sunDirectionWC,
        );
        // Draw polyline entity on debug option enabled
        if (options?.debugShowRays) {
          const e = new Entity({
            polyline: {
              positions: [this.getVirtualSunPosition(from), from],
              width: 10,
              material: Color.YELLOW.withAlpha(0.5),
            },
          });

          this._debugEntityIds.push(e.id);
          this._viewer.entities.add(e);
        }

        // Execute ray collision detection (pick)
        // @ts-expect-error Accessing internal APIs
        const picking = this._viewer.scene.picking;
        /**
         * @returns
         * const results = getRayIntersections();
         * if (results.length > 0)
         *   return results[0]: { object: object, position: position, exclude: unknown };
         */
        const { object, position } = picking.pickFromRay(
          picking,
          this._viewer.scene,
          ray,
          [
            ...this._debugEntityIds
              .map((id) => this._viewer.entities.getById(id))
              .filter(Boolean),
            ...(options?.objectsToExclude ?? []),
          ],
        );
        const result =
          object instanceof Entity && object.id === this._pointEntityId;

        // Show collision points
        if (options?.debugShowPoints && position) {
          const e = new Entity({
            point: { show: true, pixelSize: 5 },
            position,
          });

          this._debugEntityIds.push(e.id);
          this._viewer.entities.add(e);
        }

        return {
          timestamp: time.toString(),
          result,
        };
      } else {
        // Time range analysis
        const { start, end, step } = time;
        let t = start.clone();
        while (JulianDate.compare(t, end) <= 0) {
          results.push(this.analyze(from, t, options));
          JulianDate.addSeconds(t, step, t);
        }
      }
    } finally {
      // Reset the viewer state to before analysis.
      if (isTopLevel && originalTime) {
        this._viewer.clock.currentTime = originalTime;
        this._viewer.scene.render();
        this._analyzing = false;
        // If it isn't showing debug point entities:
        if (this._pointEntityId && !options?.debugShowPoints)
          // Clean up point entity used for collision detection
          this._viewer.entities.removeById(this._pointEntityId);
      }
    }

    return results;
  }

  /**
   * Create a point entity for collision detection
   * @param at where to create the entity
   * @param show whether to show point entity
   * @param errorBoundary size of the point entity for error tolerance
   */
  private _createPointEntity(
    at: Cartesian3,
    show?: boolean,
    errorBoundary?: number,
  ): Entity {
    // Generate new point entity with error boundary size
    const e = new Entity({
      point: {
        show,
        pixelSize: errorBoundary ?? 5, // fallback to default size as 5
      },
      position: at,
    });
    // tracking entity id
    this._pointEntityId = e.id;

    return e;
  }

  /**
   * Remove all instances created for debug purpose
   */
  clear(): void {
    this._debugEntityIds.forEach((id) => this._viewer.entities.removeById(id));
    this._debugEntityIds = [];

    if (this._pointEntityId)
      this._viewer.entities.removeById(this._pointEntityId);
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
    /** Whether to show sunlight paths, NOT IMPLEMENTED YET */
    debugShowRays?: boolean;
    /** Whether to show points */
    debugShowPoints?: boolean;
  }

  export interface AnalysisResult {
    /** ISO time string */
    timestamp: string;
    /** Whether the sunlight has reached */
    result: boolean;
  }
}

export default Sunlight;
