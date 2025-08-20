import type { Clock, Viewer } from "cesium";
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
  private _clock: Clock;
  private _render: (time?: JulianDate) => void;
  private _analyzing: boolean = false;

  constructor(viewer: Viewer) {
    // @ts-expect-error Accessing internal APIs
    const { sunPositionWC, sunDirectionWC } = viewer.scene.context.uniformState;
    this._sunPositionWC = sunPositionWC;
    this._sunDirectionWC = sunDirectionWC;
    this._clock = viewer.clock;
    this._render = viewer.scene.render;
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
   * Gets a virtual position of sun, to reduce calculation overhead.
   *
   * @param from target point where to start from
   * @param radius virtual distance set between target point and the sun. defaults to 1000 (1km)
   */
  getVirtualSunPosition(from: Cartesian3, radius: number = 1000): Cartesian3 {
    // Get normalized vector between target point and sun position
    const n = Cartesian3.normalize(
      Cartesian3.subtract(this._sunPositionWC, from, new Cartesian3()),
      new Cartesian3(),
    );

    // multiply the vector by radius
    Cartesian3.multiplyByScalar(n, radius, n);
    return Cartesian3.add(from, n, new Cartesian3());
  }

  /**
   * Analyze the sunlight acceptance from given point at given time.
   * @param from target point where to analyze
   * @param at time when to analyze
   */
  analyze(
    from: Cartesian3,
    at: JulianDate,
    options?: Sunlight.AnalyzeOptions,
  ): void;
  analyze(
    from: Cartesian3,
    time: Sunlight.TimeRange,
    options?: Sunlight.AnalyzeOptions,
  ): void;
  analyze(
    from: Cartesian3,
    time: JulianDate | Sunlight.TimeRange,
    options?: Sunlight.AnalyzeOptions,
  ) {
    // Flag for recursive call level detection
    const isTopLevel = !this._analyzing;
    // Only set time on top level calls
    const originalTime = isTopLevel
      ? this._clock.currentTime.clone()
      : undefined;

    if (isTopLevel) {
      this._analyzing = true;
    }

    try {
      if (time instanceof JulianDate) {
        // Single time analysis
        // implement single time analyze
        // Create point entity (set point size as error boundary if necessary) for collision test at `from`.
        // Set clock.currentTime as time, then call render.
        // Execute ray collision detection (pick)
        this._clock.currentTime = time;
        this._render();
        return;
      }

      // Time range analysis
      const { start, end, step } = time;
      let t = start.clone();
      while (JulianDate.compare(t, end) <= 0) {
        this.analyze(from, t, options);
        JulianDate.addSeconds(t, step, t);
      }
    } finally {
      // Reset the viewer state as before analysis.
      if (isTopLevel && originalTime) {
        this._clock.currentTime = originalTime;
        this._render();
        this._analyzing = false;
      }
    }
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

  /** Debug options for analysis */
  export interface AnalyzeOptions {
    showPaths?: boolean;
  }
}

export default Sunlight;
