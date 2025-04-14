import { TerrainArea } from './terrain-area.js';

export default class TerrainAreas extends Array<TerrainArea> {
  /**
   * Adds a new terrain area to the collection.
   * @param area A TerrainArea instance or constructor options
   * @returns A promise that resolves to the index of the added item
   */
  async add(
    area: TerrainArea | TerrainArea.ConstructorOptions,
  ): Promise<number> {
    let terrainArea: TerrainArea;

    if (area instanceof TerrainArea) {
      terrainArea = area;
    } else {
      // Use the factory method instead of constructor
      terrainArea = await TerrainArea.create(area);
    }

    // Add to collection after terrain area is ready
    return this.push(terrainArea);
  }

  /**
   * Removes a terrain area from the collection.
   */
  remove(area: TerrainArea): boolean {
    const index = this.indexOf(area);
    if (index >= 0) {
      this.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Clears all terrain areas.
   */
  clear(): void {
    this.length = 0;
  }
}
