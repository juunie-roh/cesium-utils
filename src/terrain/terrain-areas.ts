import { TerrainArea } from './terrain-area.js';

export default class TerrainAreas extends Array<TerrainArea> {
  /**
   * Adds a new terrain area to the collection.
   * @param area A TerrainArea instance or constructor options
   * @returns A promise that resolves to the index of the added item
   */
  async add(
    area: TerrainArea | TerrainArea.ConstructorOptions,
  ): Promise<number>;
  /**
   * Adds terrain areas to the collection.
   * @param areas An array of TerrainArea instance or constructor options
   * @returns A promise that resolves to the index of the added item
   */
  async add(
    areas: (TerrainArea | TerrainArea.ConstructorOptions)[],
  ): Promise<number>;
  async add(
    target:
      | (TerrainArea | TerrainArea.ConstructorOptions)
      | (TerrainArea | TerrainArea.ConstructorOptions)[],
  ): Promise<number> {
    if (Array.isArray(target)) {
      for (const t of target) {
        await this.add(t);
      }
      return this.length;
    }

    let terrainArea: TerrainArea;

    if (target instanceof TerrainArea) {
      terrainArea = target;
    } else {
      terrainArea = await TerrainArea.create(target);
    }

    // Add to collection after terrain area is ready
    return this.push(terrainArea);
  }

  /**
   * Removes a terrain area from the collection.
   */
  remove(area: TerrainArea): this;
  /**
   * Removes multiple terrain areas from the collection.
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
