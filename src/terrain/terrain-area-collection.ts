import { TerrainArea } from "./terrain-area.js";

/**
 * @extends Array
 * @class
 * Collection-like Extended Array Class of `TerrainArea`.
 */
export default class TerrainAreaCollection extends Array<TerrainArea> {
  /**
   * Adds a new terrain area to the collection.
   * @param area A TerrainArea instance or constructor options
   * @returns The index of the added item
   */
  add(area: TerrainArea | TerrainArea.ConstructorOptions): number;
  /**
   * Adds terrain areas to the collection.
   * @param areas An array of TerrainArea instance or constructor options
   * @returns The index of the added item
   */
  add(areas: (TerrainArea | TerrainArea.ConstructorOptions)[]): number;
  add(
    target:
      | (TerrainArea | TerrainArea.ConstructorOptions)
      | (TerrainArea | TerrainArea.ConstructorOptions)[],
  ): number {
    if (Array.isArray(target)) {
      for (const t of target) {
        this.add(t);
      }
      return this.length;
    }

    let terrainArea: TerrainArea;

    if (target instanceof TerrainArea) {
      terrainArea = target;
    } else {
      terrainArea = new TerrainArea(target);
    }

    // Add to collection after terrain area is ready
    return this.push(terrainArea);
  }

  /**
   * Removes a terrain area from the collection.
   * @param area The terrain area to remove.
   */
  remove(area: TerrainArea): this;
  /**
   * Removes multiple terrain areas from the collection.
   * @param areas The terrain areas to remove.
   */
  remove(areas: TerrainArea[]): this;
  remove(target: TerrainArea | TerrainArea[]): this {
    if (Array.isArray(target)) {
      target.forEach((t) => this.remove(t));
      return this;
    }

    const index = this.indexOf(target);
    if (index >= 0) {
      this.splice(index, 1);
    }

    return this;
  }

  /**
   * Clears all terrain areas.
   */
  removeAll(): void {
    this.length = 0;
  }
}
