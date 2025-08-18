import { Clock, JulianDate, Viewer } from "cesium";
import { Cartesian3 } from "cesium";

/**
 * @experimental
 * Sunlight analysis utility for shadow calculations.
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
  analyze(from: Cartesian3, at: JulianDate): void;
  analyze(from: Cartesian3, [start, end]: JulianDate[], interval: number): void;
  analyze(
    from: Cartesian3,
    time: JulianDate | JulianDate[],
    interval?: number,
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
      if (Array.isArray(time)) {
        if (time.length < 2)
          throw new Error("Invalid time range for sunlight analysis");
        if (!interval)
          throw new Error("Interval for sunlight analysis must be set");
        if (time.length > 2) console.warn("time range may invalid");

        const [start, end] = time;
        let t = start;
        while (JulianDate.compare(t, end) <= 0) {
          this.analyze(from, t);
          JulianDate.addMinutes(t, interval, t);
        }

        return;
      }

      // implement single time analyze
      // Create point entity (set point size as error boundary if necessary) for collision test at `from`.
      // Set clock.currentTime as at, then call render.
      // Execute ray collision detection (pick)
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

export default Sunlight;
