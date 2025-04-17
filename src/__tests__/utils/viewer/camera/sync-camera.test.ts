import { Viewer } from 'cesium';
import { describe, expect, it, vi } from 'vitest';

import { syncCamera } from '@/utils/viewer/camera/sync-camera.js';

describe('syncCamera', () => {
  it('should copy camera properties from source to destination viewer', () => {
    // Setup mock camera properties with clone methods
    const mockPositionWC = { clone: vi.fn().mockReturnValue('position-clone') };
    const mockDirectionWC = {
      clone: vi.fn().mockReturnValue('direction-clone'),
    };
    const mockUpWC = { clone: vi.fn().mockReturnValue('up-clone') };

    // Create mock source viewer
    const source = {
      camera: {
        positionWC: mockPositionWC,
        directionWC: mockDirectionWC,
        upWC: mockUpWC,
      },
    };

    // Create mock destination viewer
    const dest = {
      camera: {
        position: 'original-position',
        direction: 'original-direction',
        up: 'original-up',
      },
    };

    // Call the function
    syncCamera(source as unknown as Viewer, dest as unknown as Viewer);

    // Verify camera properties were copied correctly
    expect(mockPositionWC.clone).toHaveBeenCalledTimes(1);
    expect(mockDirectionWC.clone).toHaveBeenCalledTimes(1);
    expect(mockUpWC.clone).toHaveBeenCalledTimes(1);
    expect(dest.camera.position).toBe('position-clone');
    expect(dest.camera.direction).toBe('direction-clone');
    expect(dest.camera.up).toBe('up-clone');
  });

  it('should not modify destination if source is undefined', () => {
    // Create mock destination with initial values
    const dest = {
      camera: {
        position: 'original-position',
        direction: 'original-direction',
        up: 'original-up',
      },
    };

    // Call the function with undefined source
    syncCamera(undefined as unknown as Viewer, dest as unknown as Viewer);

    // Verify camera properties were not changed
    expect(dest.camera.position).toBe('original-position');
    expect(dest.camera.direction).toBe('original-direction');
    expect(dest.camera.up).toBe('original-up');
  });

  it('should not throw if destination is undefined', () => {
    // Create mock source viewer
    const source = {
      camera: {
        positionWC: { clone: vi.fn() },
        directionWC: { clone: vi.fn() },
        upWC: { clone: vi.fn() },
      },
    };

    // This should not throw an error
    expect(() => {
      syncCamera(source as unknown as Viewer, undefined as unknown as Viewer);
    }).not.toThrow();
  });

  it('should handle null values', () => {
    // Create mock viewers
    const source = {
      camera: {
        positionWC: { clone: vi.fn() },
        directionWC: { clone: vi.fn() },
        upWC: { clone: vi.fn() },
      },
    };
    const dest = {
      camera: {
        position: 'original-position',
        direction: 'original-direction',
        up: 'original-up',
      },
    };

    // These should not throw errors
    expect(() => {
      syncCamera(null as unknown as Viewer, dest as unknown as Viewer);
      syncCamera(source as unknown as Viewer, null as unknown as Viewer);
    }).not.toThrow();

    // Verify destination was not modified when source is null
    expect(dest.camera.position).toBe('original-position');
    expect(dest.camera.direction).toBe('original-direction');
    expect(dest.camera.up).toBe('original-up');
  });
});
