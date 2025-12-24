import {
  Cartesian3,
  Color,
  Entity,
  EntityCollection,
  JulianDate,
  Material,
  PolylineCollection,
  Ray,
  Viewer,
} from "cesium";

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
  private _uniformState: any;
  private _viewer: Viewer;
  private _analyzing: boolean = false;
  private _pointEntityId?: string;
  private _objectsToExclude: any[] = [];
  // Debugging Objects
  private _polylines: PolylineCollection;
  private _points: EntityCollection;

  constructor(viewer: Viewer) {
    // @ts-expect-error Accessing internal APIs
    this._uniformState = viewer.scene.context.uniformState;
    this._viewer = viewer;
    this._polylines = viewer.scene.primitives.add(new PolylineCollection());
    this._points = new EntityCollection();
    viewer.entities.add(this._points);
  }

  /** The sun position in 3D world coordinates at the current scene time. */
  get sunPositionWC(): Cartesian3 {
    return this._uniformState._sunPositionWC;
  }

  /** A normalized vector to the sun in 3D world coordinates at the current scene time. */
  get sunDirectionWC(): Cartesian3 {
    return this._uniformState._sunDirectionWC;
  }

  /** Whether sunlight analysis is currently in progress. */
  get isAnalyzing(): boolean {
    return this._analyzing;
  }

  /**
   * Gets virtual position and direction of the sun to reduce calculation overhead.
   *
   * @param from target point to start from
   * @param radius virtual distance between target point and the sun. Defaults to 10000 (10km)
   */
  virtualSun(
    from: Cartesian3,
    radius: number = 10000,
  ): { position: Cartesian3; direction: Cartesian3 } {
    // Get normalized vector between target point and sun position
    const p = Cartesian3.normalize(
      Cartesian3.subtract(this.sunPositionWC, from, new Cartesian3()),
      new Cartesian3(),
    );
    // Multiply the vector by radius
    Cartesian3.multiplyByScalar(p, radius, p);

    return {
      position: Cartesian3.add(from, p, new Cartesian3()),
      // Get direction from sun position towards target point
      direction: Cartesian3.normalize(
        Cartesian3.subtract(from, this.sunPositionWC, new Cartesian3()),
        new Cartesian3(),
      ),
    };
  }

  /**
   * Analyze the sunlight acceptance from a given point at a given time.
   * @param from target point to analyze
   * @param at time to analyze
   * @param options {@link Sunlight.AnalyzeOptions}
   */
  async analyze(
    from: Cartesian3,
    at: JulianDate,
    options?: Sunlight.AnalyzeOptions,
  ): Promise<Sunlight.AnalysisResult>;
  /**
   * Analyze the sunlight acceptance from a given point at a given time range.
   * @param from target point to analyze
   * @param range time range to analyze
   * @param options {@link Sunlight.AnalyzeOptions}
   */
  async analyze(
    from: Cartesian3,
    range: Sunlight.TimeRange,
    options?: Sunlight.AnalyzeOptions,
  ): Promise<Sunlight.AnalysisResult[]>;
  async analyze(
    from: Cartesian3,
    time: JulianDate | Sunlight.TimeRange,
    options?: Sunlight.AnalyzeOptions,
  ): Promise<Sunlight.AnalysisResult | Sunlight.AnalysisResult[]> {
    if (!this._pointEntityId) {
      throw new Error(
        "Analyze error boundary hasn't been set. Create Error boundary entity first using createDetectionEllipsoid first.",
      );
    }

    const originalTime = this._viewer.clock.currentTime.clone();
    this._analyzing = true;

    try {
      if (time instanceof JulianDate) {
        return await this._analyzeSingleTime(from, time, options);
      } else {
        return await this._analyzeTimeRange(from, time, options);
      }
    } finally {
      // Reset the viewer state to before analysis.
      this._viewer.clock.currentTime = originalTime;
      this._viewer.scene.render();
      this._analyzing = false;
    }
  }

  /**
   * Remove all instances created for debug purpose
   */
  clear(): void {
    this._objectsToExclude = [];
    if (this._points.values.length > 0) this._points.removeAll();
    if (this._polylines.length > 0) this._polylines.removeAll();
  }

  /**
   * Create an ellipsoid entity for ray collision detection to complement cesium's native click event accuracy
   * @param at where to create the entity
   * @param show whether to show point entity
   * @param errorBoundary size of the point entity for error tolerance
   */
  setTargetPoint(
    at: Cartesian3,
    show?: boolean,
    errorBoundary?: number,
    color: Color = Color.LIMEGREEN.withAlpha(0.8),
  ): Entity {
    if (this._pointEntityId) {
      this._viewer.entities.removeById(this._pointEntityId);
    }

    // Generate new point entity with error boundary size
    const r = errorBoundary ?? 3;
    const e = this._viewer.entities.add(
      new Entity({
        ellipsoid: {
          show,
          radii: new Cartesian3(r, r, r),
          material: show ? color : undefined,
          fill: true,
        },
        position: at,
        id: Sunlight.DETECTION_ELLIPSOID_ID,
      }),
    );
    // tracking entity id
    this._pointEntityId = e.id;

    // Wait for entity to be processed and rendered
    this._viewer.scene.render();

    return e;
  }

  private async _analyzeSingleTime(
    from: Cartesian3,
    time: JulianDate,
    options?: Sunlight.AnalyzeOptions,
  ): Promise<Sunlight.AnalysisResult> {
    // Set clock.currentTime to time, then call render after update cycle
    this._viewer.clock.currentTime = time;

    // Wait for uniform state to update with new time before rendering
    this._viewer.scene.render(time);

    const positions = [from, this.virtualSun(from).position];
    // Draw polyline entity on debug option enabled
    if (options?.debugShowRays) {
      const line = this._polylines.add({
        show: true,
        positions,
        width: 5,
        material: new Material({
          fabric: {
            type: "Color",
            uniforms: { color: Color.YELLOW.withAlpha(0.5) },
          },
        }),
      });

      this._objectsToExclude.push(line);
      // this._viewer.entities.add(e);
    }

    const picked = await this._pick(from, options?.objectsToExclude);

    return {
      timestamp: time.toString(),
      result: !picked ? false : picked.object?.id?.id === this._pointEntityId,
    };
  }

  private async _analyzeTimeRange(
    from: Cartesian3,
    timeRange: Sunlight.TimeRange,
    options?: Sunlight.AnalyzeOptions,
  ): Promise<Sunlight.AnalysisResult[]> {
    const results: Sunlight.AnalysisResult[] = [];
    const { start, end, step } = timeRange;
    let t = start.clone();
    while (JulianDate.compare(t, end) <= 0) {
      results.push(await this._analyzeSingleTime(from, t, options));
      JulianDate.addSeconds(t, step, t);
    }
    return results;
  }

  /**
   * @returns A promise tht resolves to an object containing the object and position of the first intersection.
   * @see https://github.com/CesiumGS/cesium/blob/1.136/packages/engine/Source/Scene/Scene.js#L4868
   */
  private async _pick(
    from: Cartesian3,
    objectsToExclude?: any[],
    width = 0.1,
  ): Promise<{ [key: string]: any }> {
    const { position, direction } = this.virtualSun(from);
    const ray = new Ray(position, direction);
    // @ts-expect-error Accessing internal APIs
    const picked = await this._viewer.scene.pickFromRayMostDetailed(
      ray,
      this._getExcludedObjects(objectsToExclude),
      width,
    );

    return picked;
  }

  private _getExcludedObjects(objectsToExclude?: any[]): any[] {
    return [...this._objectsToExclude, ...(objectsToExclude ?? [])];
  }
}

namespace Sunlight {
  export const DETECTION_ELLIPSOID_ID = "sunlight-detection-ellipsoid";
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
    /** Whether the sunlight has reached */
    result: boolean | any;
  }
}

export default Sunlight;
